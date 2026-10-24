/**
 * RAJPUT JEWELLERS - GSAP PINNED FRAME SEQUENCE & WEBSITE TRANSITION
 * Bulletproof Production Edition: Zero-blank screen, instant image fallback, rock-solid scroll.
 */

(function () {
  'use strict';

  function initSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[Rajput] GSAP / ScrollTrigger not yet available, retrying in 50ms...');
      setTimeout(initSequence, 50);
      return;
    }

    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      console.warn('[Rajput] ScrollTrigger registration note:', e);
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
    const skipBtn = document.getElementById('skip-to-website-btn');
    const replayBtn = document.getElementById('replay-cinematic-pill');
    const siteHeader = document.getElementById('site-header');

    if (!section || !pinViewport || !canvas) {
      console.error('[Rajput] Essential DOM elements missing for scroll sequence.');
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

      // Hide fallback img now that canvas has drawn its first content
      if (fallbackImg && fallbackImg.style.display !== 'none') {
        fallbackImg.style.display = 'none';
      }
    }

    function resizeCanvas() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const w = Math.max(320, Math.round(rect.width * dpr));
      const h = Math.max(240, Math.round(rect.height * dpr));

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
          const img = new Image();
          img.src = getFrameUrl(i);
          const idx = i - 1;
          img.onload = () => { frames[idx] = img; };
        }
        setTimeout(() => loadRemainingBatch(end + 1, batchSize), 40);
      }

      setTimeout(() => loadRemainingBatch(36, 30), 100);
    }

    // Build the GSAP ScrollTrigger timeline
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

            // Smoothly reveal header towards completion
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

      // Scroll listener: guarantees header is visible on website
      window.addEventListener('scroll', () => {
        if (!siteHeader) return;
        const triggerEnd = scrollTriggerInstance ? scrollTriggerInstance.end : 900;
        if (window.scrollY >= triggerEnd - 150) {
          siteHeader.classList.add('visible');
        } else if (scrollTriggerInstance && scrollTriggerInstance.progress < 0.70) {
          siteHeader.classList.remove('visible');
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
          if (siteHeader) siteHeader.classList.add('visible');
        });
      }

      // Replay Button
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          if (siteHeader) siteHeader.classList.remove('visible');
        });
      }

      // Render initial frame
      renderFrame(1);
      setTimeout(() => ScrollTrigger.refresh(), 100);
      setTimeout(() => ScrollTrigger.refresh(), 400);
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
