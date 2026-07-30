import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import '@fontsource-variable/m-plus-2';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';

import { createShell } from './app/shell.ts';
import { startRouter } from './app/router.ts';
import { renderChapterPage } from './app/pages/chapter.ts';
import { renderDrillPage } from './app/pages/drill.ts';
import { renderGlossaryPage } from './app/pages/glossary.ts';
import { renderHelpPage } from './app/pages/help.ts';
import { renderHomePage } from './app/pages/home.ts';
import { renderMapPage } from './app/pages/map.ts';
import { installTermPopovers } from './ui/term.ts';
import { el } from './ui/dom.ts';

const app = document.getElementById('app');
if (!app) throw new Error('#app が見つかりません');

const shell = createShell(app);
installTermPopovers();

startRouter({
  root: shell.main,
  routes: {
    '': renderHomePage,
    ch: renderChapterPage,
    glossary: renderGlossaryPage,
    map: renderMapPage,
    help: renderHelpPage,
    drill: renderDrillPage,
  },
  notFound: (root) => {
    document.title = 'ページが見つかりません｜(アイン、ソフ、オウル)';
    root.appendChild(
      el(
        'div',
        { class: 'notfound' },
        el('h1', { class: 'page-title' }, 'そのページはありません'),
        el('p', null, el('a', { href: '#/' }, 'トップへ戻る')),
      ),
    );
  },
  onNavigated: (ctx) => shell.update(ctx),
});
