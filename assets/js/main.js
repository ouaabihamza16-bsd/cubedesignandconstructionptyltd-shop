/* CUBE DESIGN AND CONSTRUCTION PTY LTD - site behaviour (no tracking, no storage) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('hidden', !open);
    var label = toggle.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Close main menu' : 'Open main menu';
    var iconOpen = toggle.querySelector('[data-icon="open"]');
    var iconClose = toggle.querySelector('[data-icon="close"]');
    if (iconOpen) iconOpen.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) setMenu(false);
    });
  }

  /* ---------- Smooth scroll for in-page links ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (history.pushState) history.pushState(null, '', '#' + id);
    if (target.hasAttribute('tabindex') || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      target.focus({ preventScroll: true });
    }
  });

  /* ---------- Legal modals (<dialog>, Esc closes natively) ---------- */
  var lastOpener = null;

  function openModal(id, opener) {
    var dlg = document.getElementById(id);
    if (!dlg) return;
    lastOpener = opener || document.activeElement;
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
    var closeBtn = dlg.querySelector('[data-close-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function') {
      dlg.close();
    } else {
      dlg.removeAttribute('open');
      restoreFocus();
    }
  }

  function restoreFocus() {
    if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
    lastOpener = null;
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-open-modal'), btn);
    });
  });

  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(dlg); });
    });
    // Click on the backdrop closes the dialog
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeModal(dlg);
    });
    dlg.addEventListener('close', restoreFocus);
  });

  /* ---------- Enquiry form (not connected: validates, never claims to send) ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var statusBox = document.getElementById('form-status');
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = [
    {
      field: form.elements.name,
      error: document.getElementById('f-name-error'),
      check: function (v) { return v.length >= 2 ? '' : 'Please enter your name.'; }
    },
    {
      field: form.elements.email,
      error: document.getElementById('f-email-error'),
      check: function (v) {
        if (!v) return 'Please enter your email address.';
        return emailPattern.test(v) ? '' : 'Please enter a valid email address, for example name@domain.com.au.';
      }
    },
    {
      field: form.elements.message,
      error: document.getElementById('f-message-error'),
      check: function (v) { return v.length >= 10 ? '' : 'Please tell us a little about your project (at least 10 characters).'; }
    }
  ];

  function showError(rule, msg) {
    rule.error.textContent = msg;
    rule.error.classList.toggle('hidden', !msg);
    if (msg) {
      rule.field.setAttribute('aria-invalid', 'true');
    } else {
      rule.field.removeAttribute('aria-invalid');
    }
  }

  function validate(rule) {
    var msg = rule.check(rule.field.value.trim());
    showError(rule, msg);
    return !msg;
  }

  rules.forEach(function (rule) {
    rule.field.addEventListener('blur', function () {
      if (rule.field.value.trim() !== '' || rule.field.hasAttribute('aria-invalid')) validate(rule);
    });
    rule.field.addEventListener('input', function () {
      if (rule.field.hasAttribute('aria-invalid')) validate(rule);
    });
  });

  function setStatus(kind, html) {
    statusBox.className = 'mt-5 rounded-lg p-4 text-sm leading-relaxed ' +
      (kind === 'error'
        ? 'border border-red-700/40 bg-red-50 text-red-800'
        : 'border-2 border-dashed border-copper bg-copper/10 text-charcoal');
    statusBox.innerHTML = html;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    rules.forEach(function (rule) {
      if (!validate(rule) && !firstInvalid) firstInvalid = rule.field;
    });

    if (firstInvalid) {
      setStatus('error', '<strong>Please check the form.</strong> Some required fields need attention.');
      firstInvalid.focus();
      return;
    }

    // The form is not connected to any service, so nothing is sent or stored.
    setStatus('notice',
      '<strong>Not sent.</strong> This form is not connected yet, so your message has not been sent to us and nothing has been stored. ' +
      'Your text is still in the form if you would like to copy it.');
  });
})();
