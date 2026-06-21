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

  let descTimer     = null;   // таймер печати описания
  let currentActive = techItems[0]; // активный элемент при загрузке

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

  // ─── Эффект "пепел" — рассыпаем пиксели ───────────────────────
  function ashDissolve(img, onDone) {
    const wrap = img.parentElement;
    const W = wrap.clientWidth  || 300;
    const H = wrap.clientHeight || 160;
    ashCanvas.width  = W;
    ashCanvas.height = H;

    // Рисуем текущее изображение на canvas
    ashCtx.clearRect(0, 0, W, H);
    const iw = img.naturalWidth  || img.width  || 120;
    const ih = img.naturalHeight || img.height || 120;
    const scale = Math.min(W / iw, H / ih) * 0.75;
    const dx = (W - iw * scale) / 2;
    const dy = (H - ih * scale) / 2;
    ashCtx.drawImage(img, dx, dy, iw * scale, ih * scale);

    // Показываем canvas, скрываем img
    anime({ targets: ashCanvas, opacity: [0, 1], duration: 80 });
    img.style.clipPath = 'inset(100% 0 0 0)'; // убираем img

    // Собираем частицы пикселей из canvas
    const imageData = ashCtx.getImageData(0, 0, W, H);
    const pixels = [];
    const STEP = 4; // каждый 4й пиксель = менее нагрузки
    for (let y = 0; y < H; y += STEP) {
      for (let x = 0; x < W; x += STEP) {
        const idx = (y * W + x) * 4;
        const a = imageData.data[idx + 3];
        if (a > 30) {
          pixels.push({ x, y,
            r: imageData.data[idx],
            g: imageData.data[idx+1],
            b: imageData.data[idx+2]
          });
        }
      }
    }

    // Анимируем рассыпание через anime.js (каждая частица — объект)
    const objs = pixels.map(p => ({ px: p.x, py: p.y, alpha: 1 }));
    let rafId;

    function draw() {
      ashCtx.clearRect(0, 0, W, H);
      objs.forEach((o, i) => {
        const p = pixels[i];
        ashCtx.globalAlpha = o.alpha;
        ashCtx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ashCtx.fillRect(o.px, o.py, STEP, STEP);
      });
      ashCtx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    anime({
      targets: objs,
      px: (el, i) => pixels[i].x + (Math.random() - 0.5) * 80,
      py: (el, i) => pixels[i].y + Math.random() * 60 + 10,
      alpha: 0,
      delay: anime.stagger(1, { from: 'random' }),
      duration: 600,
      easing: 'easeInQuad',
      complete: () => {
        cancelAnimationFrame(rafId);
        anime({ targets: ashCanvas, opacity: 0, duration: 150, complete: onDone });
      }
    });
  }

  // ─── Эффект "рендер" — появление изображения построчно ─────────
  function renderIn(img, src) {
    img.src = src;
    img.onload = () => {
      // Сброс clipPath и анимируем "сканлайн" сверху вниз
      img.style.clipPath = 'inset(100% 0 0 0)';
      anime({
        targets: img,
        // Используем кастомное свойство через update
        duration: 700,
        easing: 'easeInOutQuad',
        update: (anim) => {
          const pct = Math.round(100 - anim.progress);
          img.style.clipPath = `inset(${pct}% 0 0 0)`;
        }
      });
    };
  }

  // ─── Переключение панели при наведении ─────────────────────────
  function switchTech(item) {
    if (item === currentActive) return;
    currentActive.classList.remove('active');
    item.classList.add('active');
    currentActive = item;

    const newSrc  = item.dataset.img;
    const newText = item.dataset.text;

    // Остановить текущий типинг
    clearTimeout(descTimer);
    techDesc.textContent = '';

    // Рассыпать старую картинку, затем отрендерить новую
    ashDissolve(techImg, () => {
      renderIn(techImg, newSrc);
      // Печатаем текст с небольшой задержкой
      setTimeout(() => typeText(techDesc, newText, 28), 300);
    });
  }

  techItems.forEach(item => {
    item.addEventListener('mouseenter', () => switchTech(item));
  });

  // Инициализация: рендерим первую картинку и начинаем печатать
  renderIn(techImg, currentActive.dataset.img);
  setTimeout(() => typeText(techDesc, currentActive.dataset.text, 28), 500);

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
