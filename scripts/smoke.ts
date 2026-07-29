/**
 * 実動確認。
 *   npm run build && npm run smoke
 *
 * 1. preview サーバを立てる
 * 2. 全ルートを順に訪問し、console error / pageerror が 1 件も出ないことを確かめる
 * 3. 各章でデモのキャンバスが実際に生成されているかを見る
 * 4. 14章を連続で行き来しても WebGL コンテキストが枯渇しないことを確かめる
 * 5. ダーク／ライト両テーマでコントラスト比を実測する
 * 6. スクリーンショットを artifacts/ に保存する（目視確認用）
 */

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import type { Browser, ConsoleMessage, Page } from 'playwright';
import { chapters } from '../src/content/index.ts';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/webgl_manabe/`;
const OUT = 'artifacts';

const problems: string[] = [];

function fail(message: string): void {
  problems.push(message);
  console.error(`  NG  ${message}`);
}

function ok(message: string): void {
  console.log(`  ok  ${message}`);
}

/**
 * Playwright が期待するビルド番号と、環境に置かれている Chromium のビルド番号は
 * ずれていることがある。あるものを探して使う（無ければ Playwright の既定に任せる）。
 */
function findChromium(): string | undefined {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  for (const entry of readdirSync(root)) {
    if (!entry.startsWith('chromium-')) continue;
    const candidate = join(root, entry, 'chrome-linux', 'chrome');
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* まだ起動していない */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview サーバが ${timeoutMs}ms 以内に起動しませんでした: ${url}`);
}

/** WCAG のコントラスト比。 */
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const luminance = (rgb: [number, number, number]): number => {
    const [r, g, bl] = rgb.map((value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function parseRgb(input: string): [number, number, number] {
  const match = input.match(/-?\d+(\.\d+)?/g);
  if (!match || match.length < 3) throw new Error(`色として読めません: ${input}`);
  return [Number(match[0]), Number(match[1]), Number(match[2])];
}

interface Recorder {
  errors: string[];
  reset(): void;
}

function watch(page: Page): Recorder {
  const errors: string[] = [];

  const onConsole = (message: ConsoleMessage): void => {
    const type = message.type();
    const text = message.text();
    if (type === 'error') errors.push(`console.error: ${text}`);
    // ブラウザが出す WebGL コンテキスト枯渇の警告は、破棄漏れの決定的な証拠
    if (/too many active webgl contexts/i.test(text)) {
      errors.push(`WebGL コンテキスト枯渇: ${text}`);
    }
  };

  page.on('console', onConsole);
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  return {
    errors,
    reset: () => {
      errors.length = 0;
    },
  };
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });

  const server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'ignore' },
  );

  let browser: Browser | undefined;

  try {
    await waitForServer(BASE);
    console.log(`preview: ${BASE}`);

    const executablePath = findChromium();
    browser = await chromium.launch({
      executablePath,
      // 3D デモを描くので、ソフトウェア GL を明示的に有効にしておく
      args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle'],
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const recorder = watch(page);

    /* ---- トップ・用語集・マップ ---- */

    for (const [path, name] of [
      ['#/', 'home'],
      ['#/glossary', 'glossary'],
      ['#/map', 'map'],
    ] as const) {
      recorder.reset();
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      if (recorder.errors.length > 0) fail(`${name}: ${recorder.errors.join(' / ')}`);
      else ok(`${name} を表示`);
    }

    /* ---- 全14章を連続で訪問（同一セッションのまま） ---- */

    for (const chapter of chapters) {
      recorder.reset();
      await page.goto(`${BASE}#/ch/${chapter.slug}`);
      await page.waitForLoadState('networkidle');
      // デモの動的 import とマウントを待つ
      await page.waitForTimeout(900);

      const demoCount = chapter.blocks.filter((block) => block.kind === 'demo').length;
      const canvasCount = await page.locator('.demo__stage canvas').count();
      const stillLoading = await page.getByText('デモを読み込んでいます').count();
      const broken = await page.getByText('このデモは表示できませんでした').count();

      if (canvasCount !== demoCount) {
        fail(`CH.${chapter.number} ${chapter.slug}: キャンバス ${canvasCount} 個（期待 ${demoCount} 個）`);
      }
      if (stillLoading > 0) fail(`CH.${chapter.number}: 読み込み中のままのデモがあります`);
      if (broken > 0) fail(`CH.${chapter.number}: 表示に失敗したデモがあります`);
      if (recorder.errors.length > 0) {
        fail(`CH.${chapter.number} ${chapter.slug}: ${recorder.errors.join(' / ')}`);
      }
      if (
        canvasCount === demoCount &&
        stillLoading === 0 &&
        broken === 0 &&
        recorder.errors.length === 0
      ) {
        ok(`CH.${String(chapter.number).padStart(2, '0')} ${chapter.slug}（デモ ${demoCount} 個）`);
      }

      await page.screenshot({ path: `${OUT}/ch-${chapter.slug}.png`, fullPage: false });
    }

    // ここまで 14 章ぶんを同じタブで開いた。まだ描けているなら破棄は効いている
    const lastCanvas = page.locator('.demo__stage canvas').first();
    const alive = await lastCanvas.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      return canvas.width > 0 && canvas.height > 0;
    });
    if (alive) ok('14章を連続で開いても WebGL コンテキストが生きている');
    else fail('最後の章のキャンバスが失われています（破棄漏れの疑い）');

    /* ---- コントラスト比の実測 ---- */

    for (const theme of ['dark', 'light'] as const) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await page.waitForTimeout(120);

      const colors = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const read = (name: string): string => style.getPropertyValue(name).trim();
        const probe = document.createElement('span');
        document.body.appendChild(probe);
        const resolve = (value: string): string => {
          probe.style.color = value;
          return getComputedStyle(probe).color;
        };
        const result = {
          bg: resolve(read('--bg')),
          text: resolve(read('--text')),
          muted: resolve(read('--text-muted')),
          link: resolve(read('--neon-cyan')),
          border: resolve(read('--border')),
        };
        probe.remove();
        return result;
      });

      const bg = parseRgb(colors.bg);
      const checks: [string, number, number][] = [
        ['本文', contrast(parseRgb(colors.text), bg), 7],
        ['補助テキスト', contrast(parseRgb(colors.muted), bg), 4.5],
        ['リンク', contrast(parseRgb(colors.link), bg), 4.5],
        ['枠線', contrast(parseRgb(colors.border), bg), 1.2],
      ];

      for (const [label, ratio, required] of checks) {
        const line = `${theme} / ${label}: ${ratio.toFixed(2)}:1（必要 ${required}:1）`;
        if (ratio >= required) ok(line);
        else fail(line);
      }

      await page.screenshot({ path: `${OUT}/theme-${theme}.png`, fullPage: false });
    }

    /* ---- 動きを減らす設定でも開けること ---- */

    const reduced = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
    });
    const reducedPage = await reduced.newPage();
    const reducedRecorder = watch(reducedPage);
    await reducedPage.goto(`${BASE}#/ch/14-capstone`);
    await reducedPage.waitForLoadState('networkidle');
    await reducedPage.waitForTimeout(900);
    if (reducedRecorder.errors.length > 0) {
      fail(`prefers-reduced-motion: ${reducedRecorder.errors.join(' / ')}`);
    } else {
      ok('prefers-reduced-motion: reduce でも章を開ける');
    }
    await reducedPage.screenshot({ path: `${OUT}/reduced-motion.png` });
    await reduced.close();

    /* ---- 狭い画面 ---- */

    const mobile = await browser.newContext({ viewport: { width: 390, height: 780 } });
    const mobilePage = await mobile.newPage();
    const mobileRecorder = watch(mobilePage);
    await mobilePage.goto(`${BASE}#/ch/03-dot`);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.waitForTimeout(900);
    const overflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) fail(`狭い画面で横に ${overflow}px はみ出しています`);
    else ok('狭い画面で横スクロールが発生しない');
    if (mobileRecorder.errors.length > 0) fail(`mobile: ${mobileRecorder.errors.join(' / ')}`);
    await mobilePage.screenshot({ path: `${OUT}/mobile.png`, fullPage: false });
    await mobile.close();

    await context.close();
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }

  console.log('');
  if (problems.length > 0) {
    console.error(`${problems.length} 件の問題が見つかりました。`);
    process.exit(1);
  }
  console.log(`すべて通過しました。スクリーンショットは ${OUT}/ にあります。`);
}

await main();
