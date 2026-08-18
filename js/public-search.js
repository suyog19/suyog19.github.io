(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.sjPublicSearch = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const TYPE_ORDER = ['Article', 'Topic Hub', 'Series', 'System', 'Demo', 'Course'];
  const PRODUCTION_HOST = 'suyogjoshi.com';

  function normalize(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function tokens(value) {
    return normalize(value).split(/\s+/).filter(Boolean);
  }

  function acronym(value) {
    return tokens(value).map((word) => word[0]).join('');
  }

  function searchable(item) {
    return [item.title, ...(item.topics || []), item.type, item.source, item.summary, item.state || '', item.published || '']
      .map(normalize)
      .join(' ');
  }

  function score(item, query) {
    const phrase = normalize(query).slice(0, 120);
    const queryTokens = tokens(phrase);
    if (!queryTokens.length) return 0;
    const haystack = searchable(item);
    const title = normalize(item.title);
    const titleAcronym = acronym(item.title);
    const topics = normalize([...(item.topics || []), item.type, item.source].join(' '));
    const summary = normalize(item.summary);

    if (!queryTokens.every((token) => haystack.includes(token) || titleAcronym.includes(token))) return 0;

    let total = title.includes(phrase) ? 120 : 0;
    for (const token of queryTokens) {
      if (title.includes(token)) total += 32;
      else if (titleAcronym.includes(token)) total += 26;
      if (topics.includes(token)) total += 18;
      if (summary.includes(token)) total += 8;
    }
    if (item.type === 'Article') total += 2;
    return total;
  }

  function search(items, query) {
    const typeRank = new Map(TYPE_ORDER.map((type, index) => [type, index]));
    return items
      .map((item) => ({ item, score: score(item, query) }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) =>
        right.score - left.score ||
        (typeRank.get(left.item.type) ?? 99) - (typeRank.get(right.item.type) ?? 99) ||
        left.item.title.localeCompare(right.item.title)
      )
      .map((candidate) => candidate.item);
  }

  function resultUrl(item) {
    if (item.external) return item.url;
    try {
      const target = new URL(item.url);
      if (target.protocol !== 'https:' || target.hostname !== PRODUCTION_HOST || target.port) {
        return '/search/';
      }
      if (!target.pathname.startsWith('/') || target.pathname.startsWith('//')) {
        return '/search/';
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch (_error) {
      return '/search/';
    }
  }

  function createResult(documentRef, item) {
    const li = documentRef.createElement('li');
    li.className = 'search-result';

    const heading = documentRef.createElement('h2');
    const link = documentRef.createElement('a');
    link.href = resultUrl(item);
    link.textContent = item.title;
    if (item.external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${item.title} — ${item.source} (opens in a new tab)`);
    }
    heading.appendChild(link);

    const type = documentRef.createElement('p');
    type.className = 'search-result-type';
    type.textContent = item.external ? `${item.type} · ${item.source} · External` : item.type;

    const summary = documentRef.createElement('p');
    summary.className = 'search-result-summary';
    summary.textContent = item.summary;

    li.append(type, heading, summary);
    if (item.state) {
      const state = documentRef.createElement('p');
      state.className = 'search-result-state';
      state.textContent = item.state;
      li.appendChild(state);
    }
    return li;
  }

  function init(documentRef, fetchRef) {
    const form = documentRef.querySelector('[data-search-form]');
    if (!form) return null;
    const input = form.querySelector('[data-search-input]');
    const clear = form.querySelector('[data-search-clear]');
    const status = documentRef.querySelector('[data-search-status]');
    const resultsSection = documentRef.querySelector('[data-search-results]');
    const resultsList = documentRef.querySelector('[data-search-list]');
    const indexUrl = form.getAttribute('data-search-index');
    let items = [];
    let ready = false;

    form.hidden = false;
    status.textContent = 'Loading the public content index…';

    const loading = fetchRef(indexUrl, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .then((payload) => {
        if (!payload || !Array.isArray(payload.items)) throw new Error('Search index is invalid');
        items = payload.items;
        ready = true;
        status.textContent = 'Search by title, topic, summary, content type, or publication.';
        input.disabled = false;
        return items;
      })
      .catch(() => {
        status.textContent = 'Search is temporarily unavailable. Browse Writing, Systems, or Training below.';
        form.hidden = true;
        resultsSection.hidden = true;
        return [];
      });

    function runSearch() {
      const query = input.value.trim().slice(0, 120);
      resultsList.replaceChildren();
      if (!ready) {
        status.textContent = 'The public content index is still loading.';
        resultsSection.hidden = true;
        return;
      }
      if (!query) {
        status.textContent = 'Enter a title, topic, system, demo, or course term to search.';
        resultsSection.hidden = true;
        clear.hidden = true;
        return;
      }
      const matches = search(items, query);
      clear.hidden = false;
      if (!matches.length) {
        status.textContent = `No public content matched “${query}”. Try a shorter term or use the browse links below.`;
        resultsSection.hidden = true;
        return;
      }
      for (const item of matches) resultsList.appendChild(createResult(documentRef, item));
      status.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'} for “${query}”.`;
      resultsSection.hidden = false;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      runSearch();
    });
    clear.addEventListener('click', () => {
      input.value = '';
      resultsList.replaceChildren();
      resultsSection.hidden = true;
      clear.hidden = true;
      status.textContent = 'Search by title, topic, summary, content type, or publication.';
      input.focus();
    });

    return { loading, runSearch, getItems: () => items.slice() };
  }

  if (typeof document !== 'undefined' && typeof fetch === 'function') init(document, fetch);
  return { normalize, acronym, score, search, resultUrl, createResult, init };
});
