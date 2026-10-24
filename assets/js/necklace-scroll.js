/**
 * ROYAL JEWELLERS - 210-FRAME LUXURY BRIDAL NECKLACE SCROLL ANIMATION
 * Ultra-smooth HTML5 Canvas Scrubbing Engine with Inertia & Touch Support
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 210;
  const FRAME_BASE_PATH = 'assets/frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  let canvas, ctx, container;
  let frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentFrameIndex = 1;
  let targetFrameIndex = 1;
  let animationFrameId = null;
  let isDraggingScrubber = false;
  let isCompleted = false;

  // Phase metadata for the 210-frame sequence
  const PHASES = [
    {
      maxFrame: 50,
      badge: "Phase 1 / 5",
      title: "Handcrafted 22KT Heirloom Components",
      desc: "Individual bridal karigari elements floating in showroom space. Scroll down to begin assembly."
    },
    {
      maxFrame: 105,
      badge: "Phase 2 / 5",
      title: "Choker Mesh Lattice Convergence",
      desc: "Intricate gold mesh collar and filigree borders converge into the anatomical neckline curve."
    },
    {
      maxFrame: 160,
      badge: "Phase 3 / 5",
      title: "Imperial Kundan Medallion Docking",
      desc: "Royal emerald & uncut Polki centerpiece connects to the lower tier with golden precision."
    },
    {
      maxFrame: 195,
      badge: "Phase 4 / 5",
      title: "Matching Earring Adornments & Drops",
      desc: "Handcrafted matching earrings and basra pearl drops float into the bridal suite alignment."
    },
    {
      maxFrame: 210,
      badge: "Masterpiece Complete",
      title: "Imperial 22K Royal Bridal Choker Suite",
      desc: "Imperial Kundan Polki masterpiece unified in pure 22KT gold. Ready for the bridal trousseau."
    }
  ];

  // Helper to get formatted filename: ezgif-frame-001.jpg
  function getFrameSrc(index) {
    const padded = String(index).padStart(3, '0');
    return `${FRAME_BASE_PATH}${padded}${FRAME_EXT}`;
  }

  // Preload all 210 frames with priority queue
  function preloadFrames() {
    // 1. High priority: Frame 1
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      drawFrame(1);
    };

    // 2. Preload remaining frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      const frameIdx = i - 1;
      img.onload = () => {
        frames[frameIdx] = img;
        loadedCount++;
      };
      img.onerror = () => {
        console.warn(`Failed to load frame ${i}`);
      };
    }
  }

  // Draw a specific frame to the canvas, maintaining aspect ratio
  function drawFrame(frameNumber) {
    if (!ctx || !canvas) return;

    const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameNumber) - 1));
    const img = frames[frameIdx];

    // Fallback: If current frame hasn't finished loading, find the closest loaded frame
    let imgToDraw = img;
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (frameIdx - offset >= 0 && frames[frameIdx - offset]?.complete) {
          imgToDraw = frames[frameIdx - offset];
          break;
        }
        if (frameIdx + offset < TOTAL_FRAMES && frames[frameIdx + offset]?.complete) {
          imgToDraw = frames[frameIdx + offset];
          break;
        }
      }
    }

    if (!imgToDraw || !imgToDraw.complete) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Image native dimensions (1280x720)
    const imgW = imgToDraw.naturalWidth || 1280;
    const imgH = imgToDraw.naturalHeight || 720;
    const imgRatio = imgW / imgH;
    const canvasRatio = w / h;

    let drawW, drawH, drawX, drawY;

    // Use "contain" to ensure the entire necklace is visible without crop
    if (canvasRatio > imgRatio) {
      // Screen is wider than 16:9
      drawH = h;
      drawW = h * imgRatio;
      drawX = (w - drawW) / 2;
      drawY = 0;
    } else {
      // Screen is taller than 16:9
      drawW = w;
      drawH = w / imgRatio;
      drawX = 0;
      drawY = (h - drawH) / 2;
    }

    ctx.drawImage(imgToDraw, drawX, drawY, drawW, drawH);
  }

  // Update UI & Transition triggers
  function updateUI(frameNumber) {
    const hintEl = document.getElementById('necklace-scroll-hint');
    const enterBtn = document.getElementById('enter-showroom-btn');

    // Fade out scroll hint once user starts scrubbing
    if (hintEl) {
      if (frameNumber > 8) {
        hintEl.classList.add('fade-out');
      } else {
        hintEl.classList.remove('fade-out');
      }
    }

    // Reveal Enter Showroom button when assembled (frame 205+)
    if (enterBtn) {
      if (frameNumber >= 205) {
        enterBtn.classList.add('visible');
        isCompleted = true;
      } else {
        enterBtn.classList.remove('visible');
        isCompleted = false;
      }
    }
  }

  // Render loop with smooth interpolation (inertia)
  function renderLoop() {
    animationFrameId = requestAnimationFrame(renderLoop);

    // Smooth lerp towards target frame
    const delta = targetFrameIndex - currentFrameIndex;
    if (Math.abs(delta) > 0.05) {
      currentFrameIndex += delta * 0.14;
      drawFrame(currentFrameIndex);
      updateUI(currentFrameIndex);
    }
  }

  // Handle window resizing & high-DPI canvas
  function onResize() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawFrame(currentFrameIndex);
  }

  // Scroll wheel event handler for scrubbing frames
  let scrollDeltaBuffer = 0;
  function onWheelScroll(e) {
    const stage = document.getElementById('necklace-stage');
    if (!stage || !stage.classList.contains('active')) return;

    // Prevent default browser scroll during frame animation
    e.preventDefault();

    // Sensitivity tuning: 1 mouse wheel notch = ~8-12 frames
    const stepSize = (e.deltaY > 0 ? 1 : -1) * Math.max(3, Math.min(18, Math.abs(e.deltaY) * 0.08));

    if (e.deltaY > 0) {
      if (targetFrameIndex >= TOTAL_FRAMES && isCompleted) {
        // If at the end and scrolling more, smoothly transition to homepage
        scrollDeltaBuffer += e.deltaY;
        if (scrollDeltaBuffer > 35) {
          scrollDeltaBuffer = 0;
          window.RoyalCinematic && window.RoyalCinematic.completeAndRevealHomepage();
        }
      } else {
        scrollDeltaBuffer = 0;
        targetFrameIndex = Math.min(TOTAL_FRAMES, targetFrameIndex + stepSize);
      }
    } else {
      scrollDeltaBuffer = 0;
      targetFrameIndex = Math.max(1, targetFrameIndex + stepSize);
    }
  }

  // Touch swipe support for mobile
  let touchLastY = 0;
  function onTouchStart(e) {
    if (e.touches && e.touches[0]) {
      touchLastY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    const stage = document.getElementById('necklace-stage');
    if (!stage || !stage.classList.contains('active')) return;

    if (e.touches && e.touches[0]) {
      const currentY = e.touches[0].clientY;
      const diffY = touchLastY - currentY;
      touchLastY = currentY;

      if (Math.abs(diffY) > 1) {
        e.preventDefault();
        const stepSize = diffY * 0.45;

        if (diffY > 0 && targetFrameIndex >= TOTAL_FRAMES && isCompleted) {
          scrollDeltaBuffer += diffY;
          if (scrollDeltaBuffer > 20) {
            scrollDeltaBuffer = 0;
            window.RoyalCinematic && window.RoyalCinematic.completeAndRevealHomepage();
          }
        } else {
          scrollDeltaBuffer = 0;
          targetFrameIndex = Math.max(1, Math.min(TOTAL_FRAMES, targetFrameIndex + stepSize));
        }
      }
    }
  }

  // Interactive scrubber track click / drag
  function setupScrubberEvents() {
    const track = document.getElementById('necklace-scrubber-track');
    if (!track) return;

    function handleScrub(e) {
      const rect = track.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      targetFrameIndex = 1 + p * (TOTAL_FRAMES - 1);
    }

    track.addEventListener('mousedown', (e) => {
      isDraggingScrubber = true;
      handleScrub(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingScrubber) {
        e.preventDefault();
        handleScrub(e);
      }
    });

    window.addEventListener('mouseup', () => {
      isDraggingScrubber = false;
    });

    // Touch scrubber
    track.addEventListener('touchstart', (e) => {
      isDraggingScrubber = true;
      handleScrub(e);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (isDraggingScrubber) {
        handleScrub(e);
      }
    }, { passive: true });

    track.addEventListener('touchend', () => {
      isDraggingScrubber = false;
    });
  }

  // Jump to specific milestone phase
  function jumpToPhase(phaseNumber) {
    const targets = [1, 55, 110, 165, 210];
    const target = targets[phaseNumber - 1] || 1;
    targetFrameIndex = target;
  }

  // Initialize
  function init() {
    container = document.getElementById('necklace-canvas-container');
    if (!container) return;

    // Create canvas
    canvas = document.getElementById('necklace-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'necklace-canvas';
      container.appendChild(canvas);
    }

    ctx = canvas.getContext('2d', { alpha: false });

    // Initial sizing
    onResize();

    // Preload frames
    preloadFrames();

    // Setup events
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onWheelScroll, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // Dot indicators
    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      if (dot) {
        dot.addEventListener('click', () => jumpToPhase(i));
      }
    }

    setupScrubberEvents();

    // Start render loop
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  }

  // Public API
  window.RoyalNecklaceScroll = {
    init: init,
    setFrame: (f) => { targetFrameIndex = Math.max(1, Math.min(TOTAL_FRAMES, f)); },
    jumpToPhase: jumpToPhase,
    reset: () => { targetFrameIndex = 1; currentFrameIndex = 1; drawFrame(1); updateUI(1); },
    getIsCompleted: () => isCompleted
  };

  // Backwards compatibility alias if referenced anywhere
  window.RoyalNecklace3D = {
    init: init,
    setAssemblyStep: (step) => jumpToPhase(step || 1),
    getIsAssembled: () => isCompleted
  };
})();
