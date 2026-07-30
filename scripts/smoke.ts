/**
 * 実動確認。
 *   npm run build && npm run smoke
 *
 * 1. preview サーバを立てる
 * 2. 全ルートを順に訪問し、console error / pageerror が 1 件も出ないことを確かめる
 * 3. 各章でデモのキャンバスが実際に生成されているかを見る
 * 4. サンドボックスが自動実行され、iframe の中にキャンバスを作ることを確かめる
 * 5. 全章を連続で行き来しても WebGL コンテキストが枯渇しないことを確かめる
 * 6. ダーク／ライト両テーマでコントラスト比を実測する
 * 7. スクリーンショットを artifacts/ に保存する（目視確認用）
 */

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import type { Browser, ConsoleMessage, Page } from 'playwright';
import { chapterLabel, chapters } from '../src/content/index.ts';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/webgl_manabe/`;
const OUT = 'artifacts';

const problems: string[] = [];

/*
 * 章の数が増えると、全章を 1 回で踏むのは CI では長すぎる。
 * `npm run smoke -- --part=basics` のように部を指定して分割できるようにし、
 * CI では部ごとに並列で走らせる。指定が無ければ、これまでどおり全章を踏む。
 */
const partArg = process.argv.find((a) => a.startsWith('--part='))?.slice('--part='.length);
const targetChapters = partArg ? chapters.filter((c) => c.part === partArg) : chapters;

if (partArg && targetChapters.length === 0) {
  console.error(`--part=${partArg} に当てはまる章がありません`);
  process.exit(1);
}

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

/**
 * ページが落ち着くのを待つ。
 *
 * networkidle は使わない。サンドボックスの iframe は blob: のモジュールを読みに行くが、
 * 章を移るとその途中で iframe ごと外される。外された要求は「進行中」のまま残るので、
 * ネットワークが静かになる瞬間が二度と来ない章がある（CI で 30 秒待って落ちた）。
 * 代わりに、出ているべきものが出たかどうかで判断する。
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => (document.querySelector('#main')?.childElementCount ?? 0) > 0);
}

/**
 * 条件が満たされるまで待つ。満たされなければ待った分だけ諦める（失敗にはしない ―
 * そのあとの検査が本当の判定をする）。CI の実行機は手元よりずっと遅いので、
 * 固定の待ち時間では足りないことがある。
 */
async function waitUntil(
  page: Page,
  condition: () => Promise<boolean>,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await condition()) return true;
    if (Date.now() >= deadline) return false;
    await page.waitForTimeout(250);
  }
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
      ['#/help', 'help'],
      ['#/drill', 'drill'],
    ] as const) {
      recorder.reset();
      await page.goto(`${BASE}${path}`);
      await settle(page);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      if (recorder.errors.length > 0) fail(`${name}: ${recorder.errors.join(' / ')}`);
      else ok(`${name} を表示`);
    }

    /* ---- ホームの「続きから」は必ず 1 枚 ---- */

    // 0 枚だと次の一手が示せず、2 枚だと選ばせることになる。どちらも困る
    await page.goto(`${BASE}#/`);
    await settle(page);
    const resumeCards = await page.locator('.resume').count();
    if (resumeCards === 1) ok('ホームの「続きから」が 1 枚だけ出ている');
    else fail(`ホームの「続きから」が ${resumeCards} 枚あります（1 枚であるべき）`);

    /* ---- 演習ページ ---- */

    await page.goto(`${BASE}#/drill`);
    await settle(page);
    const drillItems = await page.locator('.ex').count();
    const expectedExercises = chapters.reduce((sum, c) => sum + (c.exercises?.length ?? 0), 0);
    if (drillItems === expectedExercises) ok(`演習ページに ${drillItems} 問すべて出ている`);
    else fail(`演習ページの問題が ${drillItems} 問（期待 ${expectedExercises} 問）`);

    // 通しモードは「次へ」で進むこと
    // 部の id は決め打ちにしない（部の構成が変わると、ここだけ黙って壊れる）
    const runPart = chapters[0]?.part ?? 'all';
    await page.goto(`${BASE}#/drill/run/${runPart}`);
    await settle(page);
    const posBefore = await page.locator('.drill-run__pos').textContent();
    await page.locator('.drill-run__nav .btn').last().click();
    await page.waitForTimeout(200);
    const posAfter = await page.locator('.drill-run__pos').textContent();
    if (posBefore !== posAfter) ok(`演習を通しで解ける（${posBefore} → ${posAfter}）`);
    else fail(`「次へ」を押しても問題が進みません（${posBefore} のまま）`);

    // 「解いた」印がリロードをまたいで残ること。
    // 通しモードはリロードで 1 問目に戻るので、印は一覧のほうで数える
    await page.locator('.ex__done').first().click();
    await page.waitForTimeout(150);
    await page.reload();
    await settle(page);
    await page.goto(`${BASE}#/drill`);
    await settle(page);
    const kept = await page.locator('.ex__done--on').count();
    if (kept === 1) ok('演習の「解いた」印がリロード後も残る');
    else fail(`演習の「解いた」印が ${kept} 個（1 個であるべき）`);
    await page.evaluate(() => localStorage.removeItem('webgl-manabe:exercises:v1'));

    /* ---- 全章を連続で訪問（同一セッションのまま） ---- */

    for (const chapter of targetChapters) {
      const label = chapterLabel(chapter);
      recorder.reset();
      await page.goto(`${BASE}#/ch/${chapter.slug}`);
      await settle(page);

      const demoCount = chapter.blocks.filter((block) => block.kind === 'demo').length;
      const sandboxCount = chapter.blocks.filter((block) => block.kind === 'sandbox').length;

      // デモは動的 import のあとにマウントされる。出そろうまで待つ
      if (demoCount > 0) {
        await waitUntil(page, async () => (await page.locator('.demo__stage canvas').count()) >= demoCount, 20_000);
      }
      await page.waitForTimeout(600);

      // サンドボックスは画面に入ったときに自動実行されるので、順に送ってやる
      if (sandboxCount > 0) {
        const cards = page.locator('.sandbox');
        for (let i = 0; i < sandboxCount; i += 1) {
          await cards.nth(i).scrollIntoViewIfNeeded();
          // iframe の中でキャンバスができるまで。CI では数秒かかることがある
          await waitUntil(
            page,
            async () => {
              const handle = await page.locator('.sandbox__frame').nth(i).elementHandle();
              const inner = await handle?.contentFrame();
              return inner ? (await inner.locator('canvas').count()) > 0 : false;
            },
            20_000,
          );
        }
        await page.evaluate(() => window.scrollTo({ top: 0 }));
        // 最初の 1 フレームだけ描いて落ちる書き方を見逃さないよう、少し様子を見る
        await page.waitForTimeout(700);
      }

      // 数式には必ず計算例が付いている（check-content が強制しているが、描画も確かめる）
      const formulaCount = chapter.blocks.filter((block) => block.kind === 'formula').length;
      if (formulaCount > 0) {
        const workedCount = await page.locator('.worked').count();
        if (workedCount !== formulaCount) {
          fail(`${label} ${chapter.slug}: 計算例 ${workedCount} 個（数式 ${formulaCount} 個）`);
        }
      }

      const canvasCount = await page.locator('.demo__stage canvas').count();
      const stillLoading = await page.getByText('デモを読み込んでいます').count();
      const broken = await page.getByText('このデモは表示できませんでした').count();

      if (canvasCount !== demoCount) {
        fail(`${label} ${chapter.slug}: キャンバス ${canvasCount} 個（期待 ${demoCount} 個）`);
      }
      if (stillLoading > 0) fail(`${label}: 読み込み中のままのデモがあります`);
      if (broken > 0) fail(`${label}: 表示に失敗したデモがあります`);
      // サンドボックスは iframe の中でキャンバスを作る
      let sandboxOk = true;
      if (sandboxCount > 0) {
        const frames = await page.locator('.sandbox__frame').count();
        if (frames !== sandboxCount) {
          fail(`${label} ${chapter.slug}: サンドボックスの実行枠が ${frames} 個（期待 ${sandboxCount} 個）`);
          sandboxOk = false;
        }
        for (let i = 0; i < frames; i += 1) {
          const handle = await page.locator('.sandbox__frame').nth(i).elementHandle();
          const inner = await handle?.contentFrame();
          const canvases = inner ? await inner.locator('canvas').count() : 0;
          if (canvases === 0) {
            fail(`${label} ${chapter.slug}: ${i + 1} つ目のサンドボックスがキャンバスを作りませんでした`);
            sandboxOk = false;
          }
        }
        const errorMessages = await page
          .locator(".sandbox__msg[data-tone='error']")
          .allTextContents();
        if (errorMessages.length > 0) {
          fail(`${label} ${chapter.slug}: サンドボックスがエラーを出しました ${errorMessages.join(' / ')}`);
          sandboxOk = false;
        }
      }

      if (recorder.errors.length > 0) {
        fail(`${label} ${chapter.slug}: ${recorder.errors.join(' / ')}`);
      }
      if (
        canvasCount === demoCount &&
        stillLoading === 0 &&
        broken === 0 &&
        sandboxOk &&
        recorder.errors.length === 0
      ) {
        const parts = [
          demoCount > 0 ? `デモ ${demoCount} 個` : null,
          sandboxCount > 0 ? `サンドボックス ${sandboxCount} 個` : null,
        ].filter(Boolean);
        ok(`${label} ${chapter.slug}（${parts.join('・') || '本文のみ'}）`);
      }

      await page.screenshot({ path: `${OUT}/ch-${chapter.slug}.png`, fullPage: false });
    }

    // ここまで全章を同じタブで開いた。デモのある章に戻って、まだ描けるなら破棄は効いている
    await page.goto(`${BASE}#/ch/14-capstone`);
    await settle(page);
    await waitUntil(page, async () => (await page.locator('.demo__stage canvas').count()) > 0, 20_000);
    await page.waitForTimeout(600);
    const lastCanvas = page.locator('.demo__stage canvas').first();
    const alive = await lastCanvas.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      return canvas.width > 0 && canvas.height > 0;
    });
    if (alive) ok(`${targetChapters.length}章を連続で開いても WebGL コンテキストが生きている`);
    else fail('最後の章のキャンバスが失われています（破棄漏れの疑い）');

    /* ---- API チップが公式ドキュメントへのリンクになっているか ---- */

    await page.goto(`${BASE}#/ch/03-dot`);
    await settle(page);
    const apiLinks = await page.locator('.api-chip--link[href*="threejs.org"]').count();
    if (apiLinks > 0) ok(`API チップが公式ドキュメントへのリンクになっている（${apiLinks} 件）`);
    else fail('API チップが公式ドキュメントへのリンクになっていません');

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
    await settle(reducedPage);
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
    await settle(mobilePage);
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
