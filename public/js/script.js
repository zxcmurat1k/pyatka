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
    { name: 'Скины и модели', slug: 'skins', icon: '🎨' },
    { name: 'Технические и механизмы', slug: 'mechanisms', icon: '⚙️' },
    { name: 'Интерфейс (HUD)', slug: 'ui-hud', icon: '🖥️' },
    { name: 'Оптимизация и фиксы', slug: 'optimization', icon: '🔧' }
  ];

  function openDrawer(gameName) {
    if (!drawer || !drawerOverlay) return;

    const encoded = encodeURIComponent(gameName);

    if (drawerTitle) drawerTitle.textContent = gameName;
    if (drawerCta) {
      drawerCta.href = '/catalog?game=' + encoded;
      drawerCta.textContent = '🎮 Смотреть все моды игры';
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
});
