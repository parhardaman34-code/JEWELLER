/**
 * RAJPUT JEWELLERS - CINEMATIC DRONE FLIGHT & STAGE COORDINATOR
 * Orchestrates Drone Approach, Showroom Entrance, and Homepage Reveal
 */

(function () {
  'use strict';

  let currentStage = 'drone'; // 'drone' | 'necklace' | 'homepage'
  let droneProgress = 0;
  let droneStartTime = null;
  const DRONE_DURATION = 6500; // 6.5 seconds total intro
  let droneAnimFrame = null;
  let audioContext = null;
  let isMuted = true;
  let ambientGain = null;

  // Layer Elements
  let layerAerial, layerApproach, layerInterior, doorsWrapper;
  let telemetryAlt, telemetryLoc, progressBar;
  let skipBtn, audioBtn, replayPill, enterBtn;
  let masterExperience, droneStage, necklaceStage;

  // Web Audio Synthesizer for ambient warmth & crystal showroom chime
  function initAudio() {
    if (audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();

      // Ambient low warm drone
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      ambientGain = audioContext.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, audioContext.currentTime); // A2 warm harmonic
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.8, audioContext.currentTime); // E3 fifth harmonic

      ambientGain.gain.setValueAtTime(isMuted ? 0 : 0.08, audioContext.currentTime);

      osc1.connect(ambientGain);
      osc2.connect(ambientGain);
      ambientGain.connect(audioContext.destination);

      osc1.start();
      osc2.start();
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  function playShowroomChime() {
    if (!audioContext || isMuted) return;
    try {
      const chimeOsc = audioContext.createOscillator();
      const chimeGain = audioContext.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
      chimeOsc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.6); // A5

      chimeGain.gain.setValueAtTime(0.12, audioContext.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(audioContext.destination);
      chimeOsc.start();
      chimeOsc.stop(audioContext.currentTime + 2.6);
    } catch (e) {}
  }

  function toggleAudio() {
    isMuted = !isMuted;
    if (!audioContext) initAudio();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (ambientGain && audioContext) {
      ambientGain.gain.setTargetAtTime(isMuted ? 0 : 0.08, audioContext.currentTime, 0.1);
    }
    if (audioBtn) {
      audioBtn.innerHTML = isMuted
        ? '<span class="material-symbols-outlined text-[16px]">volume_off</span><span>Sound</span>'
        : '<span class="material-symbols-outlined text-[16px] text-primary-fixed">volume_up</span><span>Sound On</span>';
    }
  }

  // Smooth easing functions
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // Drone flight animation loop
  function updateDroneFlight(timestamp) {
    if (!droneStartTime) droneStartTime = timestamp;
    const elapsed = timestamp - droneStartTime;
    const p = Math.min(1.0, elapsed / DRONE_DURATION);
    droneProgress = p;

    // Update bottom progress bar
    if (progressBar) {
      progressBar.style.width = `${p * 100}%`;
    }

    // -----------------------------------------------------------------
    // SCENE 1: Aerial Market View (p: 0.0 to 0.42)
    // -----------------------------------------------------------------
    if (p <= 0.42) {
      const t1 = p / 0.42;
      const smooth1 = easeInOutCubic(t1);

      // Camera descends from 28m down to 14m
      const alt = (28.4 - smooth1 * 14.4).toFixed(1);
      if (telemetryAlt) telemetryAlt.textContent = `ALT: ${alt}m • 24.8 FPS`;
      if (telemetryLoc) telemetryLoc.textContent = `Jagraon Market Overhead • Golden Hour`;

      // Scale & translate layer 1
      if (layerAerial) {
        layerAerial.style.opacity = '1';
        layerAerial.style.transform = `scale(${1.15 - smooth1 * 0.1}) translate3d(0, ${-3 + smooth1 * 5}%, 0)`;
      }
      if (layerApproach) layerApproach.style.opacity = '0';
      if (layerInterior) layerInterior.style.opacity = '0';
      if (doorsWrapper) doorsWrapper.classList.remove('active', 'doors-open');
    }

    // -----------------------------------------------------------------
    // SCENE 2: Approaching Rajput Jewellers on Anarkali Bazar Rd (p: 0.38 to 0.72)
    // -----------------------------------------------------------------
    else if (p > 0.38 && p <= 0.72) {
      const t2 = (p - 0.38) / 0.34;
      const smooth2 = easeInOutCubic(t2);

      // Cross-fade to approach layer
      if (layerAerial) layerAerial.style.opacity = `${Math.max(0, 1 - smooth2 * 2)}`;
      if (layerApproach) {
        layerApproach.style.opacity = `${Math.min(1, smooth2 * 1.8)}`;
        layerApproach.style.transform = `scale(${1.14 - smooth2 * 0.12}) translate3d(0, ${-2 + smooth2 * 3}%, 0)`;
      }

      const alt = (14.0 - smooth2 * 11.8).toFixed(1);
      if (telemetryAlt) telemetryAlt.textContent = `ALT: ${alt}m • DESCENDING`;
      if (telemetryLoc) telemetryLoc.textContent = `Anarkali Bazar Rd • Approaching Rajput Jewellers`;
    }

    // -----------------------------------------------------------------
    // SCENE 3: Eye Level, Doors Glide Open & Enter Showroom (p: 0.70 to 1.0)
    // -----------------------------------------------------------------
    else {
      const t3 = (p - 0.70) / 0.30;
      const smooth3 = easeOutQuad(t3);

      if (telemetryAlt) telemetryAlt.textContent = `ALT: 1.6m • SHOWROOM INTERIOR`;
      if (telemetryLoc) telemetryLoc.textContent = `Rajput Jewellers Flagship Showroom`;

      if (layerApproach) {
        layerApproach.style.opacity = `${Math.max(0, 1 - smooth3 * 1.5)}`;
      }

      if (layerInterior) {
        layerInterior.style.opacity = `${Math.min(1, smooth3 * 1.8)}`;
        layerInterior.style.transform = `scale(${1.08 - smooth3 * 0.06}) translate3d(0, ${smooth3 * 1.5}%, 0)`;
      }

      // Open showroom doors
      if (doorsWrapper) {
        doorsWrapper.classList.add('active');
        if (t3 > 0.15) {
          doorsWrapper.classList.add('doors-open');
        }
      }

      // Play welcoming crystal chime once
      if (t3 > 0.3 && !window._chimePlayed) {
        window._chimePlayed = true;
        playShowroomChime();
      }
    }

    // Finished Drone Sequence -> Transition to Necklace Assembly Stage
    if (p >= 1.0) {
      transitionToNecklaceStage();
      return;
    }

    droneAnimFrame = requestAnimationFrame(updateDroneFlight);
  }

  // Smooth transition from Drone sequence into 3D Necklace Assembly
  function transitionToNecklaceStage() {
    if (droneAnimFrame) cancelAnimationFrame(droneAnimFrame);
    currentStage = 'necklace';

    // Fade out drone viewport
    if (droneStage) {
      droneStage.style.opacity = '0';
      droneStage.style.pointerEvents = 'none';
    }

    // Activate 3D necklace stage
    if (necklaceStage) {
      necklaceStage.classList.add('active');
    }

    // Initialize 210-frame canvas scroll animation
    if (window.RajputNecklaceScroll && !window._necklaceInitialized) {
      window._necklaceInitialized = true;
      window.RajputNecklaceScroll.init();
    } else if (window.RajputNecklaceScroll) {
      window.RajputNecklaceScroll.reset();
    } else if (window.RajputNecklace3D && !window._necklaceInitialized) {
      window._necklaceInitialized = true;
      window.RajputNecklace3D.init();
    }
  }

  // Complete entire intro and seamlessly reveal existing homepage
  function completeAndRevealHomepage() {
    currentStage = 'homepage';

    // Fade and translate cinematic overlay out of view
    if (masterExperience) {
      masterExperience.classList.add('completed');
    }

    // Show replay pill on homepage
    if (replayPill) {
      replayPill.style.display = 'inline-flex';
    }

    // Ensure body allows normal scroll
    document.body.style.overflow = 'auto';

    // Scroll to top of homepage smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Stop 3D animation loop after transition completes to conserve GPU
    setTimeout(() => {
      if (masterExperience) {
        masterExperience.style.display = 'none';
      }
    }, 1200);
  }

  // Replay intro function
  function replayCinematic() {
    if (masterExperience) {
      masterExperience.style.display = 'block';
      // Force reflow
      masterExperience.offsetHeight;
      masterExperience.classList.remove('completed');
    }

    if (replayPill) {
      replayPill.style.display = 'none';
    }

    // Reset states
    window._chimePlayed = false;
    droneStartTime = null;
    droneProgress = 0;
    currentStage = 'drone';

    if (necklaceStage) necklaceStage.classList.remove('active');
    if (droneStage) {
      droneStage.style.opacity = '1';
      droneStage.style.pointerEvents = 'auto';
    }

    if (window.RajputNecklaceScroll) {
      window.RajputNecklaceScroll.reset();
    } else if (window.RajputNecklace3D) {
      window.RajputNecklace3D.setAssemblyStep(0);
    }

    droneAnimFrame = requestAnimationFrame(updateDroneFlight);
  }

  // DOM Content Loaded Initializer
  function init() {
    masterExperience = document.getElementById('rajput-cinematic-experience');
    droneStage = document.getElementById('drone-stage');
    necklaceStage = document.getElementById('necklace-stage');

    layerAerial = document.getElementById('layer-aerial');
    layerApproach = document.getElementById('layer-approach');
    layerInterior = document.getElementById('layer-interior');
    doorsWrapper = document.getElementById('showroom-doors');

    telemetryAlt = document.getElementById('telemetry-alt');
    telemetryLoc = document.getElementById('telemetry-loc');
    progressBar = document.getElementById('cinematic-progress');

    skipBtn = document.getElementById('skip-intro-btn');
    audioBtn = document.getElementById('audio-toggle-btn');
    enterBtn = document.getElementById('enter-showroom-btn');
    replayPill = document.getElementById('replay-cinematic-pill');

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (currentStage === 'drone') {
          transitionToNecklaceStage();
        } else {
          completeAndRevealHomepage();
        }
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener('click', toggleAudio);
    }

    if (enterBtn) {
      enterBtn.addEventListener('click', completeAndRevealHomepage);
    }

    if (replayPill) {
      replayPill.addEventListener('click', replayCinematic);
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Short-circuit to necklace or directly allow easy entrance
      if (telemetryAlt) telemetryAlt.textContent = `ALT: 1.6m • REDUCED MOTION`;
    }

    // Start drone animation
    droneAnimFrame = requestAnimationFrame(updateDroneFlight);
  }

  // Expose API
  window.RajputCinematic = {
    init: init,
    transitionToNecklaceStage: transitionToNecklaceStage,
    completeAndRevealHomepage: completeAndRevealHomepage,
    replayCinematic: replayCinematic
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
