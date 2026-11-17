/* Schnitzler & Partner, Entwurf: Kopfleiste, Handymenü, Parallax, Einblenden, Zähler, Laufband, Film auf Klick, Formular per E-Mail, Demo-Leiste. Vanilla, kein Framework. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Kopfleiste: ab 20 px weiß */
  var nav = $('#nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 20); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Handymenü: kein Scroll-Lock (dc-5-08), ESC, Link, Tipp außerhalb der Liste und Wischen nach rechts schließen */
  var burger = $('#burger'), mmenu = $('#mmenu'), mclose = $('#mclose');
  function openMenu() { mmenu.classList.add('open'); nav.classList.add('menu-open'); mmenu.removeAttribute('inert'); burger.setAttribute('aria-expanded', 'true'); setTimeout(function () { mclose.focus(); }, 50); }
  function closeMenu() { mmenu.classList.remove('open'); nav.classList.remove('menu-open'); mmenu.setAttribute('inert', ''); burger.setAttribute('aria-expanded', 'false'); }
  if (burger && mmenu) {
    burger.addEventListener('click', openMenu);
    mclose.addEventListener('click', closeMenu);
    $$('a', mmenu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mmenu.classList.contains('open')) { closeMenu(); burger.focus(); } });
    mmenu.addEventListener('click', function (e) { if (e.target === mmenu) closeMenu(); });
    var sx = 0, sy = 0, track = false;
    mmenu.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; track = true; }, { passive: true });
    mmenu.addEventListener('touchmove', function (e) {
      if (!track) return;
      var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (dx > 58 && Math.abs(dx) > Math.abs(dy)) { track = false; closeMenu(); }
    }, { passive: true });
    mmenu.addEventListener('touchend', function () { track = false; });
  }

  /* aria-current: Kopf ist auf allen Seiten byte-gleich, das Skript markiert die aktuelle Seite */
  var hier = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__links a, .dd__p a, .nav__cta, .mmenu__links a, .mmenu__sub a, .foot a').forEach(function (a) {
    var ziel = (a.getAttribute('href') || '').split('#');
    if (ziel[0] === hier && !ziel[1]) a.setAttribute('aria-current', 'page');
  });
  if (/^(wir-suchen-sie|initiativbewerbung|service)/.test(hier)) $$('.dd__t, .mmenu__links a[href="wir-suchen-sie.html"]').forEach(function (a) { a.setAttribute('aria-current', 'true'); });
  if (/^blog/.test(hier)) $$('.nav__links a[href="blog.html"], .mmenu__links a[href="blog.html"]').forEach(function (a) { a.setAttribute('aria-current', 'true'); });

  /* Hero-Parallax 50 Prozent, nur Verschiebung, rAF-gedrosselt, nur solange der Kopf sichtbar ist (dc-4-01) */
  var par = $$('[data-par]');
  if (par.length && !reduce) {
    var tick = false;
    var run = function () {
      var y = window.scrollY;
      par.forEach(function (img) {
        var box = img.closest('[data-par-box]');
        if (box && y > box.offsetTop + box.offsetHeight) return;
        img.style.transform = 'translate3d(0,' + (y * 0.5).toFixed(1) + 'px,0)';
      });
      tick = false;
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* Zähler: zählen beim ersten Sichtbarwerden hoch */
  function zaehle(el) {
    var ziel = parseInt(el.dataset.zahl, 10), vor = el.dataset.vor || '', nach = el.dataset.nach || '', t0 = null;
    if (reduce) { el.textContent = vor + ziel + nach; return; }
    var schritt = function (t) {
      if (!t0) t0 = t;
      var f = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - f, 3);
      el.textContent = vor + Math.round(ziel * e) + nach;
      if (f < 1) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  /* Einblenden beim Scrollen, nur mit IntersectionObserver, gestaffelt je Raster */
  var rev = $$('.head, .sie > *, .motto a, .about > *, .kachel, .film > *, .post, .presse a, .pkarte, .hof__b, .spot__b, .teams > div, .mensch, .pdetail, .dl__box, .kontakt > *, .summary, .scale, .cmp, .tech, .ds, .fonts, .why4, .refs, .todo, .jahr, .sm__col, .prose, .artikel aside');
  var zahlen = $$('[data-zahl]');
  if (!reduce && 'IntersectionObserver' in window) {
    rev.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rev.forEach(function (el) { io.observe(el); });
    [['.kachel'], ['.post'], ['.mensch'], ['.motto a'], ['.pkarte'], ['.presse a']].forEach(function (s) {
      $$(s[0]).forEach(function (el, i) { el.style.transitionDelay = ((i % 6) * 0.07) + 's'; });
    });
    var iz = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { zaehle(e.target); iz.unobserve(e.target); } });
    }, { threshold: 0.4 });
    zahlen.forEach(function (el) { el.textContent = (el.dataset.vor || '') + '0' + (el.dataset.nach || ''); iz.observe(el); });
  }

  /* Laufband unter dem Hero: am Handy läuft es, Anfassen hält kurz an, Wischen verschiebt; am Desktop steht es (dc-7-01) */
  function band(box, inhalt, tempo) {
    if (!box || reduce || window.innerWidth > 680) return;
    Array.prototype.slice.call(inhalt.children).forEach(function (k) { var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); inhalt.appendChild(c); });
    box.style.overflowX = 'auto'; box.style.scrollbarWidth = 'none';
    var halt = false, zuletzt = 0, pause = 0, pos = 0;
    box.addEventListener('touchstart', function () { halt = true; clearTimeout(pause); }, { passive: true });
    box.addEventListener('touchend', function () { clearTimeout(pause); pause = setTimeout(function () { halt = false; pos = box.scrollLeft; }, 1800); });
    var halbe = function () { return box.scrollWidth / 2; };
    var lauf = function (t) {
      var dt = zuletzt ? Math.min(64, t - zuletzt) : 16; zuletzt = t;
      if (!halt) { pos += dt * tempo; if (pos >= halbe()) pos -= halbe(); box.scrollLeft = pos; }
      else if (box.scrollLeft >= halbe()) box.scrollLeft -= halbe();
      requestAnimationFrame(lauf);
    };
    requestAnimationFrame(lauf);
  }
  var ribbon = $('.ribbon');
  if (ribbon) band(ribbon, $('.ribbon__in', ribbon), 0.035);

  /* Film: lädt erst auf Klick vom Server der Kanzlei, vorher keine Verbindung */
  $$('[data-film]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = document.createElement('video');
      v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('aria-label', b.getAttribute('aria-label'));
      v.poster = b.dataset.poster;
      var s = document.createElement('source'); s.src = b.dataset.film; s.type = 'video/mp4'; v.appendChild(s);
      b.replaceWith(v);
    });
  });

  /* Formular: im Entwurf öffnet Absenden das E-Mail-Programm mit allen Angaben */
  $$('form[data-mail]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var zeilen = $$('input:not([type=checkbox]), textarea', f).map(function (el) { var l = el.closest('label'); var n = l ? l.firstChild.textContent.trim().replace(/\s*\*$/, '') : el.name; return n + ': ' + el.value.trim(); });
      location.href = 'mailto:' + f.dataset.mail + '?subject=' + encodeURIComponent(f.dataset.betreff) + '&body=' + encodeURIComponent(zeilen.join('\n'));
    });
  });

  /* Nach-oben-Knopf der Hinweisseite */
  var tocTop = $('#tocTop');
  if (tocTop) { var tt = function () { tocTop.classList.toggle('show', window.scrollY > 640); }; tt(); window.addEventListener('scroll', tt, { passive: true }); }

  /* Demo-Leiste: erscheint bei jedem Laden, X blendet nur die aktuelle Ansicht aus */
  var demobar = $('#demobar'), dclose = $('#demoClose');
  if (demobar) { setTimeout(function () { demobar.classList.add('show'); }, 900); if (dclose) dclose.addEventListener('click', function () { demobar.classList.remove('show'); }); }
})();
