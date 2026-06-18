/*
  Static interactions for the movie site.
  Includes hero carousel, mobile menu, live search suggestions, filter panels and HLS player startup.
*/

(function () {
  const rootPrefix = document.body ? document.body.dataset.root || "" : "";
  let searchIndexPromise = null;

  function getSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch(rootPrefix + "data/search-index.json")
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Search index failed to load");
          }
          return response.json();
        })
        .catch(function () {
          return [];
        });
    }
    return searchIndexPromise;
  }

  function initMobileMenu() {
    const toggle = document.querySelector(".mobile-menu-toggle");
    const panel = document.querySelector(".mobile-panel");

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      const nextState = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", nextState);
      toggle.setAttribute("aria-expanded", String(nextState));
    });
  }

  function initHeroCarousel() {
    const carousel = document.querySelector("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
    const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
    let current = 0;
    let timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        showSlide(current + 1);
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
        const index = Number(dot.dataset.slide || 0);
        showSlide(index);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function createSuggestionMarkup(movie) {
    const href = rootPrefix + movie.href.replace(/^\.\//, "");
    const meta = [movie.year, movie.region, movie.type].filter(Boolean).join(" · ");
    return "<a href="" + href + ""><strong>" + escapeHtml(movie.title) + "</strong><br><span>" + escapeHtml(meta) + "</span></a>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initSearchSuggestions() {
    const forms = Array.from(document.querySelectorAll(".header-search"));

    forms.forEach(function (form) {
      const input = form.querySelector("input[type='search']");
      const box = form.querySelector(".search-suggestions");

      if (!input || !box) {
        return;
      }

      input.addEventListener("input", function () {
        const keyword = input.value.trim().toLowerCase();

        if (keyword.length < 1) {
          box.classList.remove("is-open");
          box.innerHTML = "";
          return;
        }

        getSearchIndex().then(function (movies) {
          const matched = movies
            .filter(function (movie) {
              return movie.searchText.toLowerCase().includes(keyword);
            })
            .slice(0, 8);

          if (matched.length === 0) {
            box.innerHTML = "<a href="" + rootPrefix + "search.html?q=" + encodeURIComponent(keyword) + "">查看完整搜索结果</a>";
          } else {
            box.innerHTML = matched.map(createSuggestionMarkup).join("") +
              "<a href="" + rootPrefix + "search.html?q=" + encodeURIComponent(keyword) + "">进入搜索页筛选更多</a>";
          }

          box.classList.add("is-open");
        });
      });

      document.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
          box.classList.remove("is-open");
        }
      });
    });
  }

  function initFilters() {
    const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach(function (panel) {
      const section = panel.parentElement;
      const grid = section ? section.querySelector("[data-filter-grid]") : null;
      const cards = grid ? Array.from(grid.querySelectorAll(".movie-card")) : [];
      const keywordInput = panel.querySelector("[data-filter-keyword]");
      const selects = Array.from(panel.querySelectorAll("[data-filter-field]"));
      const resetButton = panel.querySelector("[data-filter-reset]");
      const countBox = panel.querySelector("[data-filter-count]");
      const emptyState = section ? section.querySelector("[data-empty-state]") : null;

      if (!grid || cards.length === 0) {
        return;
      }

      const urlKeyword = new URLSearchParams(window.location.search).get("q") || "";
      if (keywordInput && urlKeyword) {
        keywordInput.value = urlKeyword;
      }

      function applyFilter() {
        const keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
        const activeFilters = {};

        selects.forEach(function (select) {
          const field = select.dataset.filterField;
          const value = select.value;
          if (field && value) {
            activeFilters[field] = value;
          }
        });

        let visible = 0;

        cards.forEach(function (card) {
          const text = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.year,
            card.dataset.type,
            card.dataset.tags
          ].join(" ").toLowerCase();

          const keywordMatches = !keyword || text.includes(keyword);
          const selectMatches = Object.keys(activeFilters).every(function (field) {
            return String(card.dataset[field] || "") === activeFilters[field];
          });
          const shouldShow = keywordMatches && selectMatches;

          card.hidden = !shouldShow;
          if (shouldShow) {
            visible += 1;
          }
        });

        if (countBox) {
          countBox.textContent = "当前显示 " + visible + " 部影片，共 " + cards.length + " 部。";
        }

        if (emptyState) {
          emptyState.classList.toggle("is-visible", visible === 0);
        }
      }

      if (keywordInput) {
        keywordInput.addEventListener("input", applyFilter);
      }

      selects.forEach(function (select) {
        select.addEventListener("change", applyFilter);
      });

      if (resetButton) {
        resetButton.addEventListener("click", function () {
          if (keywordInput) {
            keywordInput.value = "";
          }
          selects.forEach(function (select) {
            select.value = "";
          });
          applyFilter();
        });
      }

      applyFilter();
    });
  }

  function loadHlsLibrary() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    return new Promise(function (resolve, reject) {
      const existing = document.querySelector("script[data-hls-library]");

      if (existing) {
        existing.addEventListener("load", function () {
          resolve(window.Hls);
        });
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
      script.async = true;
      script.dataset.hlsLibrary = "true";
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function startPlayer(shell) {
    const video = shell.querySelector("video");
    const overlay = shell.querySelector(".play-overlay");
    const source = shell.dataset.m3u8;

    if (!video || !source) {
      return;
    }

    overlay.classList.add("is-hidden");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.play().catch(function () {});
      return;
    }

    loadHlsLibrary()
      .then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
          shell._hlsInstance = hls;
        } else {
          video.src = source;
          video.play().catch(function () {});
        }
      })
      .catch(function () {
        video.src = source;
        video.play().catch(function () {});
      });
  }

  function initPlayers() {
    const shells = Array.from(document.querySelectorAll("[data-player]"));

    shells.forEach(function (shell) {
      const overlay = shell.querySelector(".play-overlay");
      const video = shell.querySelector("video");

      if (overlay) {
        overlay.addEventListener("click", function () {
          startPlayer(shell);
        });
      }

      if (video) {
        video.addEventListener("play", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroCarousel();
    initSearchSuggestions();
    initFilters();
    initPlayers();
  });
})();
