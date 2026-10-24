/**
 * ROYAL JEWELLERS - 3D ROYAL KUNDAN POLKI BRIDAL NECKLACE ASSEMBLY
 * High-fidelity WebGL / Three.js Interactive Component
 */

(function () {
  'use strict';

  let scene, camera, renderer, container;
  let componentGroups = {};
  let currentStep = 0; // 0: fully exploded, 1-5: assembly phases
  let targetProgress = 0; // 0 to 1 smooth interpolation
  let currentProgress = 0;
  let isAssembled = false;
  let animationFrameId = null;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Assembly Step Metadata for UI HUD
  const STEP_DETAILS = [
    {
      step: 0,
      title: "Handcrafted 22KT Heirloom Components",
      desc: "Individual karigari elements floating in 3D showroom space. Scroll down to begin assembly.",
      badge: "Exploded View"
    },
    {
      step: 1,
      title: "Gold Collar Framework & Choker Lattice",
      desc: "Hallmarked 916 yellow gold collar plates converge into the anatomical bridal neckline arc.",
      badge: "Phase 1 / 5"
    },
    {
      step: 2,
      title: "Imperial Central Kundan Medallion",
      desc: "Grand multi-tier royal pendant with Columbian emerald center cabochon docks into place.",
      badge: "Phase 2 / 5"
    },
    {
      step: 3,
      title: "Flanking Polki & Meenakari Floral Links",
      desc: "Symmetrical handcrafted floral clusters with uncut diamonds align along the bib framework.",
      badge: "Phase 3 / 5"
    },
    {
      step: 4,
      title: "Natural Basra Pearl Droplet Fringe",
      desc: "Lustrous teardrop pearls and emerald briolettes cascade upward to lock into suspension rings.",
      badge: "Phase 4 / 5"
    },
    {
      step: 5,
      title: "Heirloom Bridal Suite Complete",
      desc: "Imperial Kundan Polki masterpiece unified in pure 22KT gold. Ready for the bridal trousseau.",
      badge: "Masterpiece Unified"
    }
  ];

  // Material Palette
  let gold22kMaterial, polkiDiamondMaterial, emeraldMaterial, pearlMaterial, meenakariRedMaterial;

  function initMaterials() {
    // 22K Royal Yellow Gold
    gold22kMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb13b,
      metalness: 0.94,
      roughness: 0.22,
      envMapIntensity: 1.5
    });

    // Uncut Polki Diamonds / Kundan Glass
    polkiDiamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      ior: 2.4,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    // Columbian Emeralds
    emeraldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x097a48,
      metalness: 0.2,
      roughness: 0.12,
      transmission: 0.75,
      ior: 1.6,
      clearcoat: 0.8
    });

    // Natural Basra Iridescent Pearls
    pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfffcf5,
      metalness: 0.15,
      roughness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xffe6e6)
    });

    // Royal Ruby-Red Meenakari Enamel
    meenakariRedMaterial = new THREE.MeshStandardMaterial({
      color: 0x931328,
      metalness: 0.5,
      roughness: 0.28
    });
  }

  // Create an ornate Kundan bezel gem unit
  function createKundanGemUnit(radius, depth, isEmerald) {
    const unit = new THREE.Group();

    // Gold Bezel Cup
    const bezelGeo = new THREE.CylinderGeometry(radius, radius * 0.9, depth, 16);
    const bezel = new THREE.Mesh(bezelGeo, gold22kMaterial);
    bezel.rotation.x = Math.PI / 2;
    unit.add(bezel);

    // Decorative Gold Rim Filigree
    const rimGeo = new THREE.TorusGeometry(radius * 1.05, radius * 0.12, 8, 20);
    const rim = new THREE.Mesh(rimGeo, gold22kMaterial);
    unit.add(rim);

    // Gemstone Face (Polki or Emerald)
    const gemGeo = new THREE.CylinderGeometry(radius * 0.88, radius * 0.82, depth * 0.6, 12);
    const gem = new THREE.Mesh(gemGeo, isEmerald ? emeraldMaterial : polkiDiamondMaterial);
    gem.rotation.x = Math.PI / 2;
    gem.position.z = depth * 0.25;
    unit.add(gem);

    return unit;
  }

  // Create a hanging Basra pearl droplet
  function createPearlDroplet(length) {
    const group = new THREE.Group();

    // Top gold loop
    const loopGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    const loop = new THREE.Mesh(loopGeo, gold22kMaterial);
    loop.position.y = 0.15;
    group.add(loop);

    // Gold cap with granulation
    const capGeo = new THREE.ConeGeometry(0.22, 0.25, 12);
    const cap = new THREE.Mesh(capGeo, gold22kMaterial);
    cap.rotation.x = Math.PI;
    cap.position.y = 0;
    group.add(cap);

    // Pearl Teardrop body
    const pearlGeo = new THREE.SphereGeometry(0.28, 24, 24);
    // Scale to pear/teardrop shape
    pearlGeo.scale(1, 1.45, 1);
    const pearl = new THREE.Mesh(pearlGeo, pearlMaterial);
    pearl.position.y = -0.42;
    group.add(pearl);

    // Bottom tiny gold ball finial
    const finialGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const finial = new THREE.Mesh(finialGeo, gold22kMaterial);
    finial.position.y = -0.85;
    group.add(finial);

    return group;
  }

  // Build the complete 5-part necklace structure
  function buildNecklace() {
    const root = new THREE.Group();
    root.name = "NecklaceMaster";

    // -------------------------------------------------------------
    // GROUP 1: Gold Collar Choker Framework (Left and Right Arcs)
    // -------------------------------------------------------------
    const collarGroup = new THREE.Group();
    collarGroup.name = "CollarFramework";

    const leftCollar = new THREE.Group();
    const rightCollar = new THREE.Group();

    const arcRadius = 4.2;
    const numGems = 11;
    const startAngle = Math.PI * 0.2;
    const endAngle = Math.PI * 0.8;

    for (let i = 0; i <= numGems; i++) {
      const t = i / numGems;
      const angle = startAngle + t * (endAngle - startAngle);
      const x = Math.cos(angle) * arcRadius;
      const y = Math.sin(angle) * (arcRadius * 0.75) - 1.2;

      const gemUnit = createKundanGemUnit(0.32, 0.16, i % 3 === 0);
      gemUnit.position.set(x, y, 0);
      gemUnit.rotation.z = angle - Math.PI / 2;

      // Gold connecting tube link between gems
      if (i < numGems) {
        const nextT = (i + 1) / numGems;
        const nextAngle = startAngle + nextT * (endAngle - startAngle);
        const nextX = Math.cos(nextAngle) * arcRadius;
        const nextY = Math.sin(nextAngle) * (arcRadius * 0.75) - 1.2;

        const linkGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
        const link = new THREE.Mesh(linkGeo, gold22kMaterial);
        link.position.set((x + nextX) / 2, (y + nextY) / 2, -0.05);
        link.rotation.z = Math.atan2(nextY - y, nextX - x) - Math.PI / 2;

        if (x < 0) leftCollar.add(link);
        else rightCollar.add(link);
      }

      if (x < 0) leftCollar.add(gemUnit);
      else rightCollar.add(gemUnit);
    }

    collarGroup.add(leftCollar);
    collarGroup.add(rightCollar);
    root.add(collarGroup);

    // -------------------------------------------------------------
    // GROUP 2: Imperial Central Royal Kundan Medallion (Centerpiece)
    // -------------------------------------------------------------
    const centerMedallionGroup = new THREE.Group();
    centerMedallionGroup.name = "CentralMedallion";

    // Big central emerald cabochon
    const centerEmerald = createKundanGemUnit(0.72, 0.28, true);
    centerMedallionGroup.add(centerEmerald);

    // Concentric halo of 10 Polki diamonds
    const haloCount = 10;
    const haloRadius = 1.35;
    for (let h = 0; h < haloCount; h++) {
      const phi = (h / haloCount) * Math.PI * 2;
      const hx = Math.cos(phi) * haloRadius;
      const hy = Math.sin(phi) * haloRadius;

      const haloGem = createKundanGemUnit(0.28, 0.15, false);
      haloGem.position.set(hx, hy, -0.05);
      haloGem.rotation.z = phi;
      centerMedallionGroup.add(haloGem);

      // Gold scalloped filigree petal tip
      const petalGeo = new THREE.ConeGeometry(0.18, 0.35, 6);
      const petal = new THREE.Mesh(petalGeo, gold22kMaterial);
      petal.position.set(hx * 1.28, hy * 1.28, -0.08);
      petal.rotation.z = phi - Math.PI / 2;
      centerMedallionGroup.add(petal);
    }

    // Lower chandelier pendant flourish
    const lowerDropBase = createKundanGemUnit(0.45, 0.2, true);
    lowerDropBase.position.set(0, -2.1, 0);
    centerMedallionGroup.add(lowerDropBase);

    // Link rod between central medallion and lower drop
    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const rod = new THREE.Mesh(rodGeo, gold22kMaterial);
    rod.position.set(0, -1.35, 0);
    centerMedallionGroup.add(rod);

    root.add(centerMedallionGroup);

    // -------------------------------------------------------------
    // GROUP 3: Flanking Polki & Meenakari Floral Links (Left & Right)
    // -------------------------------------------------------------
    const sideMedallionsGroup = new THREE.Group();
    sideMedallionsGroup.name = "SideMedallions";

    const sidePositions = [
      { x: -1.75, y: -0.85, s: 0.85 },
      { x: -3.05, y: -0.25, s: 0.72 },
      { x: 1.75, y: -0.85, s: 0.85 },
      { x: 3.05, y: -0.25, s: 0.72 }
    ];

    sidePositions.forEach((pos) => {
      const cluster = new THREE.Group();
      cluster.position.set(pos.x, pos.y, 0);
      cluster.scale.set(pos.s, pos.s, pos.s);

      // Floral center
      const cGem = createKundanGemUnit(0.42, 0.2, true);
      cluster.add(cGem);

      // 6 surrounding petals
      for (let p = 0; p < 6; p++) {
        const pAngle = (p / 6) * Math.PI * 2;
        const px = Math.cos(pAngle) * 0.75;
        const py = Math.sin(pAngle) * 0.75;
        const pGem = createKundanGemUnit(0.22, 0.12, false);
        pGem.position.set(px, py, -0.04);
        pGem.rotation.z = pAngle;
        cluster.add(pGem);
      }

      sideMedallionsGroup.add(cluster);
    });

    root.add(sideMedallionsGroup);

    // -------------------------------------------------------------
    // GROUP 4: Basra Pearl Droplets (Hanging Fringe)
    // -------------------------------------------------------------
    const pearlDropsGroup = new THREE.Group();
    pearlDropsGroup.name = "PearlDrops";

    // 17 anchor points across the lower boundary of the necklace
    const pearlAnchors = [
      { x: 0, y: -2.8 },
      { x: -0.5, y: -2.4 }, { x: 0.5, y: -2.4 },
      { x: -1.1, y: -2.1 }, { x: 1.1, y: -2.1 },
      { x: -1.75, y: -1.8 }, { x: 1.75, y: -1.8 },
      { x: -2.4, y: -1.5 }, { x: 2.4, y: -1.5 },
      { x: -3.05, y: -1.15 }, { x: 3.05, y: -1.15 },
      { x: -3.7, y: -0.7 }, { x: 3.7, y: -0.7 },
      { x: -4.3, y: -0.2 }, { x: 4.3, y: -0.2 }
    ];

    pearlAnchors.forEach((pt, idx) => {
      const drop = createPearlDroplet();
      drop.position.set(pt.x, pt.y, 0.05);
      drop.userData = {
        anchorX: pt.x,
        anchorY: pt.y,
        // Individual exploded offset
        explodeX: (Math.random() - 0.5) * 8,
        explodeY: -4.5 - Math.random() * 3,
        explodeZ: 3 + Math.random() * 4,
        explodeRotX: (Math.random() - 0.5) * 2,
        explodeRotY: (Math.random() - 0.5) * 2
      };
      pearlDropsGroup.add(drop);
    });

    root.add(pearlDropsGroup);

    // -------------------------------------------------------------
    // GROUP 5: Filigree Clasp & Ceremonial Golden Dori
    // -------------------------------------------------------------
    const doriClaspGroup = new THREE.Group();
    doriClaspGroup.name = "DoriClasp";

    // Traditional silk thread cord curve at top back
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 1.8, -0.5),
      new THREE.Vector3(-2.8, 3.2, -1.8),
      new THREE.Vector3(0, 3.8, -2.4),
      new THREE.Vector3(2.8, 3.2, -1.8),
      new THREE.Vector3(4.2, 1.8, -0.5)
    ]);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 40, 0.09, 12, false);
    const cord = new THREE.Mesh(cordGeo, gold22kMaterial);
    doriClaspGroup.add(cord);

    // Peacock / ornamental finial clasps at collar endpoints
    [-4.2, 4.2].forEach((cx) => {
      const claspGeo = new THREE.SphereGeometry(0.28, 12, 12);
      claspGeo.scale(1, 1.6, 0.7);
      const clasp = new THREE.Mesh(claspGeo, gold22kMaterial);
      clasp.position.set(cx, 1.8, -0.5);
      doriClaspGroup.add(clasp);
    });

    root.add(doriClaspGroup);

    // Store component references for dynamic animation
    componentGroups = {
      root: root,
      collar: collarGroup,
      leftCollar: leftCollar,
      rightCollar: rightCollar,
      centralMedallion: centerMedallionGroup,
      sideMedallions: sideMedallionsGroup,
      pearlDrops: pearlDropsGroup,
      doriClasp: doriClaspGroup
    };

    return root;
  }

  // Define Disassembled (Exploded) vs Assembled Transformations
  function applyExplodedTransforms(t) {
    // t is 0.0 (fully exploded) to 1.0 (fully assembled)
    const invT = 1.0 - t;

    // Phase 1: Collar Lattice (assembles from t: 0.0 to 0.35)
    const p1 = Math.min(1.0, Math.max(0.0, t / 0.35));
    const invP1 = 1.0 - p1;
    if (componentGroups.leftCollar && componentGroups.rightCollar) {
      componentGroups.leftCollar.position.set(-4.5 * invP1, 2.2 * invP1, -2.0 * invP1);
      componentGroups.leftCollar.rotation.set(-0.35 * invP1, 0.45 * invP1, -0.4 * invP1);

      componentGroups.rightCollar.position.set(4.5 * invP1, 2.2 * invP1, -2.0 * invP1);
      componentGroups.rightCollar.rotation.set(-0.35 * invP1, -0.45 * invP1, 0.4 * invP1);
    }

    // Phase 2: Central Medallion (assembles from t: 0.20 to 0.55)
    const p2 = Math.min(1.0, Math.max(0.0, (t - 0.2) / 0.35));
    const invP2 = 1.0 - p2;
    if (componentGroups.centralMedallion) {
      componentGroups.centralMedallion.position.set(0, -0.45 - 4.5 * invP2, 3.8 * invP2);
      componentGroups.centralMedallion.rotation.set(0.7 * invP2, 0, 0.25 * invP2);
    }

    // Phase 3: Flanking Medallions (assembles from t: 0.40 to 0.75)
    const p3 = Math.min(1.0, Math.max(0.0, (t - 0.4) / 0.35));
    const invP3 = 1.0 - p3;
    if (componentGroups.sideMedallions) {
      componentGroups.sideMedallions.position.set(0, -1.8 * invP3, 2.5 * invP3);
      componentGroups.sideMedallions.children.forEach((child, i) => {
        const sideSign = i < 2 ? -1 : 1;
        child.position.x = child.position.x + sideSign * 2.2 * invP3;
        child.rotation.z = child.rotation.z + sideSign * 0.6 * invP3;
      });
    }

    // Phase 4: Pearl Droplets (assembles from t: 0.60 to 0.90)
    const p4 = Math.min(1.0, Math.max(0.0, (t - 0.6) / 0.3));
    const invP4 = 1.0 - p4;
    if (componentGroups.pearlDrops) {
      componentGroups.pearlDrops.children.forEach((drop) => {
        const ud = drop.userData;
        drop.position.set(
          ud.anchorX + ud.explodeX * invP4,
          ud.anchorY + ud.explodeY * invP4,
          0.05 + ud.explodeZ * invP4
        );
        drop.rotation.set(ud.explodeRotX * invP4, ud.explodeRotY * invP4, 0);
      });
    }

    // Phase 5: Dori Clasp & Final Lock (assembles from t: 0.75 to 1.0)
    const p5 = Math.min(1.0, Math.max(0.0, (t - 0.75) / 0.25));
    const invP5 = 1.0 - p5;
    if (componentGroups.doriClasp) {
      componentGroups.doriClasp.position.set(0, 3.5 * invP5, -3.2 * invP5);
      componentGroups.doriClasp.scale.set(1 + 0.4 * invP5, 1 + 0.4 * invP5, 1);
    }

    // Subtle breathing rotation & gentle tilt of entire necklace in 3D
    if (componentGroups.root) {
      const time = performance.now() * 0.0012;
      const floatX = Math.sin(time) * 0.06;
      const floatY = Math.cos(time * 0.8) * 0.08;

      componentGroups.root.rotation.x = floatX + mouse.y * 0.25;
      componentGroups.root.rotation.y = floatY + mouse.x * 0.35;
      componentGroups.root.position.y = 0.2 + (t >= 0.95 ? Math.sin(time * 2) * 0.05 : 0);
    }
  }

  // Update UI HUD text & progress dots
  function updateHUD(stepIndex) {
    const meta = STEP_DETAILS[stepIndex] || STEP_DETAILS[0];
    const badgeEl = document.getElementById('assembly-step-badge');
    const titleEl = document.getElementById('assembly-step-title');
    const descEl = document.getElementById('assembly-step-desc');
    const enterBtn = document.getElementById('enter-showroom-btn');

    if (badgeEl) badgeEl.textContent = meta.badge;
    if (titleEl) titleEl.textContent = meta.title;
    if (descEl) descEl.textContent = meta.desc;

    // Update step dots
    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      if (dot) {
        dot.classList.remove('active', 'completed');
        if (i === stepIndex) dot.classList.add('active');
        else if (i < stepIndex) dot.classList.add('completed');
      }
    }

    // Reveal Enter Showroom button at step 5
    if (enterBtn) {
      if (stepIndex >= 5) {
        enterBtn.classList.add('visible');
        isAssembled = true;
      } else {
        enterBtn.classList.remove('visible');
      }
    }
  }

  // Public jump-to-step method (1 to 5)
  function setAssemblyStep(step) {
    currentStep = Math.max(0, Math.min(5, step));
    targetProgress = currentStep / 5.0;
    updateHUD(currentStep);
  }

  // Render loop
  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Smooth lerp progress towards target
    currentProgress += (targetProgress - currentProgress) * 0.085;

    // Smooth mouse parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    applyExplodedTransforms(currentProgress);

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Handle window resizing
  function onWindowResize() {
    if (!container || !camera || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Mouse / Touch Parallax listener
  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouse.targetX = (clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(clientY / window.innerHeight - 0.5) * 2;
  }

  // Scroll wheel event handler for assembly progression
  let scrollAccumulator = 0;
  const SCROLL_THRESHOLD = 90;

  function onWheelScroll(e) {
    // Only intercept when necklace stage is active
    const stage = document.getElementById('necklace-stage');
    if (!stage || !stage.classList.contains('active')) return;

    // Prevent default scroll during intro stage
    e.preventDefault();

    scrollAccumulator += e.deltaY;

    if (scrollAccumulator > SCROLL_THRESHOLD) {
      scrollAccumulator = 0;
      if (currentStep < 5) {
        setAssemblyStep(currentStep + 1);
      } else {
        // Complete transition to existing homepage
        window.RoyalCinematic && window.RoyalCinematic.completeAndRevealHomepage();
      }
    } else if (scrollAccumulator < -SCROLL_THRESHOLD) {
      scrollAccumulator = 0;
      if (currentStep > 0) {
        setAssemblyStep(currentStep - 1);
      }
    }
  }

  // Touch swipe support for mobile
  let touchStartY = 0;
  function onTouchStart(e) {
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    const stage = document.getElementById('necklace-stage');
    if (!stage || !stage.classList.contains('active')) return;

    if (e.touches && e.touches[0]) {
      const touchEndY = e.touches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 40) {
        e.preventDefault();
        touchStartY = touchEndY;
        if (diffY > 0) {
          if (currentStep < 5) setAssemblyStep(currentStep + 1);
          else window.RoyalCinematic && window.RoyalCinematic.completeAndRevealHomepage();
        } else {
          if (currentStep > 0) setAssemblyStep(currentStep - 1);
        }
      }
    }
  }

  // Initialize Three.js scene
  function init() {
    container = document.getElementById('necklace-canvas-container');
    if (!container) return;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Focal length tuned for macro jewellery showcase)
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    // 3. Renderer with luxury physical lighting
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    initMaterials();

    // Warm Key Light (Spotlight on gold and Kundan gems)
    const keyLight = new THREE.DirectionalLight(0xffecc2, 2.6);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    // Cool Diamond Sparkle Light
    const sparkleLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sparkleLight.position.set(-5, -2, 7);
    scene.add(sparkleLight);

    // Rim Silhouette Light
    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.8);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Ambient Warm Room Bounce
    const ambientLight = new THREE.AmbientLight(0x2d2216, 1.4);
    scene.add(ambientLight);

    // 5. Build 3D Model
    const necklace = buildNecklace();
    scene.add(necklace);

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('wheel', onWheelScroll, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // Step dots click handler
    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      if (dot) {
        dot.addEventListener('click', () => setAssemblyStep(i));
      }
    }

    // Set initial exploded state
    setAssemblyStep(0);

    // Start render loop
    animate();
  }

  // Expose API
  window.RoyalNecklace3D = {
    init: init,
    setAssemblyStep: setAssemblyStep,
    nextStep: () => setAssemblyStep(currentStep + 1),
    prevStep: () => setAssemblyStep(currentStep - 1),
    getIsAssembled: () => isAssembled,
    destroy: () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('wheel', onWheelScroll);
    }
  };
})();
