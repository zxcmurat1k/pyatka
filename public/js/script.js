/* ============================================================
   HornyHo — Client-Side Logic
   Theme toggle, Drawer, Age Gate, Validation, Scroll-to-top
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ============ 1. THEME TOGGLE (localStorage) ============ */
  const themeBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  /* ============ 2. MOBILE MENU TOGGLE ============ */
  const menuToggle = document.getElementById('menuToggle');
  const navMain = document.getElementById('navMain');

  if (menuToggle && navMain) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMain.classList.toggle('mobile-open');
    });
    // Close on nav link click
    navMain.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMain.classList.remove('mobile-open');
      });
    });
  }

  /* ============ 3. NSFW THEME DETECTION ============ */
  const urlParams = new URLSearchParams(window.location.search);
  const isNsfwPage = urlParams.get('nsfw') === '1';
  const modIsNsfw = document.body.dataset.modNsfw === '1';

  if (isNsfwPage || modIsNsfw) {
    document.body.classList.add('theme-nsfw');
  }

  /* ============ 4. AGE GATE MODAL ============ */
  const ageModal = document.getElementById('ageModal');
  const ageVerified = localStorage.getItem('ageVerified') === 'true';

  function showAgeGate() {
    if (ageModal && !ageVerified) {
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
    // Remove blur from NSFW images
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
  }

  function denyAge() {
    history.back();
  }

  // Expose to HTML onclick
  window.confirmAge = confirmAge;
  window.denyAge = denyAge;

  // Show age gate on NSFW pages
  if ((isNsfwPage || modIsNsfw) && !ageVerified) {
    showAgeGate();
  }

  // If age already verified, remove blurs
  if (ageVerified) {
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
  }

  /* ============ 5. GAME CARD DRAWER ============ */
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('gameDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerCta = document.getElementById('drawerCta');
  const drawerCats = document.getElementById('drawerCats');
  const drawerNsfwBtn = document.getElementById('drawerNsfwBtn');
  const drawerClose = document.getElementById('drawerClose');

  // Category definitions per game
  const gameCategories = [
    { name: 'Скины и модели', slug: 'skins', icon: '🎨' },
    { name: 'Графика и текстуры', slug: 'graphics', icon: '✨' },
    { name: 'Геймплей и механики', slug: 'gameplay', icon: '⚙️' },
    { name: 'Интерфейс (HUD)', slug: 'ui-hud', icon: '🖥️' },
    { name: 'Оптимизация и фиксы', slug: 'optimization', icon: '🔧' },
    { name: 'Квесты и локации', slug: 'quests', icon: '🗺️' }
  ];

  function openDrawer(gameName) {
    if (!drawer || !drawerOverlay) return;

    const encoded = encodeURIComponent(gameName);

    drawerTitle.textContent = gameName;
    drawerCta.href = '/catalog?game=' + encoded;
    drawerCta.textContent = '🎮 Смотреть все моды игры';

    // Build category links
    drawerCats.innerHTML = '';
    gameCategories.forEach(cat => {
      const a = document.createElement('a');
      a.href = '/catalog?game=' + encoded + '&category=' + cat.slug;
      a.className = 'drawer-cat-link';
      a.innerHTML = '<span class="drawer-cat-icon">' + cat.icon + '</span>' + cat.name;
      drawerCats.appendChild(a);
    });

    // NSFW button
    if (drawerNsfwBtn) {
      drawerNsfwBtn.href = '/catalog?game=' + encoded + '&nsfw=1';
      drawerNsfwBtn.onclick = function(e) {
        if (!ageVerified && localStorage.getItem('ageVerified') !== 'true') {
          e.preventDefault();
          showAgeGate();
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

  // Expose for HTML
  window.openDrawer = openDrawer;

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // ESC to close drawer
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
      // Clear old errors
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
          err.textContent = 'Это поле обязательно';
          input.parentNode.appendChild(err);
        }
      });

      // Email validation
      form.querySelectorAll('input[type="email"]').forEach(input => {
        if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          valid = false;
          input.style.borderColor = 'var(--danger)';
          const err = document.createElement('div');
          err.className = 'form-error';
          err.textContent = 'Некорректный email';
          input.parentNode.appendChild(err);
        }
      });

      if (!valid) e.preventDefault();
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
