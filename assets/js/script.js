document.addEventListener('DOMContentLoaded', () => {

  // ── Typing effect ──────────────────────────────────────────────
  const phrases = ['HTML & CSS', 'JavaScript', 'Node.js', 'Git & GitHub'];
  let pi = 0, ci = 0, deleting = false;
  const el = document.getElementById('typing');

  function type() {
    const word = phrases[pi];
    el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
    if (!deleting && ci > word.length)      { deleting = true; setTimeout(type, 1200); return; }
    if (deleting && ci < 0)                 { deleting = false; pi = (pi + 1) % phrases.length; }
    setTimeout(type, deleting ? 60 : 110);
  }
  type();

  // ── Hero intro animations (anime.js) ──────────────────────────
  anime.timeline({ easing: 'easeOutExpo' })
    .add({ targets: '.badge',    scale: [0, 1],            duration: 700, easing: 'easeOutBack' })
    .add({ targets: '#hero h1',  translateY: [-40, 0], opacity: [0, 1], duration: 900 }, '-=400')
    .add({ targets: '.hero-anim',translateY: [20, 0],  opacity: [0, 1], duration: 700 }, '-=600')
    .add({ targets: '.btn',      scale: [0.8, 1],      opacity: [0, 1], delay: anime.stagger(120), duration: 600 }, '-=400');

  // Cards stagger
  anime({
    targets: '.card',
    translateY: [30, 0],
    opacity: [0, 1],
    delay: anime.stagger(80, { start: 400 }),
    duration: 700,
    easing: 'easeOutCubic'
  });

  // Sidebar slide-in
  anime({
    targets: '#sidebar',
    translateX: [-80, 0],
    opacity: [0, 1],
    duration: 900,
    easing: 'easeOutExpo'
  });

  // ── Scroll reveal ──────────────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 700,
          easing: 'easeOutCubic'
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section').forEach(s => {
    s.style.opacity = 0;
    observer.observe(s);
  });

  // ── Theme toggle ───────────────────────────────────────────────
  const themeBtn = document.getElementById('themeBtn');
  const body = document.body;

  // Load saved preference
  if (localStorage.getItem('theme') === 'light') body.classList.add('light');

  themeBtn.addEventListener('click', () => {
    const goingLight = !body.classList.contains('light');

    // Animate icon spin with anime.js
    const iconEl = themeBtn.querySelector(goingLight ? '.moon' : '.sun');
    anime({
      targets: iconEl,
      rotate: [0, 360],
      duration: 600,
      easing: 'easeOutBack'
    });

    body.classList.toggle('light');
    localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
  });

  // Keyboard shortcut T
  document.addEventListener('keydown', e => {
    if (e.key === 't' && e.target.tagName !== 'INPUT') themeBtn.click();
  });

});
