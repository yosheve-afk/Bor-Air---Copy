document.addEventListener('DOMContentLoaded', () => {

  /* =========================================
     MOBILE NAV TOGGLE
  ========================================= */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  const closeMenu = () => {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    navToggle.classList.add('active');
    navMenu.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  navToggle.addEventListener('click', () => {
    const isActive = navMenu.classList.contains('active');
    isActive ? closeMenu() : openMenu();
  });

  // Close mobile menu when a nav link is clicked
  document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    const clickedInsideMenu = navMenu.contains(e.target) || navToggle.contains(e.target);
    if (!clickedInsideMenu && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  /* =========================================
     STICKY HEADER SHADOW ON SCROLL
  ========================================= */
  const siteHeader = document.getElementById('siteHeader');

  const handleHeaderScroll = () => {
    if (window.scrollY > 10) {
      siteHeader.classList.add('is-scrolled');
    } else {
      siteHeader.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  /* =========================================
     SCROLL REVEAL ANIMATIONS
  ========================================= */
  const revealTargets = document.querySelectorAll(
    '.service-card, .feature-item, .gallery-item, .why-us-media, .why-us-content, .hero-content, .hero-media'
  );

  revealTargets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealTargets.forEach(el => observer.observe(el));

  /* =========================================
     DYNAMIC COPYRIGHT YEAR
  ========================================= */
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* =========================================
     SMOOTH ANCHOR SCROLL OFFSET
     (accounts for sticky header height)
  ========================================= */
  const headerHeight = () => siteHeader.offsetHeight;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const offsetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight() - 10;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
      }
    });
  });

});