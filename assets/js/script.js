document.addEventListener('DOMContentLoaded', () => {

  /* 1. HERO TYPING — фиксированный, без бага*/
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

  /* 2. HERO INTRO — anime.js timeline*/
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

  /* 3. SCROLL REVEAL*/
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

  /* 4. SKILLS PANEL — "рендер" + "пепел" + типинг*/
  const techItems   = document.querySelectorAll('.tech-item');
  const techImg     = document.getElementById('techImg');
  const techDesc    = document.getElementById('techDesc');
  const ashCanvas   = document.getElementById('ashCanvas');
  const ashCtx      = ashCanvas.getContext('2d');

  let descTimer     = null;
  let currentActive = techItems[0];
  let isSwitching   = false;

  //Утилита: печать текста символ за символом
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


  function ashDissolve(img, onDone) {
    cancelAnimationFrame(ashDissolve._raf);

    const wrap = img.parentElement;
    const W = wrap.clientWidth  || 300;
    const H = wrap.clientHeight || 160;
    ashCanvas.width  = W;
    ashCanvas.height = H;
    ashCtx.clearRect(0, 0, W, H);

    // Показываю canvas, скрываю исходную картинку
    ashCanvas.style.transition = 'opacity 0.08s ease';
    ashCanvas.style.opacity = '1';
    img.style.clipPath = 'inset(100% 0 0 0)';

    // Генерирую частицы в области, где была видна картинка
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
        delay: Math.random() * 150
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
        const eased = t * t;
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
        if (onDone) onDone();
      }
    }
    ashDissolve._raf = requestAnimationFrame(draw);

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
      img.style.transition = 'none';
      img.style.clipPath = 'inset(100% 0 0 0)';

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
      if (onDone) onDone();
    };

    img.src = src;
  }

  //Переключение панели при клике
  function switchTech(item) {
    if (item === currentActive || isSwitching) return;
    isSwitching = true;

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
          // Печатает текст с небольшой задержкой после рендера картинки
          setTimeout(() => {
            typeText(techDesc, newText, 28, finish);
          }, 200);
        });
      });
    } catch (e) {
      console.error('switchTech error:', e);
      techImg.style.clipPath = 'inset(0% 0 0 0)';
      techImg.src = newSrc;
      typeText(techDesc, newText, 28, finish);
    }
  }

  techItems.forEach(item => {
    item.addEventListener('click', () => switchTech(item));
  });

  renderIn(techImg, currentActive.dataset.img, () => {
    setTimeout(() => typeText(techDesc, currentActive.dataset.text, 28), 200);
  });

  /* 5. THEME TOGGLE — anime.js вращение иконки*/
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
/* ═══ GIT TERMINAL ═══ */
  const termInput  = document.getElementById('termInput');
  const termOutput = document.getElementById('termOutput');
  const termBody   = document.getElementById('termBody');

  if (termInput) {
    termBody.addEventListener('click', () => termInput.focus());

    const cmdHistory = [];
    let histIdx = -1;

    const GIT_COMMANDS = {
      'git log': `<span class="c-yellow">commit a3f91bc</span> <span class="c-gray">(HEAD -> main, origin/main)</span>
<span class="c-white">Author: Murat Izbasarov &lt;murat@devshowcase.ru&gt;</span>
<span class="c-white">Date:   Sat Jun 21 14:32:11 2026 +0500</span>

    <span class="c-white">feat: add contact form with Formspree integration</span>

<span class="c-yellow">commit 7d2e4a1</span>
<span class="c-white">Author: Roman Shangareev &lt;roman@devshowcase.ru&gt;</span>
<span class="c-white">Date:   Fri Jun 20 18:15:44 2026 +0500</span>

    <span class="c-white">style: redesign skills section with ash dissolve animation</span>

<span class="c-yellow">commit 1bc88f0</span>
<span class="c-white">Author: Murat Izbasarov &lt;murat@devshowcase.ru&gt;</span>
<span class="c-white">Date:   Thu Jun 19 11:04:29 2026 +0500</span>

    <span class="c-white">feat: add collapsible sidebar with theme toggle</span>`,

      'git status': `<span class="c-white">On branch </span><span class="c-green">main</span>
<span class="c-white">Your branch is up to date with </span><span class="c-blue">'origin/main'</span>

<span class="c-white">Changes not staged for commit:</span>
	<span class="c-red">modified:   assets/css/style.css</span>
	<span class="c-red">modified:   assets/js/script.js</span>

<span class="c-white">Untracked files:</span>
	<span class="c-red">assets/img/</span>`,

      'git branch': `<span class="c-green">* main</span>
<span class="c-white">  feature/animations</span>
<span class="c-white">  feature/contact-form</span>
<span class="c-white">  hotfix/sidebar-mobile</span>`,

      'git branch -a': `<span class="c-green">* main</span>
<span class="c-white">  feature/animations</span>
<span class="c-white">  feature/contact-form</span>
<span class="c-red">  remotes/origin/HEAD</span> <span class="c-gray">-> origin/main</span>
<span class="c-red">  remotes/origin/main</span>`,

      'git diff': `<span class="c-yellow">diff --git a/assets/css/style.css b/assets/css/style.css</span>
<span class="c-white">--- a/assets/css/style.css</span>
<span class="c-white">+++ b/assets/css/style.css</span>
<span class="c-blue">@@ -142,6 +142,18 @@</span>
<span class="c-green">+.terminal-wrap {</span>
<span class="c-green">+  max-width: 780px;</span>
<span class="c-green">+  border-radius: 14px;</span>
<span class="c-green">+}</span>`,

      'git stash': `<span class="c-white">Saved working directory and index state</span>
<span class="c-white">WIP on main: </span><span class="c-yellow">a3f91bc</span> <span class="c-white">feat: add contact form</span>`,

      'git stash list': `<span class="c-yellow">stash@{0}</span><span class="c-white">: WIP on main: a3f91bc feat: add contact form</span>
<span class="c-yellow">stash@{1}</span><span class="c-white">: WIP on feature/animations: 7d2e4a1 redesign skills section</span>`,

      'git help': `<span class="c-white">Доступные команды:</span>

  <span class="c-green">git log</span>         <span class="c-gray">— история коммитов</span>
  <span class="c-green">git status</span>      <span class="c-gray">— состояние рабочей директории</span>
  <span class="c-green">git branch</span>      <span class="c-gray">— список веток</span>
  <span class="c-green">git branch -a</span>   <span class="c-gray">— все ветки включая удалённые</span>
  <span class="c-green">git diff</span>        <span class="c-gray">— незакоммиченные изменения</span>
  <span class="c-green">git stash</span>       <span class="c-gray">— сохранить изменения в стэш</span>
  <span class="c-green">git stash list</span>  <span class="c-gray">— список стэшей</span>
  <span class="c-green">clear</span>           <span class="c-gray">— очистить терминал</span>`,

      'clear': '__CLEAR__',
    };

    const PROMPT = 'riba@devshowcase <span class="term-path">~/project</span> <span class="term-branch">(main)</span> $';

    function addLine(cmd, outputHtml) {
      const cmdLine = document.createElement('div');
      cmdLine.className = 'term-line';
      cmdLine.innerHTML = PROMPT + ' <span class="c-white">' + cmd + '</span>';
      termOutput.appendChild(cmdLine);
      if (outputHtml) {
        const out = document.createElement('div');
        out.className = 'term-output-block';
        out.innerHTML = outputHtml;
        termOutput.appendChild(out);
        anime({ targets: out, opacity: [0, 1], translateY: [4, 0], duration: 250, easing: 'easeOutQuad' });
      }
      termBody.scrollTop = termBody.scrollHeight;
    }

    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim();
        termInput.value = '';
        histIdx = -1;
        if (!cmd) return;
        cmdHistory.unshift(cmd);
        if (cmd === 'clear') { termOutput.innerHTML = ''; return; }
        const output = GIT_COMMANDS[cmd];
        if (output) {
          addLine(cmd, output);
        } else {
          addLine(cmd, '<span class="c-red">zsh: command not found: ' + cmd + '</span>\n<span class="c-gray">Введи <span class="c-green">git help</span> для списка команд</span>');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx < cmdHistory.length - 1) termInput.value = cmdHistory[++histIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        histIdx > 0 ? termInput.value = cmdHistory[--histIdx] : (histIdx = -1, termInput.value = '');
      }
    });
  }