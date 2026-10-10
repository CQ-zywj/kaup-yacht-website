// Native file/date labels follow the OS locale. Keep the page UI in the site's language.
(function () {
  const fileControls = new WeakMap();
  const dateControls = new WeakMap();
  const locale = () => U.lang === 'en' ? 'en-US' : 'zh-CN';
  const iso = date => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parse = value => MarineCore.validDate(value) ? new Date(value + 'T12:00:00') : null;
  let sequence = 0;

  function fileControl(input) {
    const wrap = document.createElement('div');
    wrap.className = 'localized-file';
    const label = input.labels?.[0];
    const labelKey = label?.querySelector('[data-i18n]')?.dataset.i18n;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'file-select-button';
    const status = document.createElement('span');
    status.className = 'file-selection-status';
    status.setAttribute('aria-live', 'polite');
    input.before(wrap);
    wrap.append(button, status, input);
    input.hidden = true;
    button.onclick = () => input.click();
    function update() {
      const key = input.multiple ? 'chooseFiles' : 'chooseFile';
      button.textContent = U.t(key);
      button.setAttribute('aria-label', U.t(key) + (labelKey ? ': ' + U.t(labelKey) : ''));
      button.disabled = input.disabled;
      status.textContent = input.files.length ? Array.from(input.files, f => f.name).join(', ') : U.t(input.multiple ? 'noFilesSelected' : 'noFileSelected');
      status.title = status.textContent;
    }
    input.addEventListener('change', update);
    input.form?.addEventListener('reset', () => queueMicrotask(update));
    fileControls.set(input, update);
    return update;
  }

  function dateControl(input) {
    input.type = 'text';
    input.dataset.localDate = '';
    input.autocomplete = 'off';
    input.maxLength = 10;
    const wrap = document.createElement('div');
    wrap.className = 'localized-date';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'date-toggle';
    toggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>';
    const popup = document.createElement('div');
    popup.className = 'date-calendar';
    popup.id = 'date-calendar-' + sequence++;
    popup.hidden = true;
    popup.setAttribute('role', 'dialog');
    toggle.setAttribute('aria-controls', popup.id);
    toggle.setAttribute('aria-expanded', 'false');
    input.before(wrap);
    wrap.append(input, toggle, popup);
    let view = new Date();
    view.setDate(1);
    const allowed = value => (!input.min || value >= input.min) && (!input.max || value <= input.max);
    function close(returnFocus = false) {
      popup.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    }
    function choose(value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }
    function render(focusValue) {
      const year = view.getFullYear(), month = view.getMonth();
      const selected = parse(input.value);
      const today = iso(new Date());
      const preferred = focusValue || (selected && selected.getFullYear() === year && selected.getMonth() === month ? input.value : (today.startsWith(iso(view).slice(0, 7)) ? today : iso(view)));
      const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(2026, 0, 4 + i)));
      const start = new Date(year, month, 1).getDay();
      const count = new Date(year, month + 1, 0).getDate();
      popup.setAttribute('aria-label', U.t('openCalendar'));
      popup.innerHTML = `<div class="calendar-header"><button type="button" data-month="-1" aria-label="${U.e(U.t('previousMonth'))}">‹</button><strong aria-live="polite">${U.e(new Intl.DateTimeFormat(locale(), { year: 'numeric', month: 'long' }).format(view))}</strong><button type="button" data-month="1" aria-label="${U.e(U.t('nextMonth'))}">›</button></div><div class="calendar-weekdays" aria-hidden="true">${weekdays.map(day => `<span>${U.e(day)}</span>`).join('')}</div><div class="calendar-days">${'<span></span>'.repeat(start)}${Array.from({ length: count }, (_, i) => {
        const date = new Date(year, month, i + 1), value = iso(date);
        return `<button type="button" data-date="${value}" tabindex="${value === preferred ? '0' : '-1'}" aria-label="${U.e(new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(date))}" aria-pressed="${value === input.value}" ${value === today ? 'aria-current="date"' : ''} ${allowed(value) ? '' : 'disabled'}>${i + 1}</button>`;
      }).join('')}</div><div class="calendar-footer"><button type="button" data-today ${allowed(today) ? '' : 'disabled'}>${U.e(U.t('dateToday'))}</button><button type="button" data-clear>${U.e(U.t('clearDate'))}</button></div>`;
      popup.querySelectorAll('[data-month]').forEach(button => button.onclick = () => {
        view.setMonth(view.getMonth() + Number(button.dataset.month));
        render();
        popup.querySelector(`[data-month="${button.dataset.month}"]`).focus();
      });
      popup.querySelectorAll('[data-date]').forEach(button => button.onclick = () => choose(button.dataset.date));
      popup.querySelector('[data-today]').onclick = () => choose(today);
      popup.querySelector('[data-clear]').onclick = () => choose('');
      if (focusValue) popup.querySelector(`[data-date="${focusValue}"]`)?.focus();
    }
    function open() {
      view = parse(input.value) || new Date();
      view.setDate(1);
      popup.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      render();
      wrap.classList.toggle('calendar-above', wrap.getBoundingClientRect().bottom + popup.offsetHeight > window.innerHeight - 12);
      popup.querySelector('[data-date][tabindex="0"]')?.focus();
    }
    toggle.onclick = () => popup.hidden ? open() : close();
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(); }
    });
    wrap.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popup.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
      const value = event.target.dataset.date;
      if (!value) return;
      const date = parse(value);
      const shift = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (shift) {
        event.preventDefault();
        date.setDate(date.getDate() + shift);
        if (allowed(iso(date))) { view = new Date(date.getFullYear(), date.getMonth(), 1); render(iso(date)); }
      }
    });
    // On macOS, clicking a button can blur the day before click without focusing a new element.
    wrap.addEventListener('focusout', event => {
      if (event.relatedTarget && !wrap.contains(event.relatedTarget)) close();
    });
    document.addEventListener('click', event => { if (!event.composedPath().includes(wrap)) close(); });
    input.form?.addEventListener('reset', () => close());
    function update() {
      input.placeholder = U.t('dateFormat');
      toggle.setAttribute('aria-label', U.t('openCalendar'));
      toggle.disabled = input.disabled;
      if (!popup.hidden) render();
    }
    dateControls.set(input, update);
    return update;
  }
  window.MarineFormControls = {
    enhance() {
      document.querySelectorAll('input[type="file"]').forEach(input => (fileControls.get(input) || fileControl(input))());
      document.querySelectorAll('input[type="date"], input[data-local-date]').forEach(input => (dateControls.get(input) || dateControl(input))());
    },
  };
})();
