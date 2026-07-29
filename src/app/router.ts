/**
 * ハッシュルーター。
 * GitHub Pages では History API を使うと 404 の回避策が必要になるため、
 * `#/ch/03-dot` のようなハッシュで章を切り替える。
 */

export interface RouteContext {
  /** '#/' を除いたパス。例: 'ch/03-dot' */
  path: string;
  /** パスを '/' で割ったもの。例: ['ch', '03-dot'] */
  segments: string[];
}

/** ページを描画し、後片付けが必要なら破棄関数を返す。 */
export type PageRenderer = (root: HTMLElement, ctx: RouteContext) => void | (() => void);

export interface RouterOptions {
  root: HTMLElement;
  /** 先頭セグメント → 描画関数。'' はトップページ。 */
  routes: Record<string, PageRenderer>;
  notFound: PageRenderer;
  /** 描画が終わるたびに呼ばれる（目次のハイライト更新など）。 */
  onNavigated?: (ctx: RouteContext) => void;
}

let disposeCurrent: (() => void) | null = null;

export function parseHash(hash: string): RouteContext {
  const raw = hash.replace(/^#\/?/, '');
  const path = decodeURIComponent(raw);
  const segments = path.split('/').filter(Boolean);
  return { path, segments };
}

export function startRouter(options: RouterOptions): void {
  const { root, routes, notFound, onNavigated } = options;

  const render = (): void => {
    const ctx = parseHash(location.hash);

    // 前のページが確保していたもの（WebGL コンテキストなど）を必ず解放する
    if (disposeCurrent) {
      disposeCurrent();
      disposeCurrent = null;
    }
    root.replaceChildren();

    const key = ctx.segments[0] ?? '';
    const renderer = routes[key] ?? notFound;
    const cleanup = renderer(root, ctx);
    disposeCurrent = typeof cleanup === 'function' ? cleanup : null;

    onNavigated?.(ctx);
  };

  window.addEventListener('hashchange', () => {
    render();
    // 章内アンカー（用語集の項目など）でなければ先頭に戻す
    window.scrollTo({ top: 0, behavior: 'auto' });
    root.focus({ preventScroll: true });
  });

  if (!location.hash) location.replace('#/');
  render();
}

export function navigate(path: string): void {
  location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
}
