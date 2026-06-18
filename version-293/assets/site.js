(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function toggleMobileMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
    });
  }

  function bindSearchForms() {
    document.querySelectorAll(".global-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input) {
          return;
        }
        var value = input.value.trim();
        if (!value) {
          return;
        }
        event.preventDefault();
        window.location.href = "./search.html?q=" + encodeURIComponent(value);
      });
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var next = hero.querySelector(".hero-next");
    var prev = hero.querySelector(".hero-prev");
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        play();
      });
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        play();
      });
    }

    hero.addEventListener("mouseenter", function () {
      clearInterval(timer);
    });

    hero.addEventListener("mouseleave", play);
    play();
  }

  function applyFilters(scope) {
    var queryInput = scope.querySelector(".card-filter-input") || document.getElementById("searchInput");
    var grid = scope.querySelector("[data-card-grid]");
    var empty = scope.querySelector(".empty-message");
    var activeYear = "";
    var activeRegion = "";

    if (!grid) {
      return;
    }

    function filter() {
      var q = queryInput ? queryInput.value.trim().toLowerCase() : "";
      var visible = 0;
      grid.querySelectorAll(".movie-card").forEach(function (card) {
        var search = (card.getAttribute("data-search") || "").toLowerCase();
        var year = card.getAttribute("data-year") || "";
        var region = card.getAttribute("data-region") || "";
        var matched = (!q || search.indexOf(q) !== -1) && (!activeYear || year === activeYear) && (!activeRegion || region === activeRegion);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    if (queryInput) {
      queryInput.addEventListener("input", filter);
    }

    scope.querySelectorAll("[data-filter-year]").forEach(function (button) {
      button.addEventListener("click", function () {
        activeYear = button.getAttribute("data-filter-year") || "";
        scope.querySelectorAll("[data-filter-year]").forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        filter();
      });
    });

    scope.querySelectorAll("[data-filter-region]").forEach(function (button) {
      button.addEventListener("click", function () {
        activeRegion = button.getAttribute("data-filter-region") || "";
        scope.querySelectorAll("[data-filter-region]").forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        filter();
      });
    });

    filter();
  }

  function initFilters() {
    document.querySelectorAll("[data-filter-scope]").forEach(applyFilters);
  }

  function initSearchPage() {
    var input = document.getElementById("searchInput");
    if (!input) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";
    input.value = q;
    document.querySelectorAll("[data-search-chip]").forEach(function (button) {
      button.addEventListener("click", function () {
        input.value = button.getAttribute("data-search-chip") || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  ready(function () {
    toggleMobileMenu();
    bindSearchForms();
    initHero();
    initSearchPage();
    initFilters();
  });
})();

function initMoviePlayer(playerId, streamUrl) {
  var card = document.getElementById(playerId);
  if (!card) {
    return;
  }

  var video = card.querySelector("video");
  var overlay = card.querySelector(".player-overlay");
  var hls;

  function attach() {
    if (!video) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      return;
    }

    video.src = streamUrl;
  }

  function start() {
    attach();
    card.classList.add("playing");
    if (overlay) {
      overlay.hidden = true;
    }
    var attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(function () {
        card.classList.remove("playing");
        if (overlay) {
          overlay.hidden = false;
        }
      });
    }
  }

  if (overlay) {
    overlay.addEventListener("click", start);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      start();
    }
  });

  video.addEventListener("play", function () {
    card.classList.add("playing");
    if (overlay) {
      overlay.hidden = true;
    }
  });

  video.addEventListener("pause", function () {
    if (!video.ended) {
      return;
    }
    card.classList.remove("playing");
  });

  window.addEventListener("pagehide", function () {
    if (hls) {
      hls.destroy();
    }
  });
}
