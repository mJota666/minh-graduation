import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const COLORS = {
  ink: 0x071a2f,
  water: 0xf6efe0,
  campus: 0xf0e5d2,
  middle: 0xd9d0c2,
  road: 0x303a42,
  sidewalk: 0xd0c5b0,
  paving: 0x747876,
  building: 0xac7448,
  roof: 0xd9b286,
  hcmus: "#087c89",
  lhp: "#255bcb",
};

export function createCampusMap(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  container.querySelector(".map-loading")?.setAttribute("hidden", "");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.water);
  const camera = new THREE.OrthographicCamera(-15, 15, 20, -20, 0.1, 100);
  camera.up.set(0, 0, -1);
  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8c8274, 1.65));
  const sun = new THREE.DirectionalLight(0xfff7e9, 2);
  sun.position.set(-12, 24, 16);
  scene.add(sun);

  const root = new THREE.Group();
  scene.add(root);

  function slab(width, depth, x, z, color, height = .12) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0 }),
    );
    mesh.position.set(x, height / 2, z);
    root.add(mesh);
    return mesh;
  }

  function building(label, x, z, width, depth, height = 1.7) {
    const shadow = slab(width + .16, depth + .16, x + .06, z + .08, 0x5e5044, .18);
    shadow.material.transparent = true;
    shadow.material.opacity = .22;
    slab(width, depth, x, z, COLORS.building, height);
    const roof = slab(width + .08, depth + .08, x, z, COLORS.roof, .1);
    roof.position.y = height + .05;
    const compact = label.length > 7 ? .78 : 1;
    const labelSize = THREE.MathUtils.clamp(Math.min(width, depth) * .43, .54, .96) * compact;
    addLabel(label, x, z, height + .16, { size: labelSize });
  }

  function labelTexture(text, color, background) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (background) {
      context.fillStyle = background;
      context.fillRect(20, 18, 728, 124);
    }
    context.fillStyle = color;
    const fontSize = text.length > 18 ? 50 : text.length > 10 ? 64 : 94;
    context.font = `600 ${fontSize}px 'Be Vietnam Pro', sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 384, 82, 700);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function addLabel(text, x, z, y = .4, { size = 1.4, color = "#071a2f", background = null } = {}) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(text, color, background),
      transparent: true,
      depthTest: false,
    }));
    sprite.position.set(x, y, z);
    sprite.scale.set(size * 5.1, size * 1.15, 1);
    sprite.renderOrder = 10;
    root.add(sprite);
    return sprite;
  }

  slab(22.3, 18.64, -4.51, .92, COLORS.campus);
  slab(12.4, 3.2, -1.8, -15.1, COLORS.middle);
  slab(12.4, 5.2, -1.8, -19.4, COLORS.campus);
  slab(3.5, 43, 8.6, -4, COLORS.road, .1);
  slab(.9, 43, 6.35, -4, COLORS.sidewalk, .13);

  for (let z = -24; z <= 17; z += 2.2) slab(.08, 1.15, 8.6, z, 0xeaf7fb, .13);
  const roadLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 1.25),
    new THREE.MeshBasicMaterial({ map: labelTexture("NGUYỄN VĂN CỪ", "#ffffff"), transparent: true, depthWrite: false }),
  );
  roadLabel.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  roadLabel.position.set(8.6, .17, 3.8);
  root.add(roadLabel);

  building("LHP · 235", -1.8, -19.6, 9.2, 3.5, 2.15);
  building("NXB · 231", -1.8, -15.1, 9.2, 1.7, 1.1);

  // Trace the supplied plan in image coordinates. Rotate once so NVC is on the right.
  const planScale = .04;
  const planX = (imageY) => (imageY - 395) * planScale;
  const planZ = (imageX) => (275 - imageX) * planScale;
  function planRect(left, top, right, bottom) {
    return [
      planX((top + bottom) / 2),
      planZ((left + right) / 2),
      (bottom - top) * planScale,
      (right - left) * planScale,
    ];
  }

  const [schoolX, schoolZ, schoolWidth, schoolDepth] = planRect(0, 28, 28, 544);
  slab(schoolWidth, schoolDepth, schoolX, schoolZ, COLORS.middle, .15);
  addLabel("ĐH SƯ PHẠM", planX(294), schoolZ, .22, { size: .85 });

  [
    ["GD2", 48, 15, 105, 83, 1.05],
    ["H", 61, 118, 105, 170, .85],
    ["F", 108, 101, 427, 152, 1.5],
    ["CĂN TIN", 73, 180, 103, 336, .9],
    ["C", 130, 152, 165, 336, 1.45],
    ["B", 216, 152, 252, 336, 1.45],
    ["A", 318, 152, 352, 336, 1.45],
    ["E", 399, 152, 433, 336, 1.45],
    ["I", 128, 345, 228, 503, 2.05],
    ["GD1", 328, 381, 387, 438, 1.55],
    ["VP TT", 337, 438, 388, 495, .95],
    ["TT TIN", 418, 487, 466, 544, 1],
  ].forEach(([label, left, top, right, bottom, height]) => {
    building(label, ...planRect(left, top, right, bottom), height);
  });

  [
    [40, 92, 53, 173],
    [40, 173, 114, 186],
    [103, 186, 114, 512],
    [260, 171, 302, 340], // Courtyard between B and A.
    [114, 340, 416, 350],
    [259, 350, 302, 544], // Walkway in from the main gate.
    [117, 512, 259, 528],
    [302, 512, 416, 528],
    [398, 350, 416, 512], // Parking access beside GD1.
    [398, 528, 416, 544],
  ].forEach((bounds) => {
    const [x, z, width, depth] = planRect(...bounds);
    slab(width, depth, x, z, COLORS.paving, .15);
  });

  const trunkGeometry = new THREE.CylinderGeometry(.075, .11, .48, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x79573d, roughness: 1 });
  const crownGeometry = new THREE.IcosahedronGeometry(.46, 1);
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x528434, roughness: 1 });
  const meetingX = planX(465);
  const meetingZ = planZ(240);
  for (const imageX of [240, 314]) {
    const z = planZ(imageX);
    slab(5.6, .78, planX(424), z, 0x839f52, .16);
    for (let imageY = 365; imageY <= 485; imageY += 20) {
      const x = planX(imageY);
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, .37, z);
      const crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(x, .78, z);
      root.add(trunk, crown);
    }
  }
  const meetingRing = new THREE.Mesh(
    new THREE.RingGeometry(.56, .71, 32),
    new THREE.MeshBasicMaterial({ color: 0xf3bc42, side: THREE.DoubleSide }),
  );
  meetingRing.rotation.x = -Math.PI / 2;
  meetingRing.position.set(meetingX, .22, meetingZ);
  root.add(meetingRing);
  addLabel("ĐIỂM HẸN", meetingX - .3, meetingZ + .9, 1.15, {
    size: .82, background: "#ffe096",
  });

  const flagpole = new THREE.Mesh(
    new THREE.CylinderGeometry(.05, .1, .85, 12),
    new THREE.MeshStandardMaterial({ color: COLORS.ink, roughness: .7 }),
  );
  flagpole.position.set(planX(317), .52, planZ(286));
  root.add(flagpole);
  const flag = slab(.12, .44, flagpole.position.x, planZ(291), 0xc03e35, .25);
  flag.position.y = .87;
  addLabel("CỘT CỜ", flagpole.position.x, flagpole.position.z, 1, { size: .57, background: "#f6efe0" });

  const mainGateZ = planZ(280);
  const parkingGateZ = planZ(406);
  [[30, 97], [115, 259], [302, 393]].forEach(([left, right]) => {
    slab(.1, (right - left) * planScale, planX(530), planZ((left + right) / 2), COLORS.ink, .38);
  });
  slab(1, 1.72, 6.35, mainGateZ, COLORS.paving, .16);
  addLabel("CỔNG CHÍNH", 5.06, mainGateZ, .55, { size: .74, background: "#f6efe0" });

  function parkingMarker(label, x, z, labelX = x - 1.25, labelZ = z) {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(.48, .48, .16, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.ink, roughness: .7 }),
    );
    marker.position.set(x, .28, z);
    root.add(marker);
    addLabel("P", x, z, .75, { size: .72, color: "#ffffff" });
    if (label) addLabel(label, labelX, labelZ, .55, { size: label.includes("LHP") ? .78 : .58, background: "rgba(248,252,255,.9)" });
  }

  slab(1.45, 1.1, 6.05, parkingGateZ, COLORS.paving, .16);
  parkingMarker("BÃI XE", 6.05, parkingGateZ, 4.25, parkingGateZ);

  const lhpGateZ = -18.6;
  const ramp = slab(2.15, 1.9, 5.05, lhpGateZ, 0x536b78, .18);
  ramp.rotation.z = -.09;
  parkingMarker("CỔNG HẦM LHP", 5.05, lhpGateZ, 3.25, -17.5);

  function routeLine(points, color, dashed = false) {
    const xs = points.map(([x]) => x);
    const zs = points.map(([, z]) => z);
    const minX = Math.min(...xs) - .4;
    const minZ = Math.min(...zs) - .4;
    const width = Math.max(...xs) - minX + .4;
    const depth = Math.max(...zs) - minZ + .4;
    const pixelsPerUnit = 48;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * pixelsPerUnit);
    canvas.height = Math.ceil(depth * pixelsPerUnit);
    const context = canvas.getContext("2d");
    context.scale(canvas.width / width, canvas.height / depth);
    context.lineCap = "round";
    context.lineJoin = "round";
    points.forEach(([x, z], index) => {
      if (index === 0) context.moveTo(x - minX, z - minZ);
      else context.lineTo(x - minX, z - minZ);
    });

    if (dashed) context.setLineDash([.5, .38]);
    context.strokeStyle = "#fff9ef";
    context.lineWidth = dashed ? .33 : .52;
    context.stroke();
    context.strokeStyle = color;
    context.lineWidth = dashed ? .2 : .33;
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(minX + width / 2, dashed ? .29 : .24, minZ + depth / 2);
    line.renderOrder = dashed ? 2 : 1;
    return line;
  }

  function makeRoute(entry, walk, color) {
    const group = new THREE.Group();
    group.add(routeLine(entry, color), routeLine(walk, color, true));
    root.add(group);
    const path = new THREE.CurvePath();
    const waypoints = walk.map(([x, z]) => new THREE.Vector3(x, .95, z));
    waypoints.slice(1).forEach((point, index) => {
      path.add(new THREE.LineCurve3(waypoints[index], point));
    });
    return { group, path, duration: path.getLength() / 2.65 };
  }

  const arrival = [[meetingX, mainGateZ], [meetingX, meetingZ - .48]];
  const routes = {
    hcmus: makeRoute(
      [[9.8, parkingGateZ], [6.05, parkingGateZ]],
      [[5.58, parkingGateZ], [5, parkingGateZ], [5, mainGateZ], ...arrival],
      COLORS.hcmus,
    ),
    lhp: makeRoute(
      [[9.8, lhpGateZ], [5.05, lhpGateZ]],
      [[5.5, lhpGateZ], [6.53, lhpGateZ], [6.53, mainGateZ], ...arrival],
      COLORS.lhp,
    ),
  };

  function walkerFrame(stride) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(31, 25);
    context.lineTo(29, 39);
    context.lineTo(29 - stride, 48);
    context.lineTo(29 - stride * 1.5, 56);
    context.moveTo(29, 39);
    context.lineTo(31 + stride, 49);
    context.lineTo(31 + stride * 1.4, 56);
    context.moveTo(25 - stride, 39);
    context.lineTo(31, 25);
    context.lineTo(37 + stride, 37);
    context.strokeStyle = "#fff9ef";
    context.lineWidth = 10;
    context.stroke();
    context.strokeStyle = "#071a2f";
    context.lineWidth = 5.5;
    context.stroke();
    context.beginPath();
    context.arc(33, 14, 6.5, 0, Math.PI * 2);
    context.fillStyle = "#fff9ef";
    context.fill();
    context.beginPath();
    context.arc(33, 14, 4.8, 0, Math.PI * 2);
    context.fillStyle = "#071a2f";
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const walkerFrames = [0, 5, 9, 5, 0, -5, -9, -5].map(walkerFrame);
  const walker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: walkerFrames[0], transparent: true, depthTest: false, depthWrite: false,
  }));
  walker.scale.set(2.4, 2.4, 1);
  walker.renderOrder = 11;
  root.add(walker);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeRoute = "hcmus";
  let isVisible = false;
  let lastFrame = null;
  let walkTime = 0;
  let walkFacing = 1;

  function setRoute(route) {
    activeRoute = route;
    container.dataset.route = route;
    Object.entries(routes).forEach(([name, value]) => { value.group.visible = name === route; });
    walkTime = motion.matches ? routes[route].duration : 0;
    walkFacing = 1;
    lastFrame = null;
    updateWalker();
    resize();
  }

  function updateCamera() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const aspect = width / height;
    const overview = activeRoute === "lhp";
    const centerX = -2.5;
    const centerZ = overview ? -6.4 : .9;
    const halfHeight = Math.max(overview ? 17.5 : 10, 13.6 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.position.set(centerX, 38, centerZ + 7);
    camera.lookAt(centerX, 0, centerZ);
    camera.updateProjectionMatrix();
  }

  function resize() {
    updateCamera();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  new ResizeObserver(resize).observe(container);

  function updateWalker() {
    const { path, duration } = routes[activeRoute];
    const progress = walkTime / duration;
    walker.position.copy(path.getPoint(progress));
    const direction = path.getTangent(progress);
    if (Math.abs(direction.x) > .1) walkFacing = Math.sign(direction.x);
    const step = Math.floor(walkTime * 12) % walkerFrames.length;
    const frame = walkerFrames[progress === 1 ? 0 : step];
    frame.repeat.x = walkFacing;
    frame.offset.x = walkFacing < 0 ? 1 : 0;
    walker.material.map = frame;
  }

  function draw(now) {
    requestAnimationFrame(draw);
    if (!isVisible) return;
    const { duration } = routes[activeRoute];
    if (walkTime >= duration) return;
    walkTime = motion.matches ? duration : Math.min(duration, walkTime + (now - (lastFrame ?? now)) / 1000);
    lastFrame = now;
    updateWalker();
    renderer.render(scene, camera);
  }

  new IntersectionObserver(([entry]) => {
    isVisible = entry.intersectionRatio >= .25;
    lastFrame = null;
  }, { threshold: .25 }).observe(container);
  setRoute("hcmus");
  requestAnimationFrame(draw);

  return { setRoute };
}
