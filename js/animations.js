document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);

  const motion = initReducedMotionHandling();
  const prefersReduced = motion.prefersReduced;
  const lowEnd = motion.lowEnd;

  const lenis = !prefersReduced && !lowEnd ? initLenis() : null;

  const chapterOverlayState = {
    mode: 'none',
    intensity: 0
  };

  // --- PRELOADER ---
  const preloaderTL = gsap.timeline();
  preloaderTL
    .to('.preloader-progress', { width: '100%', duration: 1.35, ease: 'power2.inOut' })
    .to('#preloader', {
      y: '-100%',
      duration: 0.95,
      ease: 'power4.inOut',
      onComplete: () => {
        const pre = document.getElementById('preloader');
        if (pre) pre.style.display = 'none';
        startIntro();
        initChapterScrollSync(prefersReduced, chapterOverlayState);
        initCanvasOverlay(prefersReduced, lowEnd, chapterOverlayState);
        initMagneticButtons(prefersReduced, lowEnd);
      }
    });

  // --- SCROLL PROGRESS BAR ---
  gsap.to('#scroll-progress', {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
      scrub: 0.25,
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom'
    }
  });

  // --- MENU LOGIC ---
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      menu.classList.toggle('active');
      const expanded = menu.classList.contains('active');
      hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');

      const icon = hamburger.querySelector('i');
      if (expanded) {
        icon.classList.remove('bx-menu');
        icon.classList.add('bx-x');
        gsap.from(menu.querySelectorAll('li'), { x: 24, opacity: 0, stagger: 0.06, duration: 0.45, ease: 'power2.out' });
      } else {
        icon.classList.remove('bx-x');
        icon.classList.add('bx-menu');
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        const icon = hamburger.querySelector('i');
        icon.classList.remove('bx-x');
        icon.classList.add('bx-menu');
      });
    });
  }

  // Navbar background on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // --- Intro animation (Hero) ---
  function startIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('#navbar', { y: -50, opacity: 0, duration: 0.9 })
      .from('.badge', { opacity: 0, y: 10, duration: 0.5 }, '-=0.45')
      .from('.hero-title', { opacity: 0, y: 24, duration: 0.8 }, '-=0.35')
      .from('.hero-subtitle', { opacity: 0, y: 18, duration: 0.7 }, '-=0.55')
      .from('.chip', { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, '-=0.55')
      .from('.hero-buttons .btn', { opacity: 0, y: 14, duration: 0.55, stagger: 0.12 }, '-=0.5')
      .from('.hero-hint', { opacity: 0, y: 10, duration: 0.6 }, '-=0.35');

    // Subtle hero video zoom on scroll (nice, but cheap)
    if (!prefersReduced) {
      gsap.to('.hero-video', {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
  }

  // --- Storytelling Chapters (Pinned) + reveals ---
  function initChapterScrollSync(prefersReduced, chapterOverlayState) {
    if (prefersReduced) return;

    const chapters = gsap.utils.toArray('.chapter');
    chapters.forEach((chapter) => {
      const accent = chapter.getAttribute('data-accent') || 'magenta';
      const copy = chapter.querySelector('.chapter-copy');
      const media = chapter.querySelector('.chapter-media');
      const stack = chapter.querySelector('.media-stack');
      const glow = chapter.querySelector('.media-glow');
      const title = chapter.querySelector('.chapter-title');

      if (title) {
        const words = splitTitleWords(title);
        if (words.length) {
          gsap.from(words, {
            scrollTrigger: {
              trigger: chapter,
              start: 'top 70%',
              toggleActions: 'play none none reverse'
            },
            y: 20,
            opacity: 0,
            filter: 'blur(6px)',
            duration: 0.6,
            stagger: 0.06,
            ease: 'power3.out'
          });
        }
      }

      ScrollTrigger.create({
        trigger: chapter,
        start: 'top top',
        end: '+=120%',
        pin: true,
        pinSpacing: true
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: chapter,
          start: 'top top',
          end: '+=120%',
          scrub: 0.8,
          onUpdate(self) {
            if (!chapterOverlayState) return;
            chapterOverlayState.mode = chapter.id || 'none';
            chapterOverlayState.intensity = self.progress;
          }
        }
      });

      tl.fromTo(copy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, 0.05)
        .fromTo(media, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.12);

      if (stack) {
        tl.fromTo(stack.children, 
          { y: 40, opacity: 0, rotate: (i) => i === 0 ? -15 : 12, x: (i) => i === 0 ? -20 : 20 }, 
          { y: 0, opacity: 1, rotate: (i) => i === 0 ? -8 : 6, x: 0, stagger: 0.15, duration: 0.6, ease: 'back.out(1.7)' }, 
          0.2
        );
      }
      if (glow) {
        tl.fromTo(glow, { opacity: 0.2, scale: 0.9 }, { opacity: 0.9, scale: 1.1, duration: 0.6 }, 0.15)
          .to(glow, { opacity: 0.4, scale: 0.95, duration: 0.6 }, 0.8);
      }

      tl.to(
        chapter,
        { '--accent': accent === 'cyan' ? '#44d7ff' : accent === 'amber' ? '#ffb02e' : '#ff2bd6', duration: 0.01 },
        0
      );
    });

    const sections = gsap.utils.toArray('.section');
    sections.forEach((section) => {
      const header = section.querySelector('.section-header');
      const cards = section.querySelectorAll('.card');

      if (header) {
        gsap.from(header, {
          scrollTrigger: { trigger: header, start: 'top 85%' },
          y: 18,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out'
        });
      }

      if (cards.length) {
        gsap.from(cards, {
          scrollTrigger: { trigger: section, start: 'top 82%' },
          y: 20,
          opacity: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'all'
        });
      }
    });
  }

  function splitTitleWords(titleEl) {
    const text = titleEl.textContent || '';
    const words = text.split(' ').filter(Boolean);
    titleEl.textContent = '';
    const spans = [];
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = index === words.length - 1 ? word : word + ' ';
      span.classList.add('chapter-word');
      titleEl.appendChild(span);
      spans.push(span);
    });
    return spans;
  }

  // Card glow follows cursor (desktop only)
  const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (hasFinePointer && !prefersReduced && !lowEnd) {
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.card').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  // Canvas overlay / particles
  function initCanvasOverlay(prefersReduced, lowEnd, chapterOverlayState) {
    const canvas = document.getElementById('fx-canvas');
    if (!canvas || prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = [];
    let degradeQuality = lowEnd;
    let lastTime = performance.now();
    const fpsSamples = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    }

    function createParticles() {
      const baseCount = width < 768 ? 28 : 52;
      const count = degradeQuality ? Math.round(baseCount * 0.6) : baseCount;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.25,
          size: 1 + Math.random() * 2.2,
          baseAlpha: 0.18 + Math.random() * 0.25
        });
      }
    }

    function step(timestamp) {
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      const fps = 1000 / (delta || 1);
      fpsSamples.push(fps);
      if (fpsSamples.length > 60) {
        fpsSamples.shift();
        const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
        if (avg < 45 && !degradeQuality) {
          degradeQuality = true;
          createParticles();
        }
      }

      ctx.clearRect(0, 0, width, height);

      const mode = chapterOverlayState?.mode || 'none';
      const intensity = chapterOverlayState?.intensity ?? 0;

      let speedFactor = 0.6;
      let sizeFactor = 1;
      let alphaBoost = 1;

      if (mode === 'invitaciones') {
        sizeFactor = 1.1;
        speedFactor = 0.5;
        alphaBoost = 1.2;
      } else if (mode === 'webs') {
        speedFactor = 1.1;
        sizeFactor = 0.95;
        alphaBoost = 1.1;
      } else if (mode === 'edicion') {
        speedFactor = 0.55;
        sizeFactor = 1.4;
        alphaBoost = 1.3;
      }

      const globalAlphaScale = 0.2 + intensity * 0.8;

      let linkBudget = degradeQuality ? 6 : 12;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * speedFactor * (1 + intensity * 0.8);
        p.y += p.vy * speedFactor * (1 + intensity * 0.8);

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const alpha = p.baseAlpha * globalAlphaScale * alphaBoost * (degradeQuality ? 0.9 : 1);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(p.x, p.y, p.size * sizeFactor, 0, Math.PI * 2);
        ctx.fill();

        if (mode === 'webs' && linkBudget > 0 && !degradeQuality) {
          for (let j = i + 1; j < particles.length && linkBudget > 0; j++) {
            const q = particles[j];
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 120 * 120) {
              linkBudget--;
              const linkAlpha = 0.05 * globalAlphaScale;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255,255,255,${linkAlpha})`;
              ctx.lineWidth = 1;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
            }
          }
        }
      }

      requestAnimationFrame(step);
    }

    resize();
    window.addEventListener('resize', () => {
      clearTimeout(resize._id);
      resize._id = setTimeout(resize, 160);
    });
    requestAnimationFrame(step);
  }

  function initMagneticButtons(prefersReduced, lowEnd) {
    const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer || prefersReduced || lowEnd) return;

    const buttons = document.querySelectorAll('.magnetic');
    buttons.forEach((btn) => {
      const strength = 0.25;

      function onMove(e) {
        const rect = btn.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = (mx - cx) / cx;
        const dy = (my - cy) / cy;

        gsap.to(btn, {
          x: dx * strength * rect.width,
          y: dy * strength * rect.height,
          duration: 0.3,
          ease: 'power3.out'
        });
      }

      function reset() {
        gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: 'power3.out' });
      }

      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', reset);
    });
  }

  function initReducedMotionHandling() {
    const prefers = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const ua = navigator.userAgent || '';
    const lowCores = cores && cores <= 4;
    const lowMem = mem && mem <= 4;
    const oldAndroid = /Android\s(4|5|6)/i.test(ua);
    return {
      prefersReduced: !!prefers,
      lowEnd: !!(lowCores || lowMem || oldAndroid)
    };
  }

  function initLenis() {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  // --- Contact form -> WhatsApp message ---
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const service = (fd.get('service') || '').toString().trim();
      const message = (fd.get('message') || '').toString().trim();

      const text = `Hola! Soy ${name}.\n\nMe interesa: ${service}.\n\nDetalles: ${message}`;
      const url = `https://wa.me/5493757322079?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener');
    });
  }
});
