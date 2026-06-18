
import { movies } from './movies.js';

const rootPrefix = document.body.dataset.rootPrefix || '';

function setupMobileMenu() {
  const button = document.querySelector('.mobile-menu-button');
  const panel = document.querySelector('.mobile-panel');
  if (!button || !panel) return;
  button.addEventListener('click', () => {
    panel.classList.toggle('is-open');
  });
}

function setupHero() {
  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  if (!slides.length) return;
  let index = 0;
  const show = nextIndex => {
    index = nextIndex;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  };
  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => show(dotIndex));
  });
  window.setInterval(() => {
    show((index + 1) % slides.length);
  }, 5200);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a), 'zh-CN'));
}

function setupFilters() {
  const list = document.querySelector('.js-filter-list');
  if (!list) return;
  const cards = Array.from(list.querySelectorAll('.movie-card'));
  const input = document.querySelector('.js-filter-input');
  const year = document.querySelector('.js-filter-year');
  const region = document.querySelector('.js-filter-region');
  const type = document.querySelector('.js-filter-type');
  const count = document.querySelector('.js-filter-count');
  const fillSelect = (select, values) => {
    if (!select) return;
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  };
  fillSelect(year, uniqueSorted(cards.map(card => card.dataset.year)));
  fillSelect(region, uniqueSorted(cards.map(card => card.dataset.region)));
  fillSelect(type, uniqueSorted(cards.map(card => card.dataset.type)));
  const apply = () => {
    const keyword = (input?.value || '').trim().toLowerCase();
    const selectedYear = year?.value || '';
    const selectedRegion = region?.value || '';
    const selectedType = type?.value || '';
    let visible = 0;
    cards.forEach(card => {
      const haystack = [card.dataset.title, card.dataset.region, card.dataset.type, card.dataset.genre, card.dataset.tags, card.dataset.year].join(' ').toLowerCase();
      const matched = (!keyword || haystack.includes(keyword)) && (!selectedYear || card.dataset.year === selectedYear) && (!selectedRegion || card.dataset.region === selectedRegion) && (!selectedType || card.dataset.type === selectedType);
      card.classList.toggle('is-hidden-by-filter', !matched);
      if (matched) visible += 1;
    });
    if (count) count.textContent = `当前显示 ${visible} 部影片`;
  };
  [input, year, region, type].forEach(control => {
    if (control) control.addEventListener('input', apply);
    if (control) control.addEventListener('change', apply);
  });
  apply();
}

function movieCard(movie) {
  const tags = [movie.areaName, movie.type, movie.year].filter(Boolean).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
  const excerpt = movie.oneLine || movie.summary || '';
  return `
<article class="movie-card">
  <a class="movie-card__poster" href="${rootPrefix}${movie.detail}" aria-label="${escapeHtml(movie.title)}">
    <img src="${rootPrefix}${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy">
    <span class="movie-card__score">${movie.rating}</span>
  </a>
  <div class="movie-card__content">
    <div class="movie-card__tags">${tags}</div>
    <h3><a href="${rootPrefix}${movie.detail}">${escapeHtml(movie.title)}</a></h3>
    <p>${escapeHtml(excerpt.slice(0, 96))}</p>
    <div class="movie-card__meta">
      <span>${escapeHtml(movie.year || '')}</span>
      <span>${Number(movie.views).toLocaleString('zh-CN')} 次观看</span>
    </div>
  </div>
</article>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[character]));
}

function setupSearchPage() {
  const results = document.querySelector('.js-search-results');
  if (!results) return;
  const queryInput = document.querySelector('.js-search-query');
  const count = document.querySelector('.js-search-count');
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  if (queryInput) queryInput.value = query;
  const normalized = query.trim().toLowerCase();
  const matched = normalized ? movies.filter(movie => {
    const haystack = [movie.title, movie.year, movie.region, movie.type, movie.genre, movie.areaName, ...(movie.tags || []), movie.oneLine, movie.summary].join(' ').toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 120) : movies.slice().sort((a, b) => b.views - a.views).slice(0, 24);
  results.innerHTML = matched.map(movieCard).join('');
  if (count) count.textContent = normalized ? `找到 ${matched.length} 条结果` : '显示热门推荐';
}

function setupSearchForms() {
  document.querySelectorAll('.site-search').forEach(form => {
    form.addEventListener('submit', event => {
      const input = form.querySelector('input[name="q"]');
      if (!input || input.value.trim()) return;
      event.preventDefault();
      window.location.href = form.getAttribute('action') || `${rootPrefix}search.html`;
    });
  });
}

setupMobileMenu();
setupHero();
setupFilters();
setupSearchPage();
setupSearchForms();
