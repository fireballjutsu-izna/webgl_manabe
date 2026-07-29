/**
 * その場で編集して実行できるコード。
 *
 * 上が結果（iframe）、下がエディタ。エディタは色付きの <pre> に透明な <textarea> を
 * 重ねる方式で、既存の highlight() をそのまま使う（依存ライブラリは増やさない）。
 */

import { getImportMap, isSandboxSupported } from '../sandbox/bridge.ts';
import {
  buildDocument,
  explainError,
  findRunawayLoop,
  type SandboxMessage,
} from '../sandbox/runtime.ts';
import { highlight } from './code.ts';
import { cssVar, el } from './dom.ts';

const STORAGE_PREFIX = 'webgl-manabe:sandbox:v1:';

export interface SandboxOptions {
  /** 最初に表示するコード。 */
  code: string;
  title?: string;
  /** 編集内容の保存先を分けるための鍵。章の slug とブロック番号から作る。 */
  storageKey: string;
}

export interface SandboxInstance {
  element: HTMLElement;
  dispose(): void;
}

function loadSaved(key: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function save(key: string, code: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, code);
  } catch {
    /* 保存できなくても実行はできる */
  }
}

function clearSaved(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* noop */
  }
}

export function createSandbox(options: SandboxOptions): SandboxInstance {
  const initialCode = options.code.trim();
  const saved = loadSaved(options.storageKey);

  /* ---- 結果を映す枠 ---- */

  const stage = el('div', { class: 'sandbox__stage' });
  const hint = el('div', { class: 'demo__hint' }, '実行結果');
  stage.appendChild(hint);

  /* ---- ツールバー ---- */

  const runButton = el('button', { class: 'btn btn--primary', type: 'button' }, '実行する');
  const resetButton = el('button', { class: 'btn', type: 'button' }, 'やり直す');
  const revertButton = el('button', { class: 'btn', type: 'button' }, '最初に戻す');
  const fullscreenButton = el('button', { class: 'btn', type: 'button' }, '全画面');
  const copyButton = el('button', { class: 'btn', type: 'button' }, 'コピー');

  const bar = el(
    'div',
    { class: 'sandbox__bar' },
    el('span', { class: 'sandbox__title' }, options.title ?? '編集して実行できます'),
    runButton,
    resetButton,
    revertButton,
    fullscreenButton,
    copyButton,
  );

  /* ---- エディタ ---- */

  const gutterInner = el('div', { class: 'sandbox__gutter-inner' });
  const gutter = el('div', { class: 'sandbox__gutter', 'aria-hidden': 'true' }, gutterInner);
  const highlighted = el('code');
  const pre = el('pre', { class: 'sandbox__hl', 'aria-hidden': 'true' }, highlighted);
  const textarea = el('textarea', {
    class: 'sandbox__input',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    'aria-label': `${options.title ?? 'サンプル'}のコード`,
  });
  textarea.value = saved ?? initialCode;

  const editor = el(
    'div',
    { class: 'sandbox__editor' },
    gutter,
    el('div', { class: 'sandbox__code' }, pre, textarea),
  );

  const consolePanel = el('div', { class: 'sandbox__console', hidden: true });

  const root = el(
    'div',
    { class: 'sandbox' },
    stage,
    bar,
    editor,
    consolePanel,
  );

  /* ---- 表示の同期 ---- */

  const syncView = (): void => {
    const code = textarea.value;
    highlighted.innerHTML = highlight(code);
    const lines = code.split('\n').length;
    gutterInner.textContent = Array.from({ length: lines }, (_, i) => String(i + 1)).join('\n');
    // 行数に応じて高さを合わせる（長いコードはエディタ側でスクロールさせる）
    editor.style.setProperty('--editor-rows', String(Math.min(Math.max(lines, 6), 24)));
  };

  const syncScroll = (): void => {
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
    gutterInner.style.transform = `translateY(${-textarea.scrollTop}px)`;
  };

  textarea.addEventListener('input', () => {
    syncView();
    save(options.storageKey, textarea.value);
  });
  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    // Tab は字下げに使う。ただし Esc を押したあとはフォーカス移動に譲る
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`;
    textarea.selectionStart = textarea.selectionEnd = start + 2;
    syncView();
    save(options.storageKey, textarea.value);
  });

  /* ---- 実行 ---- */

  const supported = isSandboxSupported();
  let frame: HTMLIFrameElement | null = null;
  let codeUrl: string | null = null;
  let disposed = false;

  const showMessages = (messages: { tone: string; text: string }[]): void => {
    consolePanel.replaceChildren();
    if (messages.length === 0) {
      consolePanel.hidden = true;
      return;
    }
    for (const message of messages) {
      consolePanel.appendChild(
        el('p', { class: 'sandbox__msg', 'data-tone': message.tone }, message.text),
      );
    }
    consolePanel.hidden = false;
  };

  const pending: { tone: string; text: string }[] = [];

  const onMessage = (event: MessageEvent): void => {
    if (!frame || event.source !== frame.contentWindow) return;
    const data = event.data as SandboxMessage | undefined;
    if (!data || data.__sandbox !== true) return;

    if (data.type === 'error') {
      const where = data.line ? `${data.line} 行目: ` : '';
      pending.push({ tone: 'error', text: `${where}${data.message ?? ''}` });
      const hintText = explainError(data.message ?? '');
      if (hintText) pending.push({ tone: 'hint', text: hintText });
      showMessages(pending);
    } else if (data.type === 'log') {
      pending.push({ tone: 'log', text: data.message ?? '' });
      showMessages(pending);
    }
  };

  window.addEventListener('message', onMessage);

  const destroyFrame = (): void => {
    frame?.remove();
    frame = null;
    if (codeUrl) {
      URL.revokeObjectURL(codeUrl);
      codeUrl = null;
    }
  };

  const run = async (): Promise<void> => {
    if (disposed) return;

    pending.length = 0;
    showMessages([]);

    if (!supported) {
      showMessages([
        {
          tone: 'error',
          text: 'このブラウザではサイト内で実行できません。コードをコピーして手元で試してください。',
        },
      ]);
      return;
    }

    // addons は動的 import なので、最初の実行だけ少し待つ
    const importMap = await getImportMap();
    if (disposed) return;
    if (!importMap) {
      showMessages([
        { tone: 'error', text: '実行に必要な準備ができませんでした。コードをコピーして手元で試してください。' },
      ]);
      return;
    }

    const code = textarea.value;
    const runaway = findRunawayLoop(code);
    if (runaway) pending.push({ tone: 'warn', text: runaway });

    destroyFrame();
    codeUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));

    frame = el('iframe', {
      class: 'sandbox__frame',
      title: options.title ?? '実行結果',
      srcdoc: buildDocument({
        importMap,
        codeUrl,
        background: cssVar('--bg', '#0a0a12'),
      }),
    });
    stage.insertBefore(frame, hint);

    if (pending.length > 0) showMessages(pending);
  };

  runButton.addEventListener('click', () => void run());
  resetButton.addEventListener('click', () => void run());

  revertButton.addEventListener('click', () => {
    textarea.value = initialCode;
    clearSaved(options.storageKey);
    syncView();
    void run();
  });

  fullscreenButton.addEventListener('click', () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (stage.requestFullscreen) {
      void stage.requestFullscreen().catch(() => {
        // 使えない環境では縦に広げるだけの代替に落とす
        root.classList.toggle('sandbox--tall');
      });
    } else {
      root.classList.toggle('sandbox--tall');
    }
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyButton.textContent = 'コピーしました';
      setTimeout(() => {
        copyButton.textContent = 'コピー';
      }, 1600);
    } catch {
      textarea.select();
    }
  });

  /* ---- 画面に入ったら一度だけ自動で実行する ---- */

  let started = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (started || !entries.some((entry) => entry.isIntersecting)) return;
      started = true;
      void run();
    },
    { rootMargin: '160px' },
  );
  observer.observe(root);

  syncView();

  return {
    element: root,
    dispose() {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('message', onMessage);
      destroyFrame();
    },
  };
}
