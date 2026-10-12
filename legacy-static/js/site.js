/* Wildfire Express — shared UI (no dependencies) */
(function () {
  'use strict';

  // Where applications and contact messages are POSTed (JSON). Leave empty to only show the success state.
  // Examples: a Formspree / Basin / Getform endpoint, or your own API that forwards to RingCentral / ATS.
  var FORM_ENDPOINT = '';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var smooth = function (a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------ year */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ mobile menu */
  var burger = $('.burger');
  var menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    if ('inert' in menu) menu.inert = !open;
    document.body.classList.toggle('lock', open);
    if (open) { var f = $('a, button', menu); f && f.focus(); } else if (document.activeElement && menu.contains(document.activeElement)) burger.focus();
  }
  if (burger && menu) {
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key === 'Tab') {
        var items = [burger].concat($$('a, button', menu));
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    matchMedia('(min-width: 1180px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ------------------------------------------------------------ row-aware borders */
  function rows() {
    $$('.cols').forEach(function (g) {
      var kids = Array.prototype.slice.call(g.children);
      kids.forEach(function (k, i) {
        var top = k.offsetTop;
        var next = kids[i + 1];
        var prev = kids[i - 1];
        k.classList.toggle('is-row-end', !next || next.offsetTop !== top);
        k.classList.toggle('is-row-start', !prev || prev.offsetTop !== top);
      });
    });
  }
  rows();
  addEventListener('resize', rows);
  document.fonts && document.fonts.ready.then(rows);

  /* ------------------------------------------------------------ counters */
  function fmt(el, v) {
    var dec = +(el.dataset.decimals || 0);
    var s = v.toFixed(dec);
    el.textContent = (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  }
  function count(el, instant) {
    var to = parseFloat(el.dataset.count);
    if (instant || reduced) { fmt(el, to); return; }
    var t0 = performance.now(), dur = 1500;
    (function tick(now) {
      var p = clamp01((now - t0) / dur);
      fmt(el, to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ------------------------------------------------------------ reveals */
  $$('[data-stagger]').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 80 + 'ms'); });
  });
  var reveals = $$('.reveal');
  var counters = $$('[data-count]');
  var vh = innerHeight;
  reveals.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (reduced || (r.top < vh && r.bottom > 0)) el.classList.add('no-anim');
  });
  counters.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (reduced || (r.top < vh && r.bottom > 0)) { count(el, true); el.dataset.done = '1'; } else fmt(el, 0);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.classList.contains('reveal')) el.classList.add('is-in');
        if (el.dataset.count && !el.dataset.done) { el.dataset.done = '1'; count(el); }
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { if (!el.classList.contains('no-anim')) io.observe(el); });
    counters.forEach(function (el) { if (!el.dataset.done) io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (el) { count(el, true); });
  }

  /* ------------------------------------------------------------ sticky hero chapters */
  var hero = $('.hero-scroll');
  if (hero) {
    var markers = $$('[data-shot]', hero);
    var chapters = $$('.chapter', hero);
    var dots = $$('.hero-dots span', hero);
    var bar = $('.hero-progress', hero);
    var keys = [];
    var measure = function () {
      keys = markers.map(function (m) { var r = m.getBoundingClientRect(); return r.top + scrollY + r.height / 2 - innerHeight / 2; });
    };
    var update = function () {
      var y = scrollY;
      var k = 0;
      if (y >= keys[keys.length - 1]) k = keys.length - 1;
      else if (y > keys[0]) {
        var i = 0;
        while (i < keys.length - 1 && keys[i + 1] <= y) i++;
        k = i + (y - keys[i]) / Math.max(1, keys[i + 1] - keys[i]);
      }
      chapters.forEach(function (c, i) {
        var d = k - i;
        var o = 1 - smooth(0.22, 0.48, Math.abs(d));
        c.style.opacity = o.toFixed(3);
        c.style.transform = reduced ? 'none' : 'translateY(' + (-d * 56).toFixed(1) + 'px)';
        c.classList.toggle('is-on', o > 0.02);
        c.setAttribute('aria-hidden', String(o < 0.5));
      });
      var active = Math.round(k);
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === active); });
      if (bar) {
        var r = hero.getBoundingClientRect();
        bar.style.setProperty('--hp', clamp01(-r.top / Math.max(1, r.height - innerHeight)).toFixed(3));
      }
    };
    measure(); update();
    addEventListener('resize', function () { measure(); update(); });
    addEventListener('load', function () { measure(); update(); });
    var ticking = false;
    addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
  }

  /* ------------------------------------------------------------ forms helpers */
  function digits(v) { return (v || '').replace(/\D/g, ''); }
  function validPhone(v) { var d = digits(v); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d.length === 10 && /^[2-9]/.test(d); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function fmtPhone(input) {
    input.addEventListener('input', function () {
      var d = digits(input.value);
      if (d.length === 11 && d[0] === '1') d = d.slice(1);
      d = d.slice(0, 10);
      var out = d;
      if (d.length > 6) out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      else if (d.length > 3) out = '(' + d.slice(0, 3) + ') ' + d.slice(3);
      input.value = out;
    });
  }
  function setErr(input, msg) {
    var box = input.closest('.field, fieldset');
    var err = box && $('.err', box);
    if (input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
    return !msg;
  }
  function radioValue(form, name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function consentRecord(form) {
    var box = $('[data-sms-consent]', form);
    var cb = box && $('input[type=checkbox]', box);
    return {
      sms_consent: !!(cb && cb.checked),
      sms_consent_text: box ? box.textContent.replace(/\s+/g, ' ').trim() : '',
      consent_timestamp: new Date().toISOString(),
      consent_page: location.href,
      user_agent: navigator.userAgent,
    };
  }
  function send(kind, data) {
    data.form = kind;
    if (!FORM_ENDPOINT) { try { console.info('[Wildfire Express] ' + kind + ' submission (no endpoint configured):', data); } catch (e) {} return Promise.resolve(); }
    return fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }
  $$('input[type=tel]').forEach(fmtPhone);

  /* ------------------------------------------------------------ apply form (3 steps) */
  var apply = $('#apply-form');
  if (apply) {
    var steps = $$('.form-step', apply);
    var prog = $('.progress', apply.parentNode);
    var label = $('[data-step-label]', apply.parentNode);
    var names = ['Lane', 'Experience', 'Contact'];
    var cur = 0;
    var params = new URLSearchParams(location.search);
    var pre = params.get('role');
    if (pre) { var r = apply.querySelector('input[name=role][value="' + pre + '"]'); if (r) r.checked = true; }

    var cdlNote = $('[data-cdl-note]', apply);
    $$('input[name=cdl]', apply).forEach(function (i) {
      i.addEventListener('change', function () { if (cdlNote) cdlNote.hidden = radioValue(apply, 'cdl') !== 'no'; });
    });

    var show = function (i) {
      cur = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      if (prog) prog.querySelector('i').style.setProperty('--v', ((i + 1) / steps.length).toFixed(3));
      if (label) label.innerHTML = 'Step <b>' + (i + 1) + '</b> of ' + steps.length + ' · ' + names[i];
      var h = $('legend, h2, .legend', steps[i]);
      var top = apply.parentNode.getBoundingClientRect().top + scrollY - 110;
      if (scrollY > top) scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    };
    var validate = function (i) {
      var ok = true;
      var s = steps[i];
      if (i === 0) {
        ok = setErr($('fieldset[data-role]', s), radioValue(apply, 'role') ? '' : 'Choose the lane that fits you.') && ok;
        ok = setErr($('fieldset[data-cdl]', s), radioValue(apply, 'cdl') ? '' : 'Let us know about your CDL.') && ok;
      }
      if (i === 1) {
        ok = setErr($('fieldset[data-exp]', s), radioValue(apply, 'experience') ? '' : 'Pick your years of experience.') && ok;
        var st = $('#state', s);
        ok = setErr(st, st.value ? '' : 'Select your home state.') && ok;
      }
      if (i === 2) {
        var fn = $('#first', s), ln = $('#last', s), ph = $('#phone', s), em = $('#email', s);
        ok = setErr(fn, fn.value.trim().length > 1 ? '' : 'Enter your first name.') && ok;
        ok = setErr(ln, ln.value.trim().length > 1 ? '' : 'Enter your last name.') && ok;
        ok = setErr(ph, validPhone(ph.value) ? '' : 'Enter a 10-digit US phone number.') && ok;
        ok = setErr(em, !em.value || validEmail(em.value.trim()) ? '' : 'Check the email address.') && ok;
      }
      if (!ok) { var bad = $('[aria-invalid="true"]', s); if (bad && bad.focus) bad.focus(); else { var f = $('input', s); f && f.focus(); } }
      return ok;
    };
    apply.addEventListener('change', function (e) { var fs = e.target.closest('fieldset'); if (fs) setErr(fs, ''); if (e.target.matches('.input')) setErr(e.target, ''); });
    $$('[data-next]', apply).forEach(function (b) { b.addEventListener('click', function () { if (validate(cur)) show(cur + 1); }); });
    $$('[data-back]', apply).forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });
    apply.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(cur)) return;
      if (cur < steps.length - 1) { show(cur + 1); return; }
      var btn = $('[type=submit]', apply);
      btn.disabled = true;
      var data = {
        role: radioValue(apply, 'role'), cdl_a: radioValue(apply, 'cdl'), experience: radioValue(apply, 'experience'),
        home_state: $('#state').value, first_name: $('#first').value.trim(), last_name: $('#last').value.trim(),
        phone: $('#phone').value, email: $('#email').value.trim(),
      };
      Object.assign(data, consentRecord(apply));
      send('application', data).then(function () {
        var done = $('#apply-success');
        $('[data-name]', done).textContent = data.first_name;
        apply.parentNode.hidden = true;
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
      }).catch(function () {
        btn.disabled = false;
        var err = $('[data-submit-err]', apply);
        if (err) err.textContent = 'Something went wrong sending your application. Please call us at +1 (513) 206-5093.';
      });
    });
    show(0);
  }

  /* ------------------------------------------------------------ contact form */
  var contact = $('#contact-form');
  if (contact) {
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#c-name'), ph = $('#c-phone'), em = $('#c-email'), msg = $('#c-msg');
      var ok = true;
      ok = setErr(name, name.value.trim().length > 1 ? '' : 'Enter your name.') && ok;
      ok = setErr(ph, !ph.value || validPhone(ph.value) ? '' : 'Enter a 10-digit US phone number.') && ok;
      ok = setErr(em, !em.value || validEmail(em.value.trim()) ? '' : 'Check the email address.') && ok;
      if (!ph.value && !em.value) ok = setErr(ph, 'Leave a phone number or an email so we can reply.') && ok;
      ok = setErr(msg, msg.value.trim().length > 4 ? '' : 'Write a short message.') && ok;
      if (!ok) { var bad = $('[aria-invalid="true"]', contact); bad && bad.focus(); return; }
      var data = { topic: radioValue(contact, 'topic'), name: name.value.trim(), phone: ph.value, email: em.value.trim(), message: msg.value.trim() };
      Object.assign(data, consentRecord(contact));
      var btn = $('[type=submit]', contact);
      btn.disabled = true;
      send('contact', data).then(function () {
        contact.hidden = true;
        var done = $('#contact-success');
        done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus();
      }).catch(function () {
        btn.disabled = false;
        $('[data-submit-err]', contact).textContent = 'Message failed to send. Please call +1 (513) 206-5093.';
      });
    });
  }
})();
