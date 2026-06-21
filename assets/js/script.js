document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════
     1. HERO TYPING — фиксированный, без бага
  ══════════════════════════════════════════════════ */
  const phrases = ['HTML & CSS', 'JavaScript', 'Node.js', 'Git & GitHub'];
  let pi = 0, ci = 0, isDeleting = false, typingTimer = null;
  const typingEl = document.getElementById('typing');

  function runTyping() {
    const word = phrases[pi];
    if (isDeleting) {
      ci--;
      typingEl.textContent = word.slice(0, ci);
      if (ci <= 0) {
        isDeleting = false;
        pi = (pi + 1) % phrases.length;
        typingTimer = setTimeout(runTyping, 300);
        return;
      }
      typingTimer = setTimeout(runTyping, 55);
    } else {
      ci++;
      typingEl.textContent = word.slice(0, ci);
      if (ci >= word.length) {
        isDeleting = true;
        typingTimer = setTimeout(runTyping, 1400);
        return;
      }
      typingTimer = setTimeout(runTyping, 100);
    }
  }

  // Запускаем только ПОСЛЕ hero-анимации чтобы не было flash
  setTimeout(runTyping, 1600);

  /* ══════════════════════════════════════════════════
     2. HERO INTRO — anime.js timeline
  ══════════════════════════════════════════════════ */
  anime.timeline({ easing: 'easeOutExpo' })
    .add({ targets: '.badge',    scale: [0, 1], duration: 650, easing: 'easeOutBack' })
    .add({ targets: '#hero h1',  translateY: [-40, 0], opacity: [0, 1], duration: 850 }, '-=350')
    .add({ targets: '.hero-sub', translateY: [15, 0],  opacity: [0, 1], duration: 650 }, '-=500')
    .add({ targets: '.typing-wrap', opacity: [0, 1], duration: 400 }, '-=300')
    .add({ targets: '.btn', scale: [0.8, 1], opacity: [0, 1], delay: anime.stagger(120), duration: 550 }, '-=200');

  anime({
    targets: '#sidebar',
    translateX: [-80, 0], opacity: [0, 1],
    duration: 900, easing: 'easeOutExpo'
  });

  /* ══════════════════════════════════════════════════
     3. SCROLL REVEAL
  ══════════════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({ targets: entry.target, opacity: [0, 1], translateY: [40, 0], duration: 700, easing: 'easeOutCubic' });
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.section').forEach(s => {
    s.style.opacity = 0;
    revealObserver.observe(s);
  });

  /* ══════════════════════════════════════════════════
     4. SKILLS PANEL — "рендер" + "пепел" + типинг
  ══════════════════════════════════════════════════ */
  const techItems   = document.querySelectorAll('.tech-item');
  const techImg     = document.getElementById('techImg');
  const techDesc    = document.getElementById('techDesc');
  const ashCanvas   = document.getElementById('ashCanvas');
  const ashCtx      = ashCanvas.getContext('2d');

  let descTimer     = null;    // таймер печати описания
  let currentActive = techItems[0]; // активный элемент при загрузке
  let isSwitching   = false;   // блокировка повторного запуска анимации

  // ─── Утилита: печать текста символ за символом ─────────────────
  function typeText(el, text, speed, onDone) {
    clearTimeout(descTimer);
    el.textContent = '';
    let i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        descTimer = setTimeout(tick, speed);
      } else if (onDone) onDone();
    }
    tick();
  }

  // ─── Эффект "пепел" — частицы разлетаются от центра картинки ───
  // ВАЖНО: анимация частиц реализована на чистом requestAnimationFrame
  // с собственным отслеживанием времени (performance.now()), БЕЗ anime.js.
  // Раньше использовался anime() для прогресса частиц — но если вкладка
  // на момент анимации теряла фокус (например, при переключении в
  // DevTools), anime.js мог не вызывать complete() вовремя, что
  // приводило к зависанию всей цепочки переключения. Самодостаточный
  // rAF-цикл с проверкой elapsed-времени гарантированно завершится.
  function ashDissolve(img, onDone) {
    cancelAnimationFrame(ashDissolve._raf);

    const wrap = img.parentElement;
    const W = wrap.clientWidth  || 300;
    const H = wrap.clientHeight || 160;
    ashCanvas.width  = W;
    ashCanvas.height = H;
    ashCtx.clearRect(0, 0, W, H);

    // Показываем canvas, скрываем исходную картинку
    ashCanvas.style.transition = 'opacity 0.08s ease';
    ashCanvas.style.opacity = '1';
    img.style.clipPath = 'inset(100% 0 0 0)';

    // Генерируем частицы в области, где была видна картинка
    const cx = W / 2, cy = H / 2;
    const PARTICLE_COUNT = 70;
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#38bdf8';

    const pixels = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pixels.push({
        x: cx + (Math.random() - 0.5) * (W * 0.6),
        y: cy + (Math.random() - 0.5) * (H * 0.6),
        dx: (Math.random() - 0.5) * 80,
        dy: Math.random() * 60 + 10,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 150 // мс, для лёгкого разброса старта
      });
    }

    const DURATION = 450; // мс
    const start = performance.now();
    let finished = false;

    function draw(now) {
      const elapsed = now - start;
      ashCtx.clearRect(0, 0, W, H);
      ashCtx.fillStyle = accentColor;

      pixels.forEach(p => {
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / DURATION));
        const eased = t * t; // easeInQuad
        const px = p.x + p.dx * eased;
        const py = p.y + p.dy * eased;
        const alpha = 1 - eased;
        if (alpha > 0) {
          ashCtx.globalAlpha = alpha;
          ashCtx.fillRect(px, py, p.size, p.size);
        }
      });
      ashCtx.globalAlpha = 1;

      if (elapsed < DURATION + 150 && !finished) {
        ashDissolve._raf = requestAnimationFrame(draw);
      } else if (!finished) {
        finished = true;
        ashCanvas.style.opacity = '0';
        // onDone вызываем сразу — не ждём CSS-transition,
        // чтобы не зависеть ещё от одного асинхронного события
        if (onDone) onDone();
      }
    }
    ashDissolve._raf = requestAnimationFrame(draw);

    // Абсолютная страховка: даже если rAF почему-то не идёт
    // (вкладка свёрнута/не в фокусе), завершаем через обычный таймер.
    setTimeout(() => {
      if (!finished) {
        finished = true;
        cancelAnimationFrame(ashDissolve._raf);
        ashCtx.clearRect(0, 0, W, H);
        ashCanvas.style.opacity = '0';
        if (onDone) onDone();
      }
    }, DURATION + 400);
  }

  // ─── Эффект "рендер" — появление изображения построчно ─────────
  // ВАЖНО: используем CSS transition вместо anime() с update-колбэком —
  // CSS transition управляется самим браузером и завершается надёжно
  // через событие 'transitionend', либо подстраховочный setTimeout,
  // независимо от фокуса вкладки.
  function renderIn(img, src, onDone) {
    let settled = false;
    const fallback = setTimeout(() => {
      if (!settled) {
        settled = true;
        startReveal();
      }
    }, 1500);

    function startReveal() {
      clearTimeout(fallback);
      // Сбрасываем без transition, чтобы сразу скрыть картинку
      img.style.transition = 'none';
      img.style.clipPath = 'inset(100% 0 0 0)';

      // Форсируем reflow, чтобы браузер зафиксировал стартовое состояние
      // перед тем как мы включим transition и поменяем clip-path
      void img.offsetWidth;

      let finished = false;
      function finishReveal() {
        if (finished) return;
        finished = true;
        img.removeEventListener('transitionend', onTransitionEnd);
        clearTimeout(revealFallback);
        if (onDone) onDone();
      }

      function onTransitionEnd(e) {
        if (e.propertyName === 'clip-path') finishReveal();
      }
      img.addEventListener('transitionend', onTransitionEnd);

      img.style.transition = 'clip-path 0.7s ease-in-out';
      img.style.clipPath = 'inset(0% 0 0 0)';

      // Страховка на случай, если transitionend не сработает
      // (например, если значение clip-path не успело реально измениться)
      const revealFallback = setTimeout(finishReveal, 800);
    }

    img.onload = () => {
      if (settled) return;
      settled = true;
      startReveal();
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallback);
      if (onDone) onDone(); // не виснем, если картинка не загрузилась
    };

    img.src = src;
  }

  // ─── Переключение панели при клике ──────────────────────────────
  function switchTech(item) {
    if (item === currentActive || isSwitching) return;
    isSwitching = true;

    // Страховка: что бы ни случилось внутри (ошибка анимации,
    // не загрузившаяся картинка и т.п.) — флаг точно снимется сам,
    // и клики по другим кнопкам не "замрут" навсегда.
    const safetyTimeout = setTimeout(() => { isSwitching = false; }, 3000);

    currentActive.classList.remove('active');
    item.classList.add('active');
    currentActive = item;

    const newSrc  = item.dataset.img;
    const newText = item.dataset.text;

    // Остановить текущий типинг
    clearTimeout(descTimer);
    techDesc.textContent = '';

    function finish() {
      clearTimeout(safetyTimeout);
      isSwitching = false;
    }

    // Рассыпать старую картинку, затем отрендерить новую
    try {
      ashDissolve(techImg, () => {
        renderIn(techImg, newSrc, () => {
          // Печатаем текст с небольшой задержкой после рендера картинки
          setTimeout(() => {
            typeText(techDesc, newText, 28, finish);
          }, 200);
        });
      });
    } catch (e) {
      // Если эффект упал по любой причине — всё равно показываем новый контент
      console.error('switchTech error:', e);
      techImg.style.clipPath = 'inset(0% 0 0 0)';
      techImg.src = newSrc;
      typeText(techDesc, newText, 28, finish);
    }
  }

  // Клик надёжнее hover: не "залипает" при быстром движении мыши
  // и не запускает анимацию повторно, пока мышь просто проезжает мимо.
  techItems.forEach(item => {
    item.addEventListener('click', () => switchTech(item));
  });

  // Инициализация: рендерим первую картинку и начинаем печатать
  renderIn(techImg, currentActive.dataset.img, () => {
    setTimeout(() => typeText(techDesc, currentActive.dataset.text, 28), 200);
  });

  /* ══════════════════════════════════════════════════
     5. THEME TOGGLE — anime.js вращение иконки
  ══════════════════════════════════════════════════ */
  const themeBtn = document.getElementById('themeBtn');
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');

  themeBtn.addEventListener('click', () => {
    const goingLight = !document.body.classList.contains('light');
    const iconEl = themeBtn.querySelector(goingLight ? '.moon' : '.sun');
    anime({ targets: iconEl, rotate: [0, 360], duration: 600, easing: 'easeOutBack' });
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 't' && e.target.tagName !== 'INPUT') themeBtn.click();
  });

});