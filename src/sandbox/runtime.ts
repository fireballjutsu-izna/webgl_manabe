/** サンドボックスの iframe に流し込む HTML を組み立てる。 */

export interface SandboxMessage {
  __sandbox: true;
  type: 'ready' | 'done' | 'error' | 'log';
  message?: string;
  line?: number;
  column?: number;
}

export interface DocumentOptions {
  /** specifier → Blob URL。bridge.getImportMap() の戻り値。 */
  importMap: Record<string, string>;
  /** 利用者のコードを収めた Blob の URL。 */
  codeUrl: string;
  /** iframe の背景色。ページのテーマに合わせる。 */
  background: string;
}

/**
 * 利用者のコードは別モジュール（Blob）として読み込む。
 * こうするとエラーの行番号がエディタの行番号とそのまま一致する。
 */
export function buildDocument(options: DocumentOptions): string {
  const importMap = JSON.stringify({ imports: options.importMap });

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: ${options.background}; }
  canvas { display: block; }
  body > * { max-width: 100%; }
</style>
<script type="importmap">${importMap}</script>
<script>
(function () {
  var send = function (payload) {
    try { parent.postMessage(Object.assign({ __sandbox: true }, payload), '*'); } catch (e) { /* noop */ }
  };
  window.addEventListener('error', function (event) {
    send({
      type: 'error',
      message: (event.error && event.error.message) || event.message || 'エラーが発生しました',
      line: event.lineno,
      column: event.colno
    });
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    send({
      type: 'error',
      message: '待っていた処理が失敗しました: ' + String((reason && reason.message) || reason)
    });
  });
  var originalError = console.error;
  console.error = function () {
    send({ type: 'log', message: Array.prototype.map.call(arguments, String).join(' ') });
    originalError.apply(console, arguments);
  };
  send({ type: 'ready' });
})();
</script>
</head>
<body>
<script type="module" src="${options.codeUrl}"></script>
<script type="module">
  parent.postMessage({ __sandbox: true, type: 'done' }, '*');
</script>
</body>
</html>`;
}

/**
 * 実行前の簡易チェック。同期的な無限ループはページごと固まるので、見つけたら警告を出す。
 * 誤検知で実行を妨げたくないので、止めずに知らせるだけにする。
 */
export function findRunawayLoop(code: string): string | null {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  if (/\bwhile\s*\(\s*(true|1)\s*\)/.test(stripped)) {
    return 'while (true) が見つかりました。break で抜けられないと、ページごと固まります。';
  }
  if (/\bfor\s*\(\s*;\s*;\s*\)/.test(stripped)) {
    return 'for (;;) が見つかりました。break で抜けられないと、ページごと固まります。';
  }
  return null;
}

/** ブラウザが返す素っ気ないエラー文を、初学者向けに補足する。 */
export function explainError(message: string): string | null {
  if (/is not defined/.test(message)) {
    return 'その名前がまだ作られていません。変数名の打ち間違いか、import の書き忘れかもしれません。';
  }
  if (/Failed to resolve module specifier|Cannot find module/.test(message)) {
    return 'import できないモジュールを指定しています。このサンドボックスで使えるのは three と three/addons の一部だけです。';
  }
  if (/is not a function/.test(message)) {
    return 'その名前は存在しますが、関数ではありません。綴りか、呼び出す相手が違っている可能性があります。';
  }
  if (/Cannot read propert/.test(message)) {
    return 'まだ中身の無いもの（undefined や null）に対して、その先を読もうとしています。';
  }
  if (/SyntaxError/.test(message)) {
    return '書き方に誤りがあります。括弧やクォートの閉じ忘れがないか見てみてください。';
  }
  return null;
}
