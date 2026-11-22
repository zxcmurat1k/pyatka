/* ============================================================
   HornyHo — Client-Side Logic
   Theme Mode (SFW / 18+), Collapsible Sidebar, Age Gate, Drawer, Validation
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ============ 1. THEME MODE TOGGLE (SFW / 18+) ============ */
  function getStoredMode() {
    return localStorage.getItem('hornyho_nsfw_mode') || 'sfw';
  }

  function applyMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('hornyho_nsfw_mode', mode);

    // Sync theme-nsfw class on body for styles relying on it
    if (mode === 'nsfw') {
      document.body.classList.add('theme-nsfw');
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const isNsfwPage = urlParams.get('nsfw') === '1';
      const modIsNsfw = document.body.dataset.modNsfw === '1';
      if (!isNsfwPage && !modIsNsfw) {
        document.body.classList.remove('theme-nsfw');
      }
    }

    // Lock dark theme when 18+ mode is active (BUG-021)
    const tBtn = document.getElementById("themeModeToggle");
    const tLbl = document.getElementById("themeToggleLabel");
    if (mode === "nsfw") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (tBtn) {
        tBtn.disabled = true;
        tBtn.title = "В режиме 18+ зафиксирована тёмная тема";
      }
      if (tLbl) tLbl.textContent = "Тёмная (18+)";
    } else {
      const savedTheme = localStorage.getItem("hornyho_theme") || "dark";
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (tBtn) {
        tBtn.disabled = false;
        tBtn.title = "";
      }
      if (tLbl) tLbl.textContent = savedTheme === "light" ? "Тёмная тема" : "Светлая тема";
    }

    // Update toggle switch indicator UI
    const toggleBtns = document.querySelectorAll('.sidebar-nsfw-toggle, #nsfwModeToggle');
    toggleBtns.forEach(btn => {
      if (mode === 'nsfw') {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Custom event dispatch as requested by specification
    window.dispatchEvent(new CustomEvent('hornyho:modechange', { detail: { mode } }));
  }

  // Initialize mode
  const initialMode = getStoredMode();
  applyMode(initialMode);

  // Bind click listener to 18+ toggle buttons
  document.querySelectorAll('.sidebar-nsfw-toggle, #nsfwModeToggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = document.documentElement.getAttribute('data-mode') || 'sfw';
      const nextMode = current === 'nsfw' ? 'sfw' : 'nsfw';

      if (nextMode === 'nsfw' && localStorage.getItem('ageVerified') !== 'true') {
        if (typeof showAgeGate === 'function') {
          showAgeGate();
        }
      }

      applyMode(nextMode);
    });
  });

  /* ============ 2. MOBILE SIDEBAR BURGER TOGGLE ============ */
  const menuToggle = document.getElementById('menuToggle');
  const siteSidebar = document.getElementById('siteSidebar');

  if (menuToggle && siteSidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      siteSidebar.classList.toggle('mobile-open');
    });

    // Close mobile sidebar on navigation link click
    siteSidebar.querySelectorAll('.sidebar-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        siteSidebar.classList.remove('mobile-open');
      });
    });

    // Close when clicking outside of mobile open sidebar
    document.addEventListener('click', (e) => {
      if (siteSidebar.classList.contains('mobile-open') && !siteSidebar.contains(e.target)) {
        siteSidebar.classList.remove('mobile-open');
      }
    });
  }

  /* ============ 3. NSFW THEME DETECTION FROM URL / DATA ============ */
  const urlParams = new URLSearchParams(window.location.search);
  const isNsfwPage = urlParams.get('nsfw') === '1';
  const modIsNsfw = document.body.dataset.modNsfw === '1';

  if (isNsfwPage || modIsNsfw) {
    applyMode('nsfw');
  }

  /* ============ 4. AGE GATE MODAL ============ */
  const ageModal = document.getElementById('ageModal');
  let pendingNsfwUrl = null;

  function isAgeVerified() {
    return localStorage.getItem('ageVerified') === 'true';
  }

  function showAgeGate(targetUrl = null) {
    if (ageModal) {
      pendingNsfwUrl = targetUrl;
      ageModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function confirmAge() {
    localStorage.setItem('ageVerified', 'true');
    if (ageModal) {
      ageModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    // Remove blur from all NSFW previews
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
    // Redirect if a blocked navigation URL was stored
    if (pendingNsfwUrl) {
      const url = pendingNsfwUrl;
      pendingNsfwUrl = null;
      window.location.href = url;
    }
  }

  function denyAge() {
    if (ageModal) {
      ageModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    pendingNsfwUrl = null;
    applyMode('sfw');
    if (window.history.length > 1) {
      history.back();
    } else {
      window.location.href = '/';
    }
  }

  window.confirmAge = confirmAge;
  window.denyAge = denyAge;
  window.showAgeGate = showAgeGate;

  // Show age gate if on NSFW page without verified age
  if ((isNsfwPage || modIsNsfw) && !isAgeVerified()) {
    showAgeGate();
  }

  // If age already verified, lift blurs immediately
  if (isAgeVerified()) {
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
  }

  // Intercept clicks to 18+ content
  document.addEventListener('click', (e) => {
    // Unblur temporary preview on badge click in SFW mode
    const nsfwBadgeOverlay = e.target.closest('.nsfw-badge-overlay');
    if (nsfwBadgeOverlay) {
      e.preventDefault();
      e.stopPropagation();
      const parentMedia = nsfwBadgeOverlay.closest('.nsfw-media');
      if (parentMedia) {
        parentMedia.classList.toggle('unblurred-temp');
      }
      return;
    }

    const nsfwLink = e.target.closest('a[href*="nsfw=1"], a[href*="nsfw=true"], .js-nsfw-gate');
    if (nsfwLink) {
      if (!isAgeVerified()) {
        e.preventDefault();
        showAgeGate(nsfwLink.href);
      }
    }
  });

  /* ============ 5. GAME CARD DRAWER ============ */
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('gameDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerCta = document.getElementById('drawerCta');
  const drawerCats = document.getElementById('drawerCats');
  const drawerNsfwBtn = document.getElementById('drawerNsfwBtn');
  const drawerClose = document.getElementById('drawerClose');

  const gameCategories = [
    { 
      name: 'Графика и текстуры', 
      slug: 'graphics', 
      icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' 
    },
    { 
      name: 'Геймплей и механики', 
      slug: 'gameplay', 
      icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' 
    },
    { 
      name: 'Интерфейс (HUD)', 
      slug: 'ui-hud', 
      icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>' 
    },
    { 
      name: 'Оптимизация и фиксы', 
      slug: 'optimization', 
      icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' 
    },
    { 
      name: 'Квесты и локации', 
      slug: 'quests', 
      icon: '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>' 
    }
  ];

  function openDrawer(gameName) {
    if (!drawer || !drawerOverlay) return;

    const encoded = encodeURIComponent(gameName);

    if (drawerTitle) drawerTitle.textContent = gameName;
    if (drawerCta) {
      drawerCta.href = '/catalog?game=' + encoded;
      drawerCta.textContent = 'Смотреть все моды игры';
    }

    if (drawerCats) {
      drawerCats.innerHTML = '';
      gameCategories.forEach(cat => {
        const a = document.createElement('a');
        a.href = '/catalog?game=' + encoded + '&category=' + encodeURIComponent(cat.slug);
        a.className = 'drawer-cat-link';
        a.innerHTML = '<span class="drawer-cat-icon">' + cat.icon + '</span><span>' + cat.name + '</span>';
        drawerCats.appendChild(a);
      });
    }

    if (drawerNsfwBtn) {
      const nsfwUrl = '/catalog?game=' + encoded + '&nsfw=1';
      drawerNsfwBtn.href = nsfwUrl;
      drawerNsfwBtn.onclick = function(e) {
        if (!isAgeVerified()) {
          e.preventDefault();
          showAgeGate(nsfwUrl);
        }
      };
    }

    drawerOverlay.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (drawerOverlay) drawerOverlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // ESC to close drawer and modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      if (ageModal && ageModal.classList.contains('active')) {
        denyAge();
      }
    }
  });

  /* ============ 6. SCROLL-TO-TOP BUTTON ============ */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============ 7. FORM VALIDATION ============ */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      let valid = true;
      form.querySelectorAll('.form-error').forEach(el => el.remove());
      form.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        input.style.borderColor = '';
      });

      form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = 'var(--danger)';
          const err = document.createElement('div');
          err.className = 'form-error';
          err.textContent = 'Это поле обязательно для заполнения';
          input.parentNode.appendChild(err);
        }
      });

      form.querySelectorAll('input[type="email"]').forEach(input => {
        if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          valid = false;
          input.style.borderColor = 'var(--danger)';
          const err = document.createElement('div');
          err.className = 'form-error';
          err.textContent = 'Введите корректный адрес электронной почты';
          input.parentNode.appendChild(err);
        }
      });

      if (!valid) {
        e.preventDefault();
        const firstErr = form.querySelector('.form-error');
        if (firstErr) {
          firstErr.previousElementSibling?.focus();
        }
      }
    });
  });

  /* ============ 8. FADE-IN ON SCROLL ============ */
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-fade]').forEach(el => {
    el.style.opacity = '0';
    fadeObserver.observe(el);
  });

  /* ============ 9. TABS ============ */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tabs-container');
      if (!group) return;

      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  /* ============ 10. HERO BANNER SFW / 18+ TEXTS & ACCENTS ============ */
  const heroBadge = document.getElementById('heroBadge');
  const heroTitle = document.getElementById('heroTitle');
  const heroDesc  = document.getElementById('heroDesc');

  const HERO_DATA = {
    sfw: {
      badge: 'HORNYHO • КАТАЛОГ МОДОВ',
      title: 'Меняй мир под себя, а не себя под мир',
      desc: 'Проверенные модификации для любимых игр, сборка модпаков в пару кликов и честные оценки сообщества.'
    },
    nsfw: {
      badge: 'HORNYHO 18+ • БЕЗ ЦЕНЗУРЫ',
      title: 'Снимаем все ограничения. И не только их.',
      desc: 'Режим 18+ активен: откровенные скины, кастомные модели и взрослые сборки без цензуры и блюра.'
    }
  };

  function updateHeroTexts(mode) {
    const data = HERO_DATA[mode] || HERO_DATA.sfw;
    if (heroBadge) heroBadge.textContent = data.badge;
    if (heroTitle) heroTitle.textContent = data.title;
    if (heroDesc)  heroDesc.textContent  = data.desc;
  }

  // Initial update
  updateHeroTexts(document.documentElement.getAttribute('data-mode') || 'sfw');

  // Listen to mode changes without page reload
  window.addEventListener('hornyho:modechange', (e) => {
    const nextMode = e.detail && e.detail.mode ? e.detail.mode : 'sfw';
    updateHeroTexts(nextMode);
  });

  /* ============ 11. SKEWED GAMES CAROUSEL (DRAG-TO-SCROLL & ARROWS) ============ */
  const skewTrack = document.getElementById('skewTrack');
  const carouselPrev = document.getElementById('carouselPrev');
  const carouselNext = document.getElementById('carouselNext');

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let dragDisplacement = 0;
  const DRAG_THRESHOLD = 8; // Порог смещения в px

  if (skewTrack) {
    // Arrow navigation: scroll by ~2 cards width (240px + 28px gap = 268px * 2 = 536px)
    if (carouselPrev) {
      carouselPrev.addEventListener('click', () => {
        closeGamePopover();
        skewTrack.scrollBy({ left: -540, behavior: 'smooth' });
      });
    }
    if (carouselNext) {
      carouselNext.addEventListener('click', () => {
        closeGamePopover();
        skewTrack.scrollBy({ left: 540, behavior: 'smooth' });
      });
    }

    // Mouse drag-to-scroll on LMB
    skewTrack.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      dragDisplacement = 0;
      startX = e.pageX - skewTrack.offsetLeft;
      scrollLeft = skewTrack.scrollLeft;
      skewTrack.classList.add('grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !skewTrack) return;
      e.preventDefault();
      const x = e.pageX - skewTrack.offsetLeft;
      const walk = (x - startX) * 1.4;
      dragDisplacement = Math.abs(x - startX);
      skewTrack.scrollLeft = scrollLeft - walk;

      if (dragDisplacement > DRAG_THRESHOLD) {
        closeGamePopover();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (skewTrack) skewTrack.classList.remove('grabbing');
      }
    });

    skewTrack.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        skewTrack.classList.remove('grabbing');
      }
    });
  }

  /* ============ 12. GAME SUB-CATEGORIES POPOVER ============ */
  const gamePopover = document.getElementById('gamePopover');
  const popoverTitle = document.getElementById('popoverTitle');
  const popoverClose = document.getElementById('popoverClose');
  const popoverAllMods = document.getElementById('popoverAllMods');
  const popoverNsfwLink = document.getElementById('popoverNsfwLink');
  let activeCard = null;

  function openGamePopover(card, gameTitle) {
    if (!gamePopover || !card) return;

    if (activeCard) activeCard.classList.remove('active-selected');
    activeCard = card;
    card.classList.add('active-selected');

    const encodedGame = encodeURIComponent(gameTitle);

    if (popoverTitle) popoverTitle.textContent = gameTitle;
    if (popoverAllMods) {
      popoverAllMods.href = `/catalog?game=${encodedGame}`;
    }
    if (popoverNsfwLink) {
      popoverNsfwLink.href = `/catalog?game=${encodedGame}&nsfw=1`;
    }

    // Update real slugs in categories list
    const catLinks = gamePopover.querySelectorAll('.game-popover-cat');
    catLinks.forEach(link => {
      const slug = link.dataset.slug;
      if (slug) {
        link.href = `/catalog?game=${encodedGame}&category=${encodeURIComponent(slug)}`;
      }
    });

    // Smart Positioning based on getBoundingClientRect()
    gamePopover.classList.add('active');
    gamePopover.setAttribute('aria-hidden', 'false');

    if (window.innerWidth <= 768) {
      gamePopover.style.left = '';
      gamePopover.style.top = '';
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const popoverWidth = 290;
    const windowWidth = window.innerWidth;
    const spaceRight = windowWidth - cardRect.right;

    let leftPos, topPos;
    if (spaceRight >= popoverWidth + 24) {
      // Plenty of space on right
      leftPos = cardRect.right + 12 + window.scrollX;
    } else {
      // Flip to left of card
      leftPos = cardRect.left - popoverWidth - 12 + window.scrollX;
    }

    topPos = cardRect.top + window.scrollY;
    if (topPos < window.scrollY + 10) topPos = window.scrollY + 10;

    gamePopover.style.left = `${Math.max(10, leftPos)}px`;
    gamePopover.style.top = `${topPos}px`;
  }

  function closeGamePopover() {
    if (gamePopover && gamePopover.classList.contains('active')) {
      gamePopover.classList.remove('active');
      gamePopover.setAttribute('aria-hidden', 'true');
    }
    if (activeCard) {
      activeCard.classList.remove('active-selected');
      activeCard = null;
    }
  }

  // Card click with drag threshold check
  document.querySelectorAll('.skew-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (dragDisplacement > DRAG_THRESHOLD) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      const gameTitle = card.dataset.game;
      if (gamePopover && gamePopover.classList.contains('active') && activeCard === card) {
        closeGamePopover();
      } else {
        openGamePopover(card, gameTitle);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGamePopover(card, card.dataset.game);
      }
    });
  });

  if (popoverClose) {
    popoverClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeGamePopover();
    });
  }

  document.addEventListener('click', (e) => {
    if (gamePopover && gamePopover.classList.contains('active')) {
      if (!gamePopover.contains(e.target) && !e.target.closest('.skew-card')) {
        closeGamePopover();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeGamePopover();
    }
  });

  window.addEventListener('resize', () => {
    if (gamePopover && gamePopover.classList.contains('active') && activeCard) {
      openGamePopover(activeCard, activeCard.dataset.game);
    }
  }, { passive: true });
});


  /* ============ 13. SIDEBAR HOVER PERSISTENCE, LIGHT THEME & CATALOG 18+ GATE ============ */
  const sidebarEl = document.getElementById("siteSidebar");
  if (sidebarEl) {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("sidebar-no-trans");
    });
    sidebarEl.addEventListener("mouseenter", () => {
      sessionStorage.setItem("hornyho_sidebar_hover", "1");
      document.documentElement.classList.add("sidebar-pinned-open");
    });
    sidebarEl.addEventListener("mouseleave", () => {
      sessionStorage.setItem("hornyho_sidebar_hover", "0");
      document.documentElement.classList.remove("sidebar-pinned-open");
    });
  }

  // BUG-012: Light / Dark Theme Toggle
  const themeBtn = document.getElementById("themeModeToggle");
  const themeLabel = document.getElementById("themeToggleLabel");
  function syncThemeLabel(t) {
    if (themeLabel) themeLabel.textContent = t === "light" ? "Тёмная тема" : "Светлая тема";
  }
  syncThemeLabel(document.documentElement.getAttribute("data-theme") || "dark");
  if (themeBtn) {
    themeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (document.documentElement.getAttribute("data-mode") === "nsfw") return;
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("hornyho_theme", next);
      syncThemeLabel(next);
    });
  }

  // BUG-015: Age Gate when activating 18+ filter checkbox in Catalog
  const catNsfwBox = document.getElementById("catalogNsfwCheckbox");
  const filterForm = document.getElementById("filterForm");
  let pendingCatalogSubmit = false;
  if (catNsfwBox && filterForm) {
    catNsfwBox.addEventListener("change", () => {
      if (catNsfwBox.checked && localStorage.getItem("ageVerified") !== "true") {
        pendingCatalogSubmit = true;
        if (typeof showAgeGate === "function") showAgeGate();
        return;
      }
      filterForm.submit();
    });
    const origConfirm = window.confirmAge;
    window.confirmAge = function() {
      if (typeof origConfirm === "function") origConfirm();
      if (pendingCatalogSubmit) {
        pendingCatalogSubmit = false;
        filterForm.submit();
      }
    };
    const origDeny = window.denyAge;
    window.denyAge = function() {
      if (pendingCatalogSubmit) {
        pendingCatalogSubmit = false;
        catNsfwBox.checked = false;
        if (ageModal) {
          ageModal.classList.remove("active");
          document.body.style.overflow = "";
        }
        return;
      }
      if (typeof origDeny === "function") origDeny();
    };
  }
