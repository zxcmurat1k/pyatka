/* ============================================================
   HornyHo — Client-Side Logic
   Theme toggle, Drawer, Age Gate 18+, Form Validation, Scroll-to-top
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
    // Снимаем блюр со всех 18+ превью
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
    // Если переход был заблокирован — перенаправляем
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
    if (window.history.length > 1) {
      history.back();
    } else {
      window.location.href = '/';
    }
  }

  // Делаем доступными глобально для кнопок в модалке
  window.confirmAge = confirmAge;
  window.denyAge = denyAge;
  window.showAgeGate = showAgeGate;

  // Если открыта NSFW-страница без подтвержденного возраста
  if ((isNsfwPage || modIsNsfw) && !isAgeVerified()) {
    showAgeGate();
  }

  // Если возраст уже подтверждён — снимаем блюр сразу
  if (isAgeVerified()) {
    document.querySelectorAll('.nsfw-blur').forEach(el => {
      el.classList.remove('nsfw-blur');
    });
  }

  // Перехват кликов по ссылкам на 18+ контент
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

  // Категории модов по ТЗ
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

    // Рендерим категории для выбранной игры
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

    // Неоново-малиновая кнопка 18+ Контент внизу
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

  // ESC закрывает drawer и modal
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
