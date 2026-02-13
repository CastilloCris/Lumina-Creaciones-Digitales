document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // --- LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // --- PRELOADER ---
    const preloaderTL = gsap.timeline();
    preloaderTL.to(".preloader-progress", { width: "100%", duration: 1.5, ease: "power2.inOut" })
        .to("#preloader", { 
            y: "-100%", 
            duration: 1, 
            ease: "power4.inOut",
            onComplete: () => {
                document.getElementById('preloader').style.display = 'none';
                startHeroAnimations();
            }
        });

    // --- SCROLL PROGRESS BAR ---
    gsap.to("#scroll-progress", {
        width: "100%",
        ease: "none",
        scrollTrigger: {
            scrub: 0.3,
            trigger: "body",
            start: "top top",
            end: "bottom bottom"
        }
    });

    // --- MENU LOGIC ---
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            menu.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (menu.classList.contains('active')) {
                icon.classList.remove('bx-menu');
                icon.classList.add('bx-x');
                gsap.from(".menu li", { x: 50, opacity: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" });
            } else {
                icon.classList.remove('bx-x');
                icon.classList.add('bx-menu');
            }
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('bx-x');
                icon.classList.add('bx-menu');
            });
        });
    }

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // --- GSAP ANIMATIONS ---

    function startHeroAnimations() {
        const heroTL = gsap.timeline();
        
        // Prepare title for word-by-word reveal if possible, or just animate
        heroTL.from("#navbar", { y: -100, opacity: 0, duration: 1, ease: "power4.out" })
            .from(".badge", { opacity: 0, scale: 0.8, duration: 0.8, ease: "back.out(1.7)" }, "-=0.5")
            .from(".hero-title", { 
                y: 100, 
                opacity: 0, 
                duration: 1.2, 
                ease: "power4.out",
                skewY: 7
            }, "-=0.6")
            .from(".tagline-container", { opacity: 0, y: 20, duration: 1 }, "-=0.8")
            .from(".hero-buttons .btn", { y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power2.out" }, "-=0.8")
            .from(".hero-visual", { opacity: 0, scale: 0.9, duration: 1.5, ease: "power2.out" }, "-=1");
    }

    // 2. Rotating Taglines
    const taglines = [
        "Digital. Vibrante. Inolvidable.",
        "Arte en código.",
        "No creamos páginas. Creamos impacto.",
        "Haz que tu marca brille."
    ];
    let currentTaglineIndex = 0;

    function rotateTagline() {
        const taglineElement = document.getElementById('rotating-tagline');
        if (!taglineElement) return;

        currentTaglineIndex = (currentTaglineIndex + 1) % taglines.length;
        
        gsap.to(taglineElement, {
            duration: 0.8,
            opacity: 0,
            y: -20,
            ease: "power2.in",
            onComplete: () => {
                taglineElement.textContent = taglines[currentTaglineIndex];
                gsap.fromTo(taglineElement, 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
                );
            }
        });
    }

    setInterval(rotateTagline, 4000);

    // 3. ScrollTrigger Animations for Sections
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        const header = section.querySelector('.section-header');
        const gridItems = section.querySelectorAll('.card');

        if (header) {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: "top 90%",
                    toggleActions: "play none none none"
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }

        if (gridItems.length > 0) {
            gsap.from(gridItems, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                y: 40,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                clearProps: "all"
            });
        }
    });

    // 4. Mouse movement for Card Glow Effect
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });

    // 5. Parallax Effect for Hero Glow
    const glowEffect = document.querySelector('.glow-effect');
    if (glowEffect) {
        document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const xPos = (clientX / window.innerWidth - 0.5) * 60;
            const yPos = (clientY / window.innerHeight - 0.5) * 60;

            gsap.to(glowEffect, {
                x: xPos,
                y: yPos,
                duration: 2,
                ease: "power2.out"
            });
        });
    }
});
