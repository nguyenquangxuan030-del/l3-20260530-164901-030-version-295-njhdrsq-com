(function () {
  function toggleMenu() {
    var button = document.querySelector(".menu-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    if (slides.length === 0) {
      return;
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var next = document.querySelector("[data-hero-next]");
    var prev = document.querySelector("[data-hero-prev]");
    var index = 0;
    var timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-slide") || 0));
        start();
      });
    });

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    show(0);
    start();
  }

  function setupCategoryFilter() {
    var input = document.querySelector(".category-search-input");
    var yearSelect = document.querySelector(".category-sort-select");
    var grid = document.querySelector(".filterable-grid");
    var empty = document.querySelector(".empty-tip");
    if (!grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".filterable-card"));

    function applyFilter() {
      var keyword = input ? input.value.trim().toLowerCase() : "";
      var year = yearSelect ? yearSelect.value : "";
      var shown = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" ").toLowerCase();
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchYear = !year || card.getAttribute("data-year") === year;
        var visible = matchKeyword && matchYear;
        card.hidden = !visible;
        if (visible) {
          shown += 1;
        }
      });
      if (empty) {
        empty.hidden = shown !== 0;
      }
    }

    if (input) {
      input.addEventListener("input", applyFilter);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", applyFilter);
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function uniq(values) {
    var result = [];
    values.forEach(function (value) {
      if (value && result.indexOf(value) === -1) {
        result.push(value);
      }
    });
    return result;
  }

  function setupSearch() {
    var movies = window.searchMovies;
    var input = document.getElementById("site-search-input");
    var region = document.getElementById("search-region");
    var type = document.getElementById("search-type");
    var year = document.getElementById("search-year");
    var results = document.getElementById("search-results");
    var summary = document.getElementById("search-summary");
    if (!Array.isArray(movies) || !input || !results) {
      return;
    }

    function fillSelect(select, values) {
      if (!select) {
        return;
      }
      values.forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fillSelect(region, uniq(movies.map(function (movie) { return movie.region; })).sort());
    fillSelect(type, uniq(movies.map(function (movie) { return movie.type; })).sort());
    fillSelect(year, uniq(movies.map(function (movie) { return String(movie.year); })).sort().reverse());

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    input.value = query;

    function render() {
      var keyword = input.value.trim().toLowerCase();
      var regionValue = region ? region.value : "";
      var typeValue = type ? type.value : "";
      var yearValue = year ? year.value : "";
      var filtered = movies.filter(function (movie) {
        var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.line].join(" ").toLowerCase();
        return (!keyword || haystack.indexOf(keyword) !== -1)
          && (!regionValue || movie.region === regionValue)
          && (!typeValue || movie.type === typeValue)
          && (!yearValue || String(movie.year) === yearValue);
      }).sort(function (a, b) {
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        return b.score - a.score;
      });
      var list = filtered.slice(0, 120);
      if (summary) {
        summary.textContent = filtered.length ? "已匹配到 " + filtered.length + " 部影片，优先展示相关结果。" : "没有找到匹配影片。";
      }
      results.innerHTML = list.map(function (movie) {
        return '<a class="movie-card" href="movies/' + movie.file + '">'
          + '<figure class="poster-frame">'
          + '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">'
          + '<span class="poster-badge">' + escapeHtml(movie.region) + '</span>'
          + '<span class="poster-play">▶</span>'
          + '</figure>'
          + '<div class="movie-card-body">'
          + '<h3>' + escapeHtml(movie.title) + '</h3>'
          + '<p class="movie-meta">' + escapeHtml(movie.type) + ' · ' + movie.year + ' · ' + escapeHtml(movie.genre) + '</p>'
          + '<p class="movie-line">' + escapeHtml(movie.line) + '</p>'
          + '</div>'
          + '</a>';
      }).join("");
    }

    input.addEventListener("input", render);
    if (region) {
      region.addEventListener("change", render);
    }
    if (type) {
      type.addEventListener("change", render);
    }
    if (year) {
      year.addEventListener("change", render);
    }
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    toggleMenu();
    setupHero();
    setupCategoryFilter();
    setupSearch();
  });
})();
