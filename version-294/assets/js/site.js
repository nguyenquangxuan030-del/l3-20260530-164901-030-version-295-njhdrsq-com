
(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = document.querySelector('.js-hero');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
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
      dot.addEventListener('click', function () {
        var next = parseInt(dot.getAttribute('data-hero-dot'), 10);
        show(next);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.filter-panel'));
    panels.forEach(function (panel) {
      var container = panel.parentElement;
      if (!container) {
        return;
      }
      var cards = Array.prototype.slice.call(container.querySelectorAll('.movie-card'));
      var input = panel.querySelector('.filter-input');
      var selects = Array.prototype.slice.call(panel.querySelectorAll('.filter-select'));
      var count = panel.querySelector('[data-visible-count]');

      function cardMatches(card, keyword) {
        if (!keyword) {
          return true;
        }
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-category')
        ].map(normalize).join(' ');
        return haystack.indexOf(keyword) !== -1;
      }

      function selectMatches(card, select) {
        var value = normalize(select.value);
        if (!value) {
          return true;
        }
        var key = select.getAttribute('data-filter-key');
        if (key === 'year' && value === '2020') {
          var year = parseInt(card.getAttribute('data-year'), 10) || 0;
          return year <= 2020;
        }
        var cardValue = normalize(card.getAttribute('data-' + key));
        return cardValue.indexOf(value) !== -1;
      }

      function apply() {
        var keyword = normalize(input ? input.value : '');
        var visible = 0;
        cards.forEach(function (card) {
          var ok = cardMatches(card, keyword) && selects.every(function (select) {
            return selectMatches(card, select);
          });
          card.hidden = !ok;
          if (ok) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = String(visible);
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  function initPlayers() {
    var shells = Array.prototype.slice.call(document.querySelectorAll('.video-shell'));
    shells.forEach(function (shell) {
      var video = shell.querySelector('.video-player');
      var button = shell.querySelector('.play-overlay');
      var message = shell.querySelector('[data-player-message]');
      if (!video || !button) {
        return;
      }
      var source = video.getAttribute('data-src');
      var hlsInstance = null;

      function setMessage(text) {
        if (message) {
          message.textContent = text || '';
        }
      }

      function playVideo() {
        if (!source) {
          setMessage('当前播放源暂不可用');
          return;
        }
        button.classList.add('is-hidden');
        video.setAttribute('controls', 'controls');

        if (window.Hls && window.Hls.isSupported()) {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              setMessage('请再次点击播放器开始播放');
            });
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage('播放源加载异常，请刷新页面后重试');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {
              setMessage('请再次点击播放器开始播放');
            });
          }, { once: true });
        } else {
          video.src = source;
          video.play().catch(function () {
            setMessage('当前浏览器需要支持 HLS 才能播放该视频');
          });
        }
      }

      button.addEventListener('click', playVideo);
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayers();
  });
})();
