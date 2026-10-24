/**
 * RAJPUT JEWELLERS - GSAP PINNED FRAME SEQUENCE & WEBSITE TRANSITION
 * Ultra-robust edition: Works across Localhost, GitHub Pages (subpaths), and Vercel CDN.
 * Powered by GSAP 3 + ScrollTrigger
 */

(function () {
  'use strict';

  function bootstrap() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[Rajput ScrollSequence] GSAP or ScrollTrigger not ready yet, retrying...');
      setTimeout(bootstrap, 50);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const TOTAL_FRAMES = 210;
    let canvas = null;
    let ctx = null;
    let container = null;

    // Cache of Image objects
    const frames = new Array(TOTAL_FRAMES);
    let lastRenderedIdx = -1;
    let firstFrameLoaded = false;
    const frameObj = { frame: 1 };
    let scrollTriggerInstance = null;

    /**
     * Resolves absolute asset URL using document.baseURI.
     * Ensures flawless loading on:
     * - Localhost: http://localhost:3000/assets/frames/...
     * - Vercel: https://domain.vercel.app/assets/frames/...
     * - GitHub Pages: https://username.github.io/repo-name/assets/frames/...
     */
    function getFrameSrc(index) {
      const padded = String(index).padStart(3, '0');
      try {
        return new URL(`assets/frames/ezgif-frame-${padded}.jpg`, document.baseURI).href;
      } catch (e) {
        return `assets/frames/ezgif-frame-${padded}.jpg`;
      }
    }

    /**
     * Render a frame to canvas with aspect ratio preservation
     */
    function renderFrame(frameNumber) {
      if (!ctx || !canvas) return;

      const targetIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameNumber) - 1));
      let img = frames[targetIdx];

      // If target frame not yet loaded over network, find nearest loaded frame
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
          return; // No frame ready yet
        }
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw background
      ctx.fillStyle = '#000000';
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
    }

    function resizeCanvas() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const newW = Math.max(320, Math.round(rect.width * dpr));
      const newH = Math.max(240, Math.round(rect.height * dpr));

      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      renderFrame(frameObj.frame);
    }

    /**
     * Prioritized progressive preloader
     */
    function preloadFrames() {
      // 1. Load Frame 1 with top priority
      const img1 = new Image();
      img1.crossOrigin = 'anonymous';
      img1.src = getFrameSrc(1);

      img1.onload = () => {
        frames[0] = img1;
        firstFrameLoaded = true;
        renderFrame(1);
        if (scrollTriggerInstance) {
          ScrollTrigger.refresh();
        }
      };

      img1.onerror = () => {
        console.error('[Rajput ScrollSequence] Failed to load Frame 1 from:', img1.src);
      };

      // 2. Load Frame 2 to 30 immediately (first scrub chunk)
      const loadChunk = (start, end) => {
        for (let i = start; i <= end && i <= TOTAL_FRAMES; i++) {
          const idx = i - 1;
          if (frames[idx]) continue;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = getFrameSrc(i);
          img.onload = () => {
            frames[idx] = img;
          };
        }
      };

      // Immediate chunk for initial scroll interaction
      loadChunk(2, 35);

      // Remaining frames loaded in idle/background batches
      const loadRemaining = () => {
        let current = 36;
        const step = 25;
        function nextBatch() {
          if (current > TOTAL_FRAMES) return;
          loadChunk(current, current + step - 1);
          current += step;
          setTimeout(nextBatch, 40);
        }
        setTimeout(nextBatch, 100);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadRemaining);
      } else {
        setTimeout(loadRemaining, 200);
      }
    }

    /**
     * Set up GSAP ScrollTrigger timeline
     */
    function setupScrollTrigger() {
      const section = document.getElementById('necklace-scroll-section');
      const pinViewport = document.getElementById('necklace-pin-viewport');
      const scrollPrompt = document.getElementById('necklace-scroll-prompt');
      const ambientBackdrop = document.getElementById('hero-ambient-backdrop');
      const skipBtn = document.getElementById('skip-to-website-btn');
      const siteHeader = document.getElementById('site-header');

      if (!section || !pinViewport) {
        console.warn('[Rajput ScrollSequence] Section or pin viewport not found in DOM.');
        return;
      }

      // Master ScrollTrigger timeline (~4-5 natural mouse scroll clicks = 950px)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=950',
          pin: pinViewport,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Toggle initial scroll prompt
            if (scrollPrompt) {
              if (self.progress > 0.05) {
                scrollPrompt.style.opacity = '0';
                scrollPrompt.style.pointerEvents = 'none';
              } else {
                scrollPrompt.style.opacity = '1';
                scrollPrompt.style.pointerEvents = 'auto';
              }
            }

            // Reveal header smoothly as necklace completes assembly
            if (siteHeader) {
              if (self.progress >= 0.70 || window.scrollY >= (self.end - 150)) {
                siteHeader.classList.add('visible');
              } else {
                siteHeader.classList.remove('visible');
              }
            }
          }
        }
      });

      scrollTriggerInstance = tl.scrollTrigger;

      // Phase 1: Scrub through frames 1 to 210 (assembly)
      tl.to(frameObj, {
        frame: TOTAL_FRAMES,
        ease: 'none',
        duration: 3,
        onUpdate: () => {
          renderFrame(frameObj.frame);
        }
      });

      // Phase 2: Hold the final assembled necklace frame
      tl.to({}, { duration: 0.5 });

      // Phase 3: Seamless dissolve transition into website
      tl.to(canvas, {
        scale: 1.04,
        opacity: 0,
        ease: 'power1.inOut',
        duration: 0.8
      }, 'fadeTransition');

      if (ambientBackdrop) {
        tl.to(ambientBackdrop, {
          opacity: 1,
          ease: 'power1.inOut',
          duration: 0.8
        }, 'fadeTransition');
      }

      // Ensure header stays visible anywhere down on the website
      window.addEventListener('scroll', () => {
        if (!siteHeader) return;
        const triggerEnd = scrollTriggerInstance ? scrollTriggerInstance.end : 950;
        if (window.scrollY >= triggerEnd - 150) {
          siteHeader.classList.add('visible');
        } else if (scrollTriggerInstance && scrollTriggerInstance.progress < 0.70) {
          siteHeader.classList.remove('visible');
        }
      }, { passive: true });

      // Skip Button
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          const scrollTarget = scrollTriggerInstance ? (scrollTriggerInstance.end + 20) : (window.innerHeight + 1000);
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });
          if (siteHeader) siteHeader.classList.add('visible');
        });
      }

      // Replay Button
      const replayBtn = document.getElementById('replay-cinematic-pill');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          if (siteHeader) siteHeader.classList.remove('visible');
        });
      }

      // Initial render & refresh
      renderFrame(1);
      setTimeout(() => ScrollTrigger.refresh(), 100);
      setTimeout(() => ScrollTrigger.refresh(), 400);
    }

    function init() {
      container = document.getElementById('necklace-canvas-container');
      if (!container) return;

      canvas = document.getElementById('necklace-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'necklace-canvas';
        container.appendChild(canvas);
      }

      ctx = canvas.getContext('2d', { alpha: false });

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, { passive: true });
      window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 150);
      });

      // Set up ScrollTrigger and begin preloading simultaneously
      setupScrollTrigger();
      preloadFrames();

      // Refresh ScrollTrigger after full window load
      window.addEventListener('load', () => {
        resizeCanvas();
        ScrollTrigger.refresh();
      });
    }

    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
