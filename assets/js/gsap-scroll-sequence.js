/**
 * ROYAL JEWELLERS - GSAP PINNED FRAME SEQUENCE & WEBSITE TRANSITION
 * Bulletproof Production Edition: Zero-blank screen, instant image fallback, rock-solid scroll.
 */

(function () {
  'use strict';

  function initSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[Royal Jewellers] GSAP / ScrollTrigger not yet available, retrying in 50ms...');
      setTimeout(initSequence, 50);
      return;
    }

    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      console.warn('[Royal Jewellers] ScrollTrigger registration note:', e);
    }

    const TOTAL_FRAMES = 210;
    const frames = new Array(TOTAL_FRAMES);
    const frameObj = { frame: 1 };
    let lastRenderedIdx = -1;
    let scrollTriggerInstance = null;

    const section = document.getElementById('necklace-scroll-section');
    const pinViewport = document.getElementById('necklace-pin-viewport');
    const container = document.getElementById('necklace-canvas-container');
    const fallbackImg = document.getElementById('necklace-fallback-img');
    const canvas = document.getElementById('necklace-canvas');
    const scrollPrompt = document.getElementById('necklace-scroll-prompt');
    const introOverlay = document.getElementById('necklace-intro-overlay');
    const skipBtn = document.getElementById('skip-to-website-btn');
    const replayBtn = document.getElementById('replay-cinematic-pill');
    const siteHeader = document.getElementById('site-header');

    if (!section || !pinViewport || !canvas) {
      console.warn('[Royal Jewellers] Essential DOM elements missing for dedicated scroll sequence.');
      setupNavigation();
      setupMagneticButtons();
      setupMultiPlaneParallax();
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: false });

    // Dynamic URL resolution based on current document location
    function getFrameUrl(idx) {
      const padded = String(idx).padStart(3, '0');
      const filename = `assets/frames/ezgif-frame-${padded}.jpg`;
      try {
        const base = document.baseURI || window.location.href;
        return new URL(filename, base).href;
      } catch (e) {
        return filename;
      }
    }

    // Render frame to canvas with aspect ratio containment
    function renderFrame(frameNumber) {
      if (!ctx || !canvas) return;

      const targetIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameNumber) - 1));
      let img = frames[targetIdx];

      // If requested frame isn't loaded yet, find nearest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        let bestDist = Infinity;
        let bestImg = null;
        for (let i = 0; i < TOTAL_FRAMES; i++) {
          if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
            const dist = Math.abs(i - targetIdx);
            if (dist < bestDist) {
              bestDist = dist;
              bestImg = frames[i];
            }
          }
        }
        if (bestImg) {
          img = bestImg;
        } else if (lastRenderedIdx >= 0 && frames[lastRenderedIdx]?.complete) {
          img = frames[lastRenderedIdx];
        } else {
          return; // No frame ready yet; fallbackImg is visible underneath
        }
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      const imgW = img.naturalWidth || 1280;
      const imgH = img.naturalHeight || 720;
      const imgRatio = imgW / imgH;
      const canvasRatio = w / h;

      let drawW, drawH, drawX, drawY;

      if (canvasRatio > imgRatio) {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      lastRenderedIdx = targetIdx;

      // Smoothly hide fallback image now that canvas has drawn its first content
      if (fallbackImg && fallbackImg.style.opacity !== '0') {
        fallbackImg.style.opacity = '0';
        setTimeout(() => {
          if (fallbackImg) fallbackImg.style.display = 'none';
        }, 500);
      }
    }

    function resizeCanvas() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const rectWidth = rect.width || window.innerWidth || 1280;
      const rectHeight = rect.height || window.innerHeight || 720;

      const w = Math.max(320, Math.round(rectWidth * dpr));
      const h = Math.max(240, Math.round(rectHeight * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      renderFrame(frameObj.frame);
    }

    // Preload frames progressively
    function preloadFrames() {
      // 1. Frame 1 first
      const f1 = new Image();
      f1.src = getFrameUrl(1);
      f1.onload = () => {
        frames[0] = f1;
        renderFrame(1);
        if (scrollTriggerInstance) ScrollTrigger.refresh();
      };

      // 1b. Preload Frame 210 (fully assembled) early for crisp end state
      const fEnd = new Image();
      fEnd.src = getFrameUrl(TOTAL_FRAMES);
      fEnd.onload = () => {
        frames[TOTAL_FRAMES - 1] = fEnd;
      };

      // 2. Initial scrub batch (frames 2 to 35)
      for (let i = 2; i <= 35 && i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        const idx = i - 1;
        img.onload = () => { frames[idx] = img; };
      }

      // 3. Background batches for remaining frames
      function loadRemainingBatch(start, batchSize) {
        if (start > TOTAL_FRAMES) return;
        const end = Math.min(TOTAL_FRAMES, start + batchSize - 1);
        for (let i = start; i <= end; i++) {
          if (!frames[i - 1]) {
            const img = new Image();
            img.src = getFrameUrl(i);
            const idx = i - 1;
            img.onload = () => { frames[idx] = img; };
          }
        }
        setTimeout(() => loadRemainingBatch(end + 1, batchSize), 40);
      }

      setTimeout(() => loadRemainingBatch(36, 30), 100);
    }

    // Build the GSAP ScrollTrigger timeline & Dedicated Section Transition
    function setupScrollTrigger() {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=950', // 4 to 5 natural mouse-wheel scrolls
          pin: pinViewport,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Hide scroll prompt once user starts scrolling
            if (scrollPrompt) {
              if (self.progress > 0.05) {
                scrollPrompt.style.opacity = '0';
                scrollPrompt.style.pointerEvents = 'none';
              } else {
                scrollPrompt.style.opacity = '1';
                scrollPrompt.style.pointerEvents = 'auto';
              }
            }

            // Fade out the intro atelier overlay as scroll progresses
            if (introOverlay) {
              if (self.progress > 0.12) {
                introOverlay.style.opacity = '0';
              } else {
                introOverlay.style.opacity = String(Math.max(0, 1 - self.progress * 8));
              }
            }

            // Deepen transparent header on scroll
            if (siteHeader) {
              if (self.progress >= 0.35 || window.scrollY >= 200) {
                siteHeader.classList.add('header-scrolled');
              } else {
                siteHeader.classList.remove('header-scrolled');
              }
            }
          }
        }
      });

      scrollTriggerInstance = tl.scrollTrigger;

      // Phase 1: Scrub frames 1 -> 210
      tl.to(frameObj, {
        frame: TOTAL_FRAMES,
        ease: 'none',
        duration: 3,
        onUpdate: () => {
          renderFrame(frameObj.frame);
        }
      });

      // Phase 2: Hold complete necklace
      tl.to({}, { duration: 0.5 });

      // Phase 3: Dissolve canvas into website
      tl.to(canvas, {
        scale: 1.04,
        opacity: 0,
        ease: 'power1.inOut',
        duration: 0.8
      });

      // Scroll listener: toggles transparent glass vs frosted scrolled glass
      window.addEventListener('scroll', () => {
        if (!siteHeader) return;
        if (window.scrollY >= 150) {
          siteHeader.classList.add('header-scrolled');
        } else if (scrollTriggerInstance && scrollTriggerInstance.progress < 0.35) {
          siteHeader.classList.remove('header-scrolled');
        }
      }, { passive: true });

      // Skip Button
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          const targetY = scrollTriggerInstance ? (scrollTriggerInstance.end + 20) : (window.innerHeight + 950);
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
          if (siteHeader) siteHeader.classList.add('header-scrolled');
        });
      }

      // Replay Button
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          if (canvas) gsap.set(canvas, { opacity: 1, scale: 1 });
          if (introOverlay) introOverlay.style.opacity = '1';
          if (scrollPrompt) scrollPrompt.style.opacity = '1';
          if (siteHeader) siteHeader.classList.remove('header-scrolled');
          frameObj.frame = 1;
          renderFrame(1);
        });
      }

      // Render initial frame
      renderFrame(1);
      setTimeout(() => ScrollTrigger.refresh(), 100);
      setTimeout(() => ScrollTrigger.refresh(), 400);

      // Initialize navigation interactivity & smooth scrolling
      setupNavigation();
      setupMagneticButtons();
      setupMultiPlaneParallax();
    }

    // Interactive Navigation Bar Handler
    function setupNavigation() {
      const mobileToggle = document.getElementById('mobile-menu-toggle');
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileIcon = document.getElementById('mobile-menu-icon');
      const brandLink = document.getElementById('site-brand-link');

      // Mobile Menu Toggle
      if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = mobileMenu.classList.contains('hidden');
          if (isHidden) {
            mobileMenu.classList.remove('hidden');
            if (mobileIcon) mobileIcon.textContent = 'close';
          } else {
            mobileMenu.classList.add('hidden');
            if (mobileIcon) mobileIcon.textContent = 'menu';
          }
        });

        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
          if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
            mobileMenu.classList.add('hidden');
            if (mobileIcon) mobileIcon.textContent = 'menu';
          }
        });
      }

      // Brand logo click scrolls to top
      if (brandLink) {
        brandLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (mobileMenu) mobileMenu.classList.add('hidden');
          if (mobileIcon) mobileIcon.textContent = 'menu';
        });
      }

      // Smooth scroll for all hash navigation links with header offset
      const allHashLinks = document.querySelectorAll('a[href^="#"]');
      allHashLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (!href || href === '#') return;

          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const header = document.getElementById('site-header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetTop = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 10);

            window.scrollTo({
              top: Math.max(0, targetTop),
              behavior: 'smooth'
            });

            // Update active state on desktop navbar
            document.querySelectorAll('#desktop-nav .nav-item').forEach(navItem => {
              if (navItem.getAttribute('href') === href) {
                navItem.className = 'nav-item px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider transition-all bg-[#a855f7] text-white font-semibold rounded-lg shadow-[0_0_12px_rgba(168,85,247,0.35)]';
              } else {
                navItem.className = 'nav-item px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a]/60 rounded-lg transition-all';
              }
            });

            // Close mobile menu
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
              mobileMenu.classList.add('hidden');
              if (mobileIcon) mobileIcon.textContent = 'menu';
            }
          }
        });
      });

      // Active section spy on scroll
      const spySections = [
        { id: 'signature-collections', link: '#signature-collections' },
        { id: 'gold-jewellery', link: '#gold-jewellery' },
        { id: 'diamond-polki', link: '#diamond-polki' },
        { id: 'silver-collection', link: '#silver-collection' },
        { id: 'daily-gold-rate', link: '#daily-gold-rate' },
        { id: 'showroom-visit', link: '#showroom-visit' }
      ];

      window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 250;
        let activeLink = '';

        spySections.forEach(({ id, link }) => {
          const el = document.getElementById(id);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              activeLink = link;
            }
          }
        });

        if (activeLink) {
          document.querySelectorAll('#desktop-nav .nav-item').forEach(navItem => {
            if (navItem.getAttribute('href') === activeLink) {
              navItem.className = 'nav-item px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider transition-all bg-[#a855f7] text-white font-semibold rounded-lg shadow-[0_0_12px_rgba(168,85,247,0.35)]';
            } else {
              navItem.className = 'nav-item px-space-sm py-1 font-label-md text-label-md uppercase tracking-wider text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a]/60 rounded-lg transition-all';
            }
          });
        }
      }, { passive: true });
    }

    // --------------------------------------------------------------------------
    // 1. Magnetic Pull Buttons
    // Smooth spring cursor tracking for luxury interactive elements
    // --------------------------------------------------------------------------
    function setupMagneticButtons() {
      if (window.matchMedia('(pointer: coarse)').matches) return; // Touchscreen safety

      const buttons = document.querySelectorAll('.magnetic-btn');
      buttons.forEach(btn => {
        const strength = 0.35;
        const innerStrength = 0.15;
        const inner = btn.querySelector('span, .material-symbols-outlined');

        const xTo = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
        const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.35, ease: 'power2.out' }) : null;
        const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.35, ease: 'power2.out' }) : null;

        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const relX = e.clientX - (rect.left + rect.width / 2);
          const relY = e.clientY - (rect.top + rect.height / 2);

          xTo(relX * strength);
          yTo(relY * strength);
          if (ixTo) ixTo(relX * innerStrength);
          if (iyTo) iyTo(relY * innerStrength);
        });

        btn.addEventListener('mouseleave', () => {
          xTo(0);
          yTo(0);
          if (ixTo) ixTo(0);
          if (iyTo) iyTo(0);
        });
      });
    }

    // --------------------------------------------------------------------------
    // 2. Multi-Plane Parallax Depth
    // Jewellery imagery, background auras, and badges move at tiered speeds
    // --------------------------------------------------------------------------
    function setupMultiPlaneParallax() {
      if (typeof ScrollTrigger === 'undefined') return;

      // Plane 1: Background Ambient Glow Auras (Slow drift: y -40px to +40px)
      const auras = document.querySelectorAll('.parallax-aura');
      auras.forEach(aura => {
        const section = aura.closest('section') || aura.parentElement;
        gsap.fromTo(aura,
          { y: -35, opacity: 0.45 },
          {
            y: 35,
            opacity: 0.85,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        );
      });

      // Plane 2: Showcase Jewellery Images (Masked Parallax: yPercent -7 to +7)
      const parallaxImages = document.querySelectorAll('.parallax-img');
      parallaxImages.forEach(img => {
        const container = img.closest('.parallax-container') || img.parentElement;
        gsap.fromTo(img,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            }
          }
        );
      });

      // Plane 3: Floating Foreground Badges & Monogram Chips (Fast drift: y 15px to -22px)
      const badges = document.querySelectorAll('.parallax-badge');
      badges.forEach((badge, index) => {
        const triggerEl = badge.closest('section') || badge.parentElement;
        const distance = (index % 2 === 0) ? -22 : -16;
        gsap.fromTo(badge,
          { y: 15 },
          {
            y: distance,
            ease: 'none',
            scrollTrigger: {
              trigger: triggerEl,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.6
            }
          }
        );
      });
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

    setupScrollTrigger();
    preloadFrames();

    window.addEventListener('load', () => {
      resizeCanvas();
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSequence);
  } else {
    initSequence();
  }
})();
