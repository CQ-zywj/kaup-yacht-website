(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carouselRoot = document.querySelector('.portal-carousel');
  if (carouselRoot) {
    const slides = [...carouselRoot.querySelectorAll('[data-slide]')];
    const dots = [...carouselRoot.querySelectorAll('[data-slide-to]')];
    const pause = carouselRoot.querySelector('[data-carousel="pause"]');
    const status = carouselRoot.querySelector('#carousel-status');
    function render(state) {
      slides.forEach((slide, index) => {slide.hidden = index !== state.index;});
      dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === state.index)));
      if (pause) pause.hidden = state.reducedMotion;
      // Hover/focus suspensions are temporary; this button controls the user's persistent pause.
      if (pause) pause.dataset.i18nAria = state.userPaused ? 'carouselPlay' : 'carouselPause';
      if (pause) pause.setAttribute('aria-label', U.t(pause.dataset.i18nAria));
      if (pause) pause.querySelector('span').textContent = state.userPaused ? '▷' : 'Ⅱ';
      if (state.manual) status.textContent = `${state.index + 1} / ${slides.length}: ${U.t(slides[state.index].dataset.titleKey)}`;
    }
    const carousel = MarineCarousel.createCarousel({count:slides.length, interval:5000, reducedMotion:reduced.matches, onChange:render});
    carouselRoot.addEventListener('mouseenter', () => carousel.pause('hover'));
    carouselRoot.addEventListener('mouseleave', () => carousel.resume('hover'));
    carouselRoot.addEventListener('focusin', () => carousel.pause('focus'));
    carouselRoot.addEventListener('focusout', event => {if (!carouselRoot.contains(event.relatedTarget)) carousel.resume('focus');});
    carouselRoot.addEventListener('click', event => {
      const dot = event.target.closest('[data-slide-to]');
      const action = event.target.closest('[data-carousel]')?.dataset.carousel;
      if (dot) carousel.go(Number(dot.dataset.slideTo));
      else if (action === 'pause') carousel.toggle();
      else if (action === 'next') carousel.next();
      else if (action === 'previous') carousel.previous();
    });
    carouselRoot.addEventListener('keydown', event => {
      if (event.code === 'Space' && event.target === carouselRoot) {event.preventDefault();carousel.toggle();return;}
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowRight') carousel.next();
      else if (event.key === 'ArrowLeft') carousel.previous();
      else carousel.go(event.key === 'Home' ? 0 : slides.length - 1);
      if (event.target.closest('[data-slide]')) carouselRoot.focus({preventScroll:true});
    });
    let touchStart, suppressSwipeClick = false;
    const slideWindow = carouselRoot.querySelector('.carousel-window');
    slideWindow.addEventListener('pointerdown', event => {if (event.pointerType === 'touch') touchStart = {x:event.clientX,y:event.clientY};});
    slideWindow.addEventListener('pointercancel', () => {touchStart = null;});
    slideWindow.addEventListener('pointerup', event => {
      if (!touchStart) return;
      const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        suppressSwipeClick = true;
        dx < 0 ? carousel.next() : carousel.previous();
        setTimeout(() => {suppressSwipeClick = false;}, 350);
      }
    });
    slideWindow.addEventListener('click', event => {if (suppressSwipeClick) {event.preventDefault(); event.stopPropagation(); suppressSwipeClick = false;}}, true);
    const visibility = () => document.hidden ? carousel.pause('hidden') : carousel.resume('hidden');
    document.addEventListener('visibilitychange', visibility);
    visibility();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {entries[0].isIntersecting ? carousel.resume('offscreen') : carousel.pause('offscreen');}, {threshold:0.2}).observe(carouselRoot);
    }
    reduced.addEventListener('change', event => {event.matches ? carousel.pause('reduced') : carousel.resume('reduced');});
    window.addEventListener('pagehide', event => {event.persisted ? carousel.pause('page') : carousel.destroy();});
    window.addEventListener('pageshow', event => {if (event.persisted) carousel.resume('page');});
    window.addEventListener('languagechange', () => {
      dots.forEach(dot => dot.setAttribute('aria-label', `${U.t('carouselShow')}: ${U.t(dot.dataset.titleKey)}`));
      status.textContent = '';
      render(carousel.state());
    });
  }

  const directory = document.querySelector('.industry-directory');
  if (directory) {
    const entries = [...directory.querySelectorAll('.directory-entry')];
    const desktopHover = window.matchMedia('(min-width: 768px) and (hover: hover)');
    let pinned;
    function close(entry) {
      entry.querySelector('.industry-flyout').hidden = true;
      entry.querySelector('button').setAttribute('aria-expanded', 'false');
      entry.querySelector('button').dataset.i18nAria = 'expandIndustry';
      entry.classList.remove('expanded');
    }
    function open(entry) {
      entries.filter(other => other !== entry).forEach(close);
      entry.querySelector('.industry-flyout').hidden = false;
      entry.querySelector('button').setAttribute('aria-expanded', 'true');
      entry.querySelector('button').dataset.i18nAria = 'collapseIndustry';
      entry.classList.add('expanded');
      U.translate();
    }
    function closeAll() {pinned = null; entries.forEach(close); U.translate();}
    entries.forEach(entry => {
      entry.querySelector('button').addEventListener('click', () => {
        if (pinned === entry) closeAll();
        else {pinned = entry; open(entry);}
      });
      entry.addEventListener('mouseenter', () => {if (desktopHover.matches && !pinned) open(entry);});
      entry.addEventListener('mouseleave', () => {if (pinned !== entry && !entry.contains(document.activeElement)) close(entry);});
      entry.addEventListener('focusin', () => {if (desktopHover.matches) open(entry);});
    });
    directory.addEventListener('focusout', event => {if (!directory.contains(event.relatedTarget)) closeAll();});
    document.addEventListener('pointerdown', event => {if (!directory.contains(event.target)) closeAll();});
    directory.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const button = directory.querySelector('[aria-expanded="true"]');
        closeAll(); button?.focus(); closeAll();
      }
    });
  }

  const filterPanel = document.getElementById('filter-panel');
  const filterTrigger = document.getElementById('toggle-filters');
  if (filterPanel && filterTrigger) {
    const mobile = window.matchMedia('(max-width: 767px)');
    const backdrop = document.createElement('div');
    backdrop.className = 'filter-backdrop'; backdrop.hidden = true;
    document.body.append(backdrop);
    function syncDrawer() {
      const open = mobile.matches && filterPanel.classList.contains('open');
      backdrop.hidden = !open;
      document.body.classList.toggle('filter-open', open);
      filterTrigger.setAttribute('aria-expanded', String(open));
      if (open) {
        filterPanel.setAttribute('role', 'dialog');
        filterPanel.setAttribute('aria-modal', 'true');
        filterPanel.setAttribute('aria-label', U.t('filters'));
      } else {
        filterPanel.removeAttribute('role'); filterPanel.removeAttribute('aria-modal');
      }
      for (const id of ['header','footer']) document.getElementById(id).inert = open;
      for (const node of document.querySelectorAll('#main > .container > :not(.catalog-layout), .catalog-layout > section, .back-top')) node.inert = open;
    }
    function close(restoreFocus = true) {
      filterPanel.classList.remove('open'); syncDrawer();
      if (restoreFocus && mobile.matches) filterTrigger.focus();
    }
    filterTrigger.addEventListener('click', () => {syncDrawer(); if (mobile.matches && filterPanel.classList.contains('open')) filterPanel.querySelector('[data-close-filters]')?.focus();});
    backdrop.addEventListener('click', () => close());
    filterPanel.addEventListener('click', event => {
      if (event.target.closest('[data-close-filters]')) close();
      else if (mobile.matches && filterPanel.classList.contains('open') && !filterPanel.contains(document.activeElement)) filterPanel.querySelector('#reset')?.focus();
    });
    document.addEventListener('keydown', event => {
      if (!mobile.matches || !filterPanel.classList.contains('open')) return;
      if (event.key === 'Escape') {event.preventDefault(); close();}
      if (event.key === 'Tab') {
        const nodes = [...filterPanel.querySelectorAll('button,input,select,a[href]')].filter(node => !node.disabled && node.getClientRects().length);
        const first = nodes[0], last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
      }
    });
    document.addEventListener('change', event => {
      if (mobile.matches && filterPanel.classList.contains('open') && !filterPanel.contains(document.activeElement)) (document.getElementById(event.target.id) || filterPanel.querySelector('button'))?.focus();
    });
    mobile.addEventListener('change', () => {if (!mobile.matches) close(false);});
    window.addEventListener('languagechange', syncDrawer);
  }

  const backTop = document.createElement('button');
  backTop.type = 'button'; backTop.className = 'back-top'; backTop.hidden = true;
  backTop.dataset.i18nAria = 'backTop'; backTop.setAttribute('aria-label', U.t('backTop'));
  backTop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 14 6-6 6 6M6 4h12"/></svg>';
  document.body.append(backTop);
  const updateScroll = () => {backTop.hidden = window.scrollY < 500;};
  window.addEventListener('scroll', updateScroll, {passive:true}); updateScroll();
  backTop.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});
    document.querySelector('.brand')?.focus({preventScroll:true});
  });
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('section-visible'); observer.unobserve(entry.target);}
    }), {threshold:0.05});
    document.querySelectorAll('.platform-section').forEach(section => {section.classList.add('section-enter'); observer.observe(section);});
    reduced.addEventListener('change', event => {if (event.matches) {observer.disconnect(); document.querySelectorAll('.section-enter').forEach(section=>section.classList.add('section-visible'));}});
  }
})();
