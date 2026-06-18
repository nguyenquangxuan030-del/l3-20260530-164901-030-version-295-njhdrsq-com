(function () {
  var panels = document.querySelectorAll("[data-mobile-panel]");
  var toggles = document.querySelectorAll("[data-menu-toggle]");

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      panels.forEach(function (panel) {
        panel.classList.toggle("open");
      });
    });
  });

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var dotsWrap = hero.querySelector("[data-hero-dots]");
    var current = 0;
    var timer = null;

    function renderDots() {
      if (!dotsWrap) {
        return;
      }

      dotsWrap.innerHTML = "";
      slides.forEach(function (_, index) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = index === current ? "hero-dot active" : "hero-dot";
        dot.setAttribute("aria-label", "切换推荐" + (index + 1));
        dot.addEventListener("click", function () {
          show(index);
          restart();
        });
        dotsWrap.appendChild(dot);
      });
    }

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      renderDots();
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
  var filterControls = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var items = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .compact-card, .ranking-item"));

  function filterItems(value) {
    var query = (value || "").trim().toLowerCase();
    var filters = {};

    filterControls.forEach(function (control) {
      filters[control.getAttribute("data-filter")] = control.value;
    });

    items.forEach(function (item) {
      var text = (item.getAttribute("data-search") || "").toLowerCase();
      var matchedText = !query || text.indexOf(query) !== -1;
      var matchedFilter = Object.keys(filters).every(function (key) {
        var selected = filters[key];
        if (!selected) {
          return true;
        }
        return (item.getAttribute("data-" + key) || "").indexOf(selected) !== -1;
      });
      item.classList.toggle("is-filtered-out", !(matchedText && matchedFilter));
    });
  }

  searchInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      searchInputs.forEach(function (other) {
        if (other !== input) {
          other.value = input.value;
        }
      });
      filterItems(input.value);
    });
  });

  filterControls.forEach(function (control) {
    control.addEventListener("change", function () {
      var activeInput = searchInputs.find(function (input) {
        return input.value;
      });
      filterItems(activeInput ? activeInput.value : "");
    });
  });

  var player = document.querySelector("[data-player]");

  if (player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".play-overlay");
    var source = player.getAttribute("data-play-url");
    var hlsInstance = null;

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    }

    function startVideo() {
      if (!video || !source) {
        return;
      }

      hideOverlay();

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (video.src !== source) {
          video.src = source;
        }
        video.play().catch(function () {});
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        if (!hlsInstance) {
          hlsInstance = new window.Hls({
            maxBufferLength: 30,
            backBufferLength: 30
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        }

        if (video.readyState > 0) {
          video.play().catch(function () {});
        } else {
          video.addEventListener("loadedmetadata", function () {
            video.play().catch(function () {});
          }, { once: true });
        }
        return;
      }

      if (video.src !== source) {
        video.src = source;
      }
      video.play().catch(function () {});
    }

    if (overlay) {
      overlay.addEventListener("click", startVideo);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        startVideo();
      }
    });

    video.addEventListener("play", hideOverlay);
  }
})();
