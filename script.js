/* MonkeFrames motion layer: reveals, header shrink, progress, video loading, search */
(function () {
    'use strict';
    var root = document.documentElement;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    /* ---- Header shrink, scroll progress, back-to-top (one rAF-throttled handler) ---- */
    var header = $('.site-header');
    var progress = $('.scroll-progress');
    var toTop = $('.to-top');
    var ticking = false;

    function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (header) header.classList.toggle('is-scrolled', y > 24);
        if (progress) progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
        if (toTop) toTop.classList.toggle('show', y > 600);
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

    /* ---- Fade-and-rise reveals with staggered delays ---- */
    // Children of [data-stagger] get a short step, capped at 4 steps so nothing waits long.
    $$('[data-stagger]').forEach(function (group) {
        var step = parseInt(group.getAttribute('data-stagger'), 10) || 60;
        $$('[data-reveal]', group).forEach(function (el, i) { el.style.setProperty('--d', Math.min(i, 4) * step); });
    });
    $$('[data-delay]').forEach(function (el) { el.style.setProperty('--d', el.getAttribute('data-delay')); });

    var targets = $$('[data-reveal], [data-draw]');
    if ('IntersectionObserver' in window && !reduced) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    var el = e.target;
                    el.classList.add('in-view');
                    io.unobserve(el);
                    // clear the stagger delay once revealed so hover effects respond instantly
                    var d = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
                    setTimeout(function () { el.style.setProperty('--d', 0); }, 500 + d);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        targets.forEach(function (el) { io.observe(el); });
    } else {
        targets.forEach(function (el) { el.classList.add('in-view'); });
    }

    /* ---- Downloads page: version search with floating label ---- */
    var input = $('#version-search');
    if (input) {
        var rows = $$('.older-release-row');
        var empty = $('.no-results');
        var hint = $('.field-hint');
        input.addEventListener('input', function () {
            var q = input.value.trim().toLowerCase();
            var shown = 0;
            rows.forEach(function (row) {
                var match = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
                row.hidden = !match;
                if (match) shown++;
            });
            if (empty) empty.classList.toggle('show', shown === 0);
            if (hint) hint.textContent = q ? shown + ' of ' + rows.length + ' older versions' : '';
        });
    }

    /* ---- Video: nothing is downloaded until it is about to be seen ---- */
    var saveData = navigator.connection && navigator.connection.saveData;
    function loadVideo(v) {
        if (v.dataset.loaded) return;
        v.dataset.loaded = '1';
        if (v.dataset.src) v.src = v.dataset.src;
        $$('source[data-src]', v).forEach(function (src) { src.src = src.dataset.src; });
        v.load();
    }
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); return p; }

    // Hero loop: wide screens only, and never with reduced motion or Save-Data on (the poster stands in).
    var heroVideo = $('.hero-media video');
    if (heroVideo && !reduced && !saveData && window.matchMedia('(min-width: 761px)').matches) {
        heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
        loadVideo(heroVideo);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { if (e.isIntersecting) play(heroVideo); else heroVideo.pause(); });
            }, { threshold: 0.1 }).observe($('.hero'));
        } else { play(heroVideo); }
    }

    // Demo videos: play while visible, pause when not, with a user toggle.
    $$('.demo').forEach(function (demo) {
        var vid = $('video', demo);
        var tog = $('.demo-toggle', demo);
        if (!vid) return;
        var userPaused = reduced || !!saveData;
        function setPaused(p) {
            demo.classList.toggle('is-paused', p);
            if (tog) tog.setAttribute('aria-label', p ? 'Play video' : 'Pause video');
        }
        setPaused(userPaused);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting && !userPaused) { loadVideo(vid); play(vid); setPaused(false); }
                    else if (!e.isIntersecting) { vid.pause(); }
                });
            }, { threshold: 0.35 }).observe(demo);
        }
        if (tog) tog.addEventListener('click', function () {
            if (vid.paused) { userPaused = false; loadVideo(vid); play(vid); setPaused(false); }
            else { userPaused = true; vid.pause(); setPaused(true); }
        });
    });

    /* ---- Scrollspy for the header pill nav ---- */
    var navLinks = $$('.site-nav a');
    if (navLinks.length && 'IntersectionObserver' in window) {
        var map = {};
        navLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); var t = document.getElementById(id); if (t) map[id] = a; });
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    navLinks.forEach(function (a) { a.classList.remove('active'); });
                    if (map[e.target.id]) map[e.target.id].classList.add('active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
        var top = $('.hero');
        if (top) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.remove('active'); }); }); }, { rootMargin: '-45% 0px -50% 0px' }).observe(top);
    }
})();
