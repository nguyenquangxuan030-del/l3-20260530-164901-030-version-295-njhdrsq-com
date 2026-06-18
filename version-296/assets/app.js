(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('open');
            menuButton.textContent = mobilePanel.classList.contains('open') ? '×' : '☰';
        });
    }

    var slider = document.querySelector('[data-hero-slider]');
    if (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var current = 0;

        function showSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }
    }

    var filterForm = document.querySelector('[data-filter-form]');
    if (filterForm) {
        var keywordInput = filterForm.querySelector('[data-filter-keyword]');
        var regionSelect = filterForm.querySelector('[data-filter-region]');
        var typeSelect = filterForm.querySelector('[data-filter-type]');
        var yearSelect = filterForm.querySelector('[data-filter-year]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var empty = document.querySelector('[data-no-results]');

        function normalized(value) {
            return String(value || '').trim().toLowerCase();
        }

        function filterCards() {
            var keyword = normalized(keywordInput && keywordInput.value);
            var region = normalized(regionSelect && regionSelect.value);
            var type = normalized(typeSelect && typeSelect.value);
            var year = normalized(yearSelect && yearSelect.value);
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalized([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-tags')
                ].join(' '));
                var ok = true;

                if (keyword && haystack.indexOf(keyword) === -1) {
                    ok = false;
                }
                if (region && normalized(card.getAttribute('data-region')) !== region) {
                    ok = false;
                }
                if (type && normalized(card.getAttribute('data-type')).indexOf(type) === -1) {
                    ok = false;
                }
                if (year && normalized(card.getAttribute('data-year')) !== year) {
                    ok = false;
                }

                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle('show', visible === 0);
            }
        }

        [keywordInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', filterCards);
                control.addEventListener('change', filterCards);
            }
        });
    }
})();

function initPlayer(videoUrl) {
    var video = document.querySelector('[data-player-video]');
    var button = document.querySelector('[data-player-button]');
    var ready = false;
    var hlsInstance = null;

    if (!video || !videoUrl) {
        return;
    }

    function attachVideo() {
        if (ready) {
            return;
        }
        ready = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(videoUrl);
            hlsInstance.attachMedia(video);
            return;
        }

        video.src = videoUrl;
    }

    function beginPlay() {
        attachVideo();
        if (button) {
            button.classList.add('hidden');
        }
        video.controls = true;
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
                if (button) {
                    button.classList.remove('hidden');
                }
            });
        }
    }

    if (button) {
        button.addEventListener('click', beginPlay);
    }

    video.addEventListener('click', function () {
        if (!ready) {
            beginPlay();
        }
    });

    window.addEventListener('pagehide', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
