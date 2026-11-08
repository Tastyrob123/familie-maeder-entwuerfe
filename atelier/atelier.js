/* Die Seite öffnet immer oben im Empfang, ausser die Adresse trägt selbst einen Anker (Robert 18.10.2026 16:23: «Wieso landet man, wenn man auf den Link klickt
   von externen, direkt auf der Seite … und nicht oben im Hero?»). Sprünge schreiben deshalb keinen Anker mehr in die Adresse, und der Browser stellt
   keine alte Scroll-Stelle wieder her. */
(function () {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (!location.hash) { window.scrollTo(0, 0); addEventListener('load', function () { if (!location.hash && window.pageYOffset > 0 && !window.__gesprungen) window.scrollTo(0, 0); }); }
  addEventListener('pageshow', function (ev) { if (ev.persisted && !location.hash) window.scrollTo(0, 0); });
  document.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (a) window.__gesprungen = true; }, true);
  // Alle übrigen Sprungmarken (Menü, Logo, Knöpfe) springen weich, ohne den Anker in die Adresse zu schreiben; sonst landet Neuladen wieder dort
  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented) return; var a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1), z = id && document.getElementById(id); if (!z && id !== 'oben' && id !== '') return;
    ev.preventDefault();
    if (!z || id === 'oben') window.scrollTo({ top: 0, behavior: 'smooth' }); else z.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
/* Landingpage Familie Maeder: Einblenden beim Hereinscrollen, Fenster nur rechnen, wenn sie nah sind,
   je Haus eine Bühne mit sieben Stücken (Leiste, Pfeile, Wischen). Bewegt wird nur über transform und opacity (atelier.css), der Scroll bleibt nativ. */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, e) { return (e || d).querySelector(s); }, $$ = function (s, e) { return [].slice.call((e || d).querySelectorAll(s)); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches, io = 'IntersectionObserver' in window;

  // Grosse Zeilen bleiben einzeilig: passt eine nicht in ihre Spalte, wird der Titel als Ganzes kleiner
  function passe() {
    var zt = $$('.zt'); zt.forEach(function (t) { t.style.fontSize = ''; });
    var mass = zt.map(function (t) { var w = 0; $$('.z>span', t).forEach(function (s) { w = Math.max(w, s.offsetWidth); }); return [t.clientWidth, w, parseFloat(getComputedStyle(t).fontSize)]; });
    zt.forEach(function (t, i) { var m = mass[i]; if (m[0] > 0 && m[1] > m[0]) t.style.fontSize = (m[2] * m[0] / m[1] * 0.985).toFixed(1) + 'px'; });
  }
  passe();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(passe);
  var pt = 0; addEventListener('resize', function () { clearTimeout(pt); pt = setTimeout(passe, 140); });

  // Einblenden: ein Abschnitt öffnet sich, sobald er ein Stück weit im Bild ist; das Fenster erst, wenn ein Drittel frei ist
  var teile = $$('.raum'), fenster = $$('.bruch');
  if (!io || ruhig) { teile.concat(fenster).forEach(function (t) { t.classList.add('offen', 'nah'); }); $$('[data-e]').forEach(function (t) { t.classList.add('da'); }); }
  else {
    var auf = function (schwelle) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('offen'); o.unobserve(e.target); } }); }, { threshold: schwelle });
      return o;
    };
    var o1 = auf(0.14), o2 = auf(0.34);
    // Hohe Abschnitte (am Handy höher als der Bildschirm) erreichen 14 % nie: sie öffnen, sobald ihr Anfang ein gutes Stück im Bild ist
    var o1b = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('offen'); o1b.unobserve(e.target); } }); }, { rootMargin: '0px 0px -22% 0px' });
    teile.forEach(function (t) { o1b.observe(t); });
    // Im Abschnitt «Was es bringt» schwebt jedes Stück erst herauf, wenn es selbst ins Bild kommt (iPhones, Kacheln)
    // sofort, sobald die Oberkante unten ins Bild kommt (der Rand gleicht den Weg nach unten aus, den das Stück vor dem Einschweben hat), Robert 18.10.2026 00:20
    var o5 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); o5.unobserve(e.target); } }); }, { rootMargin: '0px 0px 12% 0px', threshold: 0 });
    $$('.raum--warum [data-e="schweb"]').forEach(function (t) { o5.observe(t); });
    teile.forEach(function (t) { o1.observe(t); }); fenster.forEach(function (t) { o2.observe(t); });
    // das stehende Bild eines Fensters wird nur gerechnet, solange das Fenster in der Nähe ist
    var o3 = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('nah', e.isIntersecting); }); }, { rootMargin: '60% 0px' });
    fenster.forEach(function (t) { o3.observe(t); });
    // das Bild im Fenster zieht gegen die Seite: sie fährt hinauf, das Bild hinunter (nur transform, ein Takt je Bild)
    var takt = 0, vh = innerHeight;
    var zieh = function () {
      takt = 0;
      var nah = fenster.filter(function (f) { return f.classList.contains('nah'); });
      var lage = nah.map(function (f) { var r = f.getBoundingClientRect(); return (r.top + r.height / 2 - vh / 2) / vh; });   // erst alles lesen, dann alles schreiben
      nah.forEach(function (f, i) { $('.vb, img', f).style.transform = 'translate3d(0,' + (-Math.max(-1, Math.min(1, lage[i])) * vh * 0.2).toFixed(1) + 'px,0)'; });
    };
    addEventListener('scroll', function () { if (!takt) takt = requestAnimationFrame(zieh); }, { passive: true });
    addEventListener('resize', function () { vh = innerHeight; zieh(); });
    zieh();
    // Leiste oben: das Haus, in dem man gerade steht
    var links = $$('.insel nav a'), an = {};
    var o4 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { an[e.target.dataset.haus] = (an[e.target.dataset.haus] || 0) + (e.isIntersecting ? 1 : -1); });
      links.forEach(function (a) { a.classList.toggle('an', an[a.getAttribute('href').slice(1)] > 0); });
    }, { rootMargin: '-46% 0px -50% 0px' });
    $$('[data-haus]').forEach(function (t) { o4.observe(t); });
  }

  // Leiste weg beim Runterscrollen, zurück beim Hochscrollen, wie auf den Hotelseiten (Robert 17.10.2026; Regel aus werkbank.js, Bewegung in werkbank.css .leiste.weg)
  (function () {
    var leiste = $('.leiste'); if (!leiste) return;
    var yAlt = scrollY, richt = 0, anker = yAlt, lt = 0;
    var schau = function () {
      lt = 0; var y = scrollY;
      if ((y - yAlt) * richt < 0 || (!richt && y !== yAlt)) { richt = y > yAlt ? 1 : -1; anker = yAlt; }
      if (y < 140) leiste.classList.remove('weg');
      else if (richt > 0 && y - anker > 24) leiste.classList.add('weg');
      else if (richt < 0 && anker - y > 24) leiste.classList.remove('weg');
      yAlt = y;
    };
    addEventListener('scroll', function () { if (!lt) lt = requestAnimationFrame(schau); }, { passive: true });
    leiste.addEventListener('focusin', function () { leiste.classList.remove('weg'); });
  })();

  // Grosse Zahlen zählen hoch, sobald sie zu gut der Hälfte im Bild sind (nur der Text wechselt, die Breite steht vorher fest)
  $$('[data-zahl]').forEach(function (z) {
    var ziel = parseInt(z.dataset.zahl, 10); z.style.minWidth = String(ziel).length + 'ch';
    if (ruhig || !io) return;
    z.textContent = '0';
    var oz = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; oz.disconnect();
      var t0 = performance.now(), dauer = 1500;
      (function schritt(t) { var p = Math.min(1, (t - t0) / dauer); z.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(schritt); })(t0);
    }, { threshold: 0.6 });
    oz.observe(z);
  });

  // Bühne: ein Stück ist zu sehen
  $$('.raum--haus').forEach(function (raum) {
    var st = $$('.st-t', raum).map(function (x) { return x.dataset.st; }), jetzt = st[0];
    function zeig(s) {
      if (s === jetzt) return; jetzt = s;
      $$('.st-t,.st-b', raum).forEach(function (e) {
        var da = e.dataset.st === s;
        if (!da && e.classList.contains('an') && e.classList.contains('st-b')) { e.classList.add('weg'); setTimeout(function () { e.classList.remove('weg'); }, 420); }
        e.classList.toggle('an', da);
      });
      $$('.lk', raum).forEach(function (e) {
        var da = e.dataset.st === s; e.classList.toggle('an', da);
        if (da) e.setAttribute('aria-current', 'true'); else e.removeAttribute('aria-current');
      });
      var lk = $('.lk.an', raum), l = lk && lk.parentNode;
      if (l && l.scrollWidth > l.clientWidth + 2) l.scrollTo({ left: lk.offsetLeft - l.offsetLeft - (l.clientWidth - lk.offsetWidth) / 2, behavior: ruhig ? 'auto' : 'smooth' });
    }
    function schritt(r) { zeig(st[(st.indexOf(jetzt) + r + st.length) % st.length]); }
    $$('.lk', raum).forEach(function (k) { k.addEventListener('click', function () { zeig(k.dataset.st); }); });
    $$('[data-vor]', raum).forEach(function (k) { k.addEventListener('click', function () { schritt(1); }); });
    $$('[data-zur]', raum).forEach(function (k) { k.addEventListener('click', function () { schritt(-1); }); });
    raum.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') schritt(1); else if (e.key === 'ArrowLeft') schritt(-1); });
    var b = $('.buehne', raum), x0 = null, y0 = 0;
    b.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    b.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) schritt(dx < 0 ? 1 : -1);
    }, { passive: true });
  });
})();

/* Fassung 17.10.2026: «Wenn Sie mehr sehen möchten» klappt die drei Häuser auf (auch bei einem Sprung auf ein Haus darin),
   der Rechner rechnet mit (dieselbe Formel wie in der Carlton-Werkbank, _werkbank/vertrieb.py). */
(function () {
  'use strict';
  var d = document, kn = d.querySelector('.mr__kn'), box = d.getElementById('mehr-haeuser');
  function auf(offen) {
    if (!kn || !box) return;
    box.hidden = !offen; kn.setAttribute('aria-expanded', offen ? 'true' : 'false');
    kn.querySelector('[data-zu]').hidden = offen; kn.querySelector('[data-auf]').hidden = !offen;
  }
  if (kn) kn.addEventListener('click', function () {
    var offen = kn.getAttribute('aria-expanded') !== 'true'; auf(offen);
    if (offen) { var z = box.querySelector('.bruch, .raum'); if (z) { if (window.fensterMittig) window.fensterMittig(z); else z.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
  });
  function ziel(hash) { var el = hash && hash.length > 1 && d.getElementById(hash.slice(1)); if (el && box && box.contains(el)) { auf(true); return el; } return null; }
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (!a) return;
    var el = ziel(a.getAttribute('href')); if (el) { ev.preventDefault(); requestAnimationFrame(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
  });
  var start = ziel(location.hash); if (start) requestAnimationFrame(function () { start.scrollIntoView(); });

  var R = d.getElementById('rechner'); if (!R) return;
  var S = {}, nf = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });
  function wert(el) { var t = String(el.value).replace(/[’'   ]/g, '').replace(/,/g, '.'); if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, ''); var v = parseFloat(t); return isFinite(v) ? v : null; }
  function setze(k, t) { [].forEach.call(R.querySelectorAll('[data-r="' + k + '"]'), function (x) { x.textContent = t; }); }
  function zeig() {
    var ok = true, k; for (k in S) if (S[k] === null) ok = false; var D = '–';
    var u = ok ? S.zimmer * 365 * (S.belegung / 100) * S.preis : 0, p = ok ? u / 100 * (S.kommission / 100) : 0;
    setze('umsatz', ok ? nf.format(Math.round(u)) : D); setze('portal', ok ? nf.format(Math.round(u * (S.anteil / 100) * (S.kommission / 100))) : D);
    setze('punkt', ok ? nf.format(Math.round(p)) : D); setze('bleibt', ok ? nf.format(Math.round(p * S.wechsel)) : D); setze('wechsel', ok ? nf.format(S.wechsel) : D);
    [].forEach.call(R.querySelectorAll('[data-rs]'), function (x) { var n = +x.getAttribute('data-rs'); x.querySelector('i').textContent = ok ? nf.format(Math.round(p * n)) : D; x.classList.toggle('rs--an', n === S.wechsel); });
  }
  [].forEach.call(R.querySelectorAll('.rf input'), function (f) {
    var k = f.getAttribute('data-k'); S[k] = wert(f); if (S[k] !== null) f.value = nf.format(S[k]);
    f.addEventListener('input', function () { S[k] = wert(f); zeig(); });
    f.addEventListener('blur', function () { var v = wert(f); if (v !== null) f.value = nf.format(v); });
  });
  zeig();
})();

/* Fächer «Alles zu diesem Haus» (17.10.2026 abends, Vorbild Fuss der Carlton-Werkbank): Pfeile, Tippen auf ein Stück daneben, Pfeiltasten, seitliches Wischen.
   Kein Mausrad, kein eigenes Scrollen: nach oben und unten scrollt immer die Seite. */
(function () {
  'use strict';
  [].forEach.call(document.querySelectorAll('[data-fa]'), function (f) {
    var bl = [].slice.call(f.querySelectorAll('.fblatt')), tx = [].slice.call(f.querySelectorAll('.fa__texte>div')), zahl = f.querySelector('[data-f-zahl]'), n = bl.length, ist = 0, halb = Math.floor(n / 2);
    if (!n) return;
    function zeige(k) {
      ist = (k % n + n) % n;
      bl.forEach(function (b, i) { var p = ((i - ist + n + halb) % n) - halb; b.setAttribute('data-p', p); b.setAttribute('aria-hidden', p !== 0); b.tabIndex = p === 0 ? 0 : -1; });
      tx.forEach(function (t, i) { t.classList.toggle('an', i === ist); [].forEach.call(t.querySelectorAll('a'), function (a) { a.tabIndex = i === ist ? 0 : -1; }); });
      if (zahl) zahl.textContent = ist + 1;
    }
    [].forEach.call(f.querySelectorAll('[data-f]'), function (b) { b.addEventListener('click', function () { zeige(ist + (+b.getAttribute('data-f'))); }); });
    bl.forEach(function (b, i) { b.addEventListener('click', function (ev) { if (i !== ist) { ev.preventDefault(); zeige(i); } }); });
    f.setAttribute('tabindex', '0');
    f.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight') { ev.stopPropagation(); zeige(ist + 1); } else if (ev.key === 'ArrowLeft') { ev.stopPropagation(); zeige(ist - 1); } });
    var x0 = null, y0 = 0, st = f.querySelector('.fa__b');
    st.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
    st.addEventListener('touchend', function (ev) {
      if (x0 === null) return; var dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) zeige(ist + (dx < 0 ? 1 : -1));
    }, { passive: true });
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting) { f.classList.add('da'); setTimeout(function () { f.classList.add('steht'); }, 1900); o.disconnect(); } }); }, { threshold: .25 }).observe(f);
    else f.classList.add('da', 'steht');
    zeige(0);
  });
})();

/* Die Zahlen zum Selbsteintragen im Rechner zählen beim ersten Erscheinen einmal kurz hoch (Robert 18.10.2026 00:20: «möchte ich, dass diese Zahlen zum Selbsteintragen einmal kurz so hochzählen»).
   Nur die Anzeige in den Feldern, gerechnet wird mit den eingetragenen Werten. Wer in ein Feld tippt, bekommt sofort den vollen Wert. */
(function () {
  'use strict';
  var R = document.getElementById('rechner');
  if (!R || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var f = [].slice.call(R.querySelectorAll('.rf input')); if (!f.length) return;
  var nf = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }), fertig = false;
  var ziel = f.map(function (x) { return x.value; }), zahl = ziel.map(function (t) { return parseFloat(String(t).replace(/[’'\s]/g, '')); });
  if (zahl.some(function (z) { return !isFinite(z); })) return;
  function voll() { fertig = true; f.forEach(function (x, i) { x.value = ziel[i]; }); }
  f.forEach(function (x) { x.value = '0'; x.addEventListener('focus', function () { if (!fertig) voll(); }); });
  // Auch die Ergebnisse zählen einmal mit hoch (Robert 18.10.2026 17:15 zur Rechnung: «da zählen die Zahlen nicht hoch»): Jahresbetrag, Wert je Punkt, die vier Zeilen
  // «1 von 100 …», Zimmerumsatz. Die Breite steht vorher fest (rechtsbündig, gleich breite Ziffern), damit nichts springt.
  // Die Zahlen im Fliesstext zählen nicht mit, sie stehen sofort (Robert 18.10.2026 19:10: «der ganze abschnitt flackert beim scrollen am anfang wenn die zahlen hochzählen»)
  var erg = [].slice.call(R.querySelectorAll('.vt-erg [data-r], .vt-r__u [data-r], [data-rs] i')), ez = [], et = [];
  function ergebnis(e) { erg.forEach(function (x, i) { if (isFinite(ez[i])) x.textContent = e >= 1 ? et[i] : nf.format(Math.round(ez[i] * e)); }); }
  var o = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return; o.disconnect();
    erg.forEach(function (x, i) {
      et[i] = x.textContent; ez[i] = parseFloat(String(et[i]).replace(/[’'\s]/g, ''));
      var b = x.getBoundingClientRect().width; x.style.display = 'inline-block'; x.style.width = Math.ceil(b + 2) + 'px'; x.style.whiteSpace = 'nowrap'; x.style.textAlign = 'right'; x.style.fontVariantNumeric = 'tabular-nums';
    });
    ergebnis(0);
    var t0 = performance.now(), dauer = 1300;
    (function schritt(t) {
      if (fertig) return ergebnis(1);
      var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3);
      if (p >= 1) { ergebnis(1); return voll(); }
      f.forEach(function (x, i) { x.value = nf.format(Math.round(zahl[i] * e)); });
      ergebnis(e);
      requestAnimationFrame(schritt);
    })(t0);
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  o.observe(f[0].closest('.rf'));
})();

/* Sprung zu einem Haus: man steht gerade vor seinem Fenster, das Fenster mittig im Bildschirm, die Schrift (fest in der Bildschirmmitte) mittig im Fenster
   (Robert 18.10.2026 13:58: «Das soll bitte ganz normal mittig sein. Also die Perspektive. Wie bei einem Fenster halt, normal. Wenn man davor steht, gerade.»).
   Gilt für jeden Knopf und jeden Menüpunkt zu einem Haus und für «Die drei Häuser zeigen». Das Scrollen von Hand bleibt, wie es ist. */
(function () {
  'use strict';
  var d = document;
  function fenster(raum) { var b = raum && raum.previousElementSibling; while (b && !b.classList.contains('bruch')) b = b.previousElementSibling; return b; }
  function mittig(br) {
    var r = br.getBoundingClientRect();
    var y = r.top + window.pageYOffset - (window.innerHeight - r.height) / 2;
    window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  window.fensterMittig = mittig;
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1), raum = id && d.getElementById(id);
    if (!raum || !raum.classList.contains('raum--haus')) return;
    var box = d.getElementById('mehr-haeuser'), kn = d.querySelector('.mr__kn');
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (box && box.contains(raum) && box.hidden && kn) { box.hidden = false; kn.setAttribute('aria-expanded', 'true'); kn.querySelector('[data-zu]').hidden = true; kn.querySelector('[data-auf]').hidden = false; }
    var br = fenster(raum);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (br) mittig(br); else raum.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
  }, true);
  // Seite mit Sprungziel geöffnet (…/#doldenhorn): nach dem Laden ebenso gerade vor das Fenster
  var h = location.hash.slice(1), r0 = h && d.getElementById(h);
  if (r0 && r0.classList.contains('raum--haus')) addEventListener('load', function () { function g() { var b0 = fenster(r0); if (!b0) return; var r = b0.getBoundingClientRect(); window.scrollTo({ top: Math.max(0, Math.round(r.top + window.pageYOffset - (window.innerHeight - r.height) / 2)), behavior: 'instant' }); } setTimeout(g, 250); setTimeout(g, 900); });
})();
