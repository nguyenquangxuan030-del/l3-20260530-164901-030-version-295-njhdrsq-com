(function () {
  var body = document.body;
  var menuButton = document.querySelector(".menu-toggle");
  if (menuButton) {
    menuButton.addEventListener("click", function () {
      body.classList.toggle("menu-open");
    });
  }

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var prev = slider.querySelector("[data-slide-prev]");
    var next = slider.querySelector("[data-slide-next]");
    var current = 0;
    var timer = null;

    function setSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    function startTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        setSlide(i);
        startTimer();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        setSlide(current - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        setSlide(current + 1);
        startTimer();
      });
    }

    if (slides.length > 1) {
      startTimer();
    }
  });

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-filter-value]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var value = button.getAttribute("data-filter-value");
        buttons.forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        cards.forEach(function (card) {
          var type = card.getAttribute("data-type") || "";
          var year = card.getAttribute("data-year") || "";
          var region = card.getAttribute("data-region") || "";
          var show = value === "all" || type.indexOf(value) >= 0 || year === value || region.indexOf(value) >= 0;
          card.classList.toggle("hidden-card", !show);
        });
      });
    });
  });

  document.querySelectorAll("[data-local-search]").forEach(function (form) {
    var input = form.querySelector("input");
    var select = form.querySelector("select");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

    function apply() {
      var q = normalize(input ? input.value : "");
      var mediaType = select ? select.value : "all";
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region")
        ].join(" "));
        var type = card.getAttribute("data-type") || "";
        var matchesText = !q || haystack.indexOf(q) >= 0;
        var matchesType = mediaType === "all" || type.indexOf(mediaType) >= 0;
        card.classList.toggle("hidden-card", !(matchesText && matchesType));
      });
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (select) {
      select.addEventListener("change", apply);
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q && input) {
      input.value = q;
      apply();
    }
  });
})();
