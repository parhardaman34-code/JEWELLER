/**
 * RAJPUT JEWELLERS - GSAP PINNED FRAME SEQUENCE & WEBSITE TRANSITION
 * Powered by GSAP 3 + ScrollTrigger
 */

(function () {
  'use strict';

  // Ensure GSAP and ScrollTrigger are available
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger is not loaded.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const TOTAL_FRAMES = 210;
  const FRAME_BASE_PATH = 'assets/frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  let canvas, ctx, container;
  let frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  const frameObj = { frame: 1 };
  let scrollTriggerInstance = null;

  function getFrameSrc(index) {
    const padded = String(index).padStart(3, '0');
    return `${FRAME_BASE_PATH}${padded}${FRAME_EXT}`;
  }

  // Draw current frame to canvas maintaining aspect ratio
  function renderFrame(frameNumber) {
    if (!ctx || !canvas) return;

    const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameNumber) - 1));
    let img = frames[frameIdx];

    // Fallback to nearest loaded frame if current isn't ready
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (frameIdx - offset >= 0 && frames[frameIdx - offset]?.complete) {
          img = frames[frameIdx - offset];
          break;
        }
        if (frameIdx + offset < TOTAL_FRAMES && frames[frameIdx + offset]?.complete) {
          img = frames[frameIdx + offset];
          break;
        }
      }
    }

    if (!img || !img.complete) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
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
  }

  function resizeCanvas() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderFrame(frameObj.frame);
  }

  // Preload frames
  function preloadImages(onFirstFrameReady) {
    // 1. Load Frame 1 first
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      if (onFirstFrameReady) onFirstFrameReady();
      renderFrame(1);
    };

    // 2. Preload the remaining frames in background
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      const idx = i - 1;
      img.onload = () => {
        frames[idx] = img;
        loadedCount++;
      };
    }
  }

  // Set up the GSAP ScrollTrigger timeline
  function setupScrollAnimation() {
    const section = document.getElementById('necklace-scroll-section');
    const pinViewport = document.getElementById('necklace-pin-viewport');
    const scrollPrompt = document.getElementById('necklace-scroll-prompt');
    const ambientBackdrop = document.getElementById('hero-ambient-backdrop');
    const originalWebsite = document.getElementById('original-website');
    const skipBtn = document.getElementById('skip-to-website-btn');

    if (!section || !pinViewport) return;

    // Build the master timeline with ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=3200', // Approx 4-5 scrolls for luxury feel
        pin: pinViewport,
        scrub: 0.6, // Smooth inertial scrub
        anticipatePin: 1,
        onUpdate: (self) => {
          // Hide initial scroll prompt as soon as user begins scrolling
          if (scrollPrompt) {
            if (self.progress > 0.04) {
              scrollPrompt.style.opacity = '0';
              scrollPrompt.style.pointerEvents = 'none';
            } else {
              scrollPrompt.style.opacity = '1';
              scrollPrompt.style.pointerEvents = 'auto';
            }
          }

          // Smoothly reveal site header as final frame dissolves into website
          const siteHeader = document.getElementById('site-header');
          if (siteHeader) {
            if (self.progress >= 0.82) {
              siteHeader.classList.add('visible');
            } else {
              siteHeader.classList.remove('visible');
            }
          }
        }
      }
    });

    scrollTriggerInstance = tl.scrollTrigger;

    // Phase 1 (0 to 0.70): Scrub through frames 1 to 210
    tl.to(frameObj, {
      frame: TOTAL_FRAMES,
      ease: 'none',
      duration: 3,
      onUpdate: () => {
        renderFrame(frameObj.frame);
      }
    });

    // Phase 2 (0.70 to 0.85): Hold/Pin the final completed necklace frame
    tl.to({}, { duration: 0.6 });

    // Phase 3 (0.85 to 1.00): Smoothly fade the pinned frame into full-screen background
    // and reveal the original website seamlessly!
    tl.to(canvas, {
      scale: 1.06,
      opacity: 0,
      ease: 'power2.inOut',
      duration: 1.2
    }, 'fadeTransition');

    if (ambientBackdrop) {
      tl.to(ambientBackdrop, {
        opacity: 1,
        ease: 'power1.inOut',
        duration: 1.2
      }, 'fadeTransition');
    }

    if (originalWebsite) {
      tl.fromTo(originalWebsite, {
        opacity: 0.85,
        y: 40
      }, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 1.2
      }, 'fadeTransition');
    }

    // Skip to Website action
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (scrollTriggerInstance) {
          const scrollTarget = scrollTriggerInstance.end + 20;
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });
        }
      });
    }

    // Replay button on homepage
    const replayBtn = document.getElementById('replay-cinematic-pill');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
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
    window.addEventListener('resize', resizeCanvas);

    preloadImages(() => {
      setupScrollAnimation();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
