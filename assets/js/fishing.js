document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════
     SCROLL REVEAL для карточек рыб — нативный, без anime.js,
     чтобы раздел не тянул лишнюю зависимость.
  ══════════════════════════════════════════════════ */
  const cards = document.querySelectorAll('.fish-card');

  if ('IntersectionObserver' in window) {
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(18px)';
      card.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    cards.forEach(card => observer.observe(card));
  }

  /* ══════════════════════════════════════════════════
     Лёгкое выделение карточки при клике (на будущее можно
     развернуть в полноценную панель с подробностями)
  ══════════════════════════════════════════════════ */
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

});
