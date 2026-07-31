/** ヘッダー・目次サイドバー・本文の器。ルーターより先に一度だけ組み立てる。 */

import { chapterLabel, chapters, chaptersOfPart, PARTS } from '../content/index.ts';
import type { Part } from '../content/types.ts';
import { el } from '../ui/dom.ts';
import { countRead, getProgress, getTheme, onProgressChange, setTheme } from './progress.ts';
import type { RouteContext } from './router.ts';
import { search } from './search.ts';

export interface Shell {
  main: HTMLElement;
  /** 現在地のハイライトなどを更新する。 */
  update(ctx: RouteContext): void;
}

export function createShell(app: HTMLElement): Shell {
  /* ---- 目次 ---- */

  const tocLinks = new Map<string, HTMLAnchorElement>();
  const tocChecks = new Map<string, HTMLElement>();

  /*
   * 目次は部ごとに畳む。全章を平坦に並べると、章が増えたときに
   * 「いま自分がどこにいるか」が目次の中で迷子になる。
   * 開いておくのは、いま読んでいる部だけ。
   */
  const partSections: HTMLElement[] = [];
  const partToggles = new Map<Part, { button: HTMLButtonElement; list: HTMLElement }>();
  const chapterPart = new Map<string, Part>();

  for (const part of PARTS) {
    const list = el('ul', { class: 'toc__list' });
    const partChapters = chaptersOfPart(part.id);
    if (partChapters.length === 0) continue;

    for (const chapter of partChapters) {
      const check = el('span', { class: 'toc__check', 'aria-hidden': 'true' }, '');
      const link = el(
        'a',
        { class: 'toc__link', href: `#/ch/${chapter.slug}` },
        el('span', { class: 'toc__num' }, chapterLabel(chapter)),
        el('span', null, chapter.title),
        check,
      );
      tocLinks.set(`ch/${chapter.slug}`, link);
      tocChecks.set(chapter.slug, check);
      chapterPart.set(chapter.slug, part.id);
      list.appendChild(el('li', null, link));
    }

    const button = el(
      'button',
      { class: 'toc__section', type: 'button' },
      el('span', { class: 'toc__caret', 'aria-hidden': 'true' }, '▾'),
      el('span', null, `${part.title}　全${partChapters.length}章`),
    );
    button.addEventListener('click', () => setPartOpen(part.id, list.hidden));

    partToggles.set(part.id, { button, list });
    partSections.push(button, list);
  }

  function setPartOpen(id: Part, open: boolean): void {
    const entry = partToggles.get(id);
    if (!entry) return;
    entry.list.hidden = !open;
    entry.button.setAttribute('aria-expanded', String(open));
  }

  /** いま読んでいる部だけを開く。どの部でもないページでは、畳んだままにしない。 */
  function openPartFor(slug: string | undefined): void {
    const current = slug ? chapterPart.get(slug) : undefined;
    if (!current) {
      // 章以外のページ（用語集など）では、最初の部だけ開けておく
      const first = [...partToggles.keys()][0];
      for (const id of partToggles.keys()) setPartOpen(id, id === first);
      return;
    }
    for (const id of partToggles.keys()) setPartOpen(id, id === current);
  }

  const extraLinks: [string, string][] = [
    ['map', '前提知識マップ'],
    ['drill', '演習（全105問）'],
    ['glossary', '用語集'],
    ['help', '逆引き（症状から）'],
  ];
  const extras = el('ul', { class: 'toc__list' });
  for (const [path, label] of extraLinks) {
    const link = el(
      'a',
      { class: 'toc__link', href: `#/${path}` },
      el('span', { class: 'toc__num' }, '—'),
      el('span', null, label),
      el('span', { class: 'toc__check' }, ''),
    );
    tocLinks.set(path, link);
    extras.appendChild(el('li', null, link));
  }

  const toc = el(
    'nav',
    { class: 'toc', id: 'toc', 'aria-label': '目次' },
    ...partSections,
    el('hr', { class: 'toc__divider' }),
    extras,
  );

  const backdrop = el('div', { class: 'toc-backdrop' });
  const setDrawer = (open: boolean): void => {
    toc.dataset.open = String(open);
    backdrop.dataset.open = String(open);
    navToggle.setAttribute('aria-expanded', String(open));
  };
  backdrop.addEventListener('click', () => setDrawer(false));

  /* ---- ヘッダー ---- */

  const navToggle = el(
    'button',
    {
      class: 'icon-btn nav-toggle',
      type: 'button',
      'aria-label': '目次の開閉',
      'aria-controls': 'toc',
      'aria-expanded': 'false',
    },
    '☰',
  );
  navToggle.addEventListener('click', () => setDrawer(toc.dataset.open !== 'true'));

  const progressCount = el('span', { class: 'progress-chip__count' }, `0/${chapters.length}`);
  const progressFill = el('i', { style: 'width:0%' });
  const progressChip = el(
    'div',
    { class: 'progress-chip', title: '読み終えた章の数' },
    progressCount,
    el('div', { class: 'progress-chip__bar' }, progressFill),
  );

  const themeToggle = el(
    'button',
    { class: 'icon-btn', type: 'button', 'aria-label': 'ライト／ダークの切り替え' },
    getTheme() === 'dark' ? '☾' : '☀',
  );
  themeToggle.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    themeToggle.textContent = next === 'dark' ? '☾' : '☀';
  });

  const searchInput = el('input', {
    class: 'search__input',
    type: 'search',
    placeholder: 'サイト内を検索',
    'aria-label': 'サイト内を検索',
    autocomplete: 'off',
  });
  const searchPanel = el('div', { class: 'search__panel', hidden: true, role: 'listbox' });
  const searchBox = el('div', { class: 'search', role: 'search' }, searchInput, searchPanel);

  const closeSearch = (): void => {
    searchPanel.hidden = true;
  };

  const runSearch = (): void => {
    const query = searchInput.value.trim();
    if (query.length === 0) {
      closeSearch();
      return;
    }
    const hits = search(query);
    searchPanel.replaceChildren();
    if (hits.length === 0) {
      searchPanel.appendChild(
        el('p', { class: 'search__empty' }, `「${query}」に一致する内容は見つかりませんでした。`),
      );
    } else {
      for (const hit of hits) {
        searchPanel.appendChild(
          el(
            'a',
            { class: 'search__hit', href: hit.href, role: 'option' },
            el('span', { class: 'search__hit-ch' }, hit.label),
            el('span', { class: 'search__hit-title' }, ` ${hit.title}`),
            el('span', { class: 'search__hit-snip', html: hit.snippet }),
          ),
        );
      }
    }
    searchPanel.hidden = false;
  };

  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('focus', runSearch);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      searchInput.value = '';
      closeSearch();
      searchInput.blur();
    }
    if (event.key === 'Enter') {
      const first = searchPanel.querySelector<HTMLAnchorElement>('.search__hit');
      if (first) {
        location.hash = first.getAttribute('href') ?? '#/';
        searchInput.blur();
        closeSearch();
      }
    }
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node) || !searchBox.contains(event.target)) closeSearch();
  });

  const header = el(
    'header',
    { class: 'site-header' },
    navToggle,
    el(
      'a',
      { class: 'brand', href: '#/' },
      el('span', { class: 'brand__name' }, '(アイン、ソフ、オウル)'),
      el('span', { class: 'brand__sub' }, 'Three.js のための数学'),
    ),
    el('div', { class: 'header-tools' }, searchBox, progressChip, themeToggle),
  );

  /* ---- 本文 ---- */

  const main = el('main', { class: 'main', id: 'main', tabindex: '-1' });

  app.replaceChildren(
    el('a', { class: 'skip-link', href: '#main' }, '本文へスキップ'),
    header,
    el('div', { class: 'layout' }, toc, backdrop, main),
  );

  /* ---- 進捗の反映 ---- */

  const refreshProgress = (): void => {
    const total = chapters.length;
    const done = countRead(chapters.map((c) => c.slug));
    progressCount.textContent = `${done}/${total}`;
    progressFill.style.width = `${(done / total) * 100}%`;
    for (const chapter of chapters) {
      const check = tocChecks.get(chapter.slug);
      if (check) check.textContent = getProgress(chapter.slug).read ? '✓' : '';
    }
  };

  refreshProgress();
  onProgressChange(refreshProgress);

  return {
    main,
    update(ctx) {
      const key = ctx.segments.slice(0, 2).join('/');
      for (const [path, link] of tocLinks) {
        if (path === key) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
      openPartFor(ctx.segments[0] === 'ch' ? ctx.segments[1] : undefined);
      setDrawer(false);
      closeSearch();
      refreshProgress();
    },
  };
}
