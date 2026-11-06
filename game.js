import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const canvas = document.querySelector('#game');
const shell = document.querySelector('#game-shell');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('mobile');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a5a58e');
scene.fog = new THREE.FogExp2('#9a9a83', 0.0085);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.08, 240);
camera.position.set(0, 2.02, 4.2);
scene.add(camera);
const player = { x: 0, yaw: 0, pitch: -0.035 };
const ambient = new THREE.HemisphereLight('#e2d9bf', '#35352b', 2.05);
scene.add(ambient);
const sun = new THREE.DirectionalLight('#f0d7a2', 2.6);
sun.position.set(-16, 24, 16); scene.add(sun);

const mat = (color, roughness = .92, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const dirt = mat('#594c3a'), dirtLight = mat('#79664a'), sand = mat('#a49776'), sandHi = mat('#b8a783'), sandShade = mat('#81745c');
const groundMat = mat('#71684f');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 240), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.02, -62); scene.add(ground);

// Soft, layered ridgelines ground the battlefield in a broad, hazy horizon.
function ridge(z, width, height, color, phase) {
  const points = [], indices = [], count = 100;
  for (let i = 0; i <= count; i++) {
    const x = -width / 2 + width * i / count;
    const y = 2.4 + Math.sin(i * .15 + phase) * height * .38 + Math.sin(i * .047 + phase * 2) * height * .32 + Math.sin(i * .34 + phase) * height * .12;
    points.push(x, y, z, x, -1.6, z);
    if (i < count) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide })); scene.add(mesh);
}
ridge(-92, 250, 13, '#686a59', 1.2); ridge(-77, 220, 8, '#777966', 3.5); ridge(-57, 210, 4, '#878674', 0.2);

// Uneven shell-pocked no-man's-land, scattered with low poly debris.
const rand = (a, b) => a + Math.random() * (b - a);
for (let i = 0; i < 36; i++) {
  const x = rand(-35, 35), z = rand(-49, -5), r = rand(.35, 1.25);
  const crater = new THREE.Mesh(new THREE.CircleGeometry(r, 9), mat(i % 2 ? '#5d5746' : '#655d49'));
  crater.rotation.x = -Math.PI / 2; crater.position.set(x, .012, z); crater.scale.y = rand(.45, .8); scene.add(crater);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * .85, .09, 4, 10), dirtLight);
  rim.rotation.x = Math.PI / 2; rim.position.set(x, .07, z); rim.scale.y = .65; scene.add(rim);
}
for (let i = 0; i < 56; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.1, .34), 0), i % 2 ? dirt : sandShade);
  rock.position.set(rand(-30, 30), .08, rand(-48, -3)); rock.scale.set(rand(.8, 2), rand(.35, .9), rand(.8, 1.6)); rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); scene.add(rock);
}

// The sandbagged firing step, with timber bracing and a close earthen trench.
const box = (w, h, d, material, x, y, z, parent = scene) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y, z); parent.add(m); return m;
};
// Earthen berm on the far side of the firing lip.
box(24, 1.15, 1.05, dirt, 0, -.38, -2.0);
for (let row = 0; row < 2; row++) {
  const y = .47 + row * .38, shift = row % 2 ? 0 : .46;
  for (let x = -12.4 + shift; x < 12.5; x += .95) {
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .48, 3, 7), row === 2 ? sandHi : sand);
    bag.rotation.z = Math.PI / 2; bag.scale.set(1, .85, .78); bag.position.set(x, y, -2.48 + (Math.random() - .5) * .06); scene.add(bag);
  }
}
// Left and right trench walls run behind the player; timber planks interrupt the earth.
for (const side of [-1, 1]) {
  box(.9, 2.15, 17, dirt, side * 4.5, -.05, 2.0);
  for (let z = -5.7; z < 10; z += .95) {
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .48, 3, 7), z % 2 ? sand : sandShade);
    bag.rotation.z = Math.PI / 2; bag.scale.set(1, .85, .82); bag.position.set(side * 4.15, .95, z); scene.add(bag);
  }
  for (let z = -4; z < 10; z += 3.2) {
    const plank = box(.14, 2.5, .18, mat('#493c2e'), side * 3.7, .07, z);
    plank.rotation.z = side * -.045;
    const brace = box(.15, .15, 1.2, mat('#554432'), side * 4.05, -.68, z + .44); brace.rotation.y = side * .06;
  }
}
// Muddy trench floor, stepping boards and ammunition crate details.
box(7.5, .18, 19, mat('#403a2e'), 0, -.92, 2.1);
for (let i = 0; i < 13; i++) {
  const plank = box(rand(1.7, 3.1), .07, .27, mat(i % 2 ? '#776345' : '#6a573c'), rand(-2.7, 2.7), -.79, rand(-5, 10));
  plank.rotation.y = rand(-.07, .07);
}
const crate = new THREE.Group(); scene.add(crate);
box(.8, .7, .8, mat('#5d4d36'), -3.1, -.43, 4.4, crate);
for (let i = 0; i < 4; i++) box(.83, .06, .12, mat('#89734b'), -3.1, -.7 + i * .18, 3.98, crate);
// Rough firing notch, a few dark stakes and wires across the distant earth.
for (let i = 0; i < 8; i++) {
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(.035, .07, rand(1.1, 2), 5), mat('#3c382c'));
  stake.position.set(rand(-16, 16), .5, rand(-34, -13)); stake.rotation.z = rand(-.22, .22); scene.add(stake);
}

// First-person MG-08 replica built from low-poly metal forms and attached to the camera.
const gun = new THREE.Group(); camera.add(gun); gun.position.set(.4, -.34, -.72);
const metal = mat('#30332e', .48, { metalness: .48 }), metalEdge = mat('#55564c', .44, { metalness: .52 }), wood = mat('#55402e', .8), darkMetal = mat('#1b201d', .38, { metalness: .6 });
const gunBox = (w, h, d, material, x, y, z) => box(w, h, d, material, x, y, z, gun);
gunBox(.23, .24, .48, metal, 0, -.07, -.15);
gunBox(.16, .14, .43, wood, -.02, -.25, -.33);
gunBox(.12, .13, .52, metalEdge, .0, .12, -.15);
gunBox(.09, .09, .48, darkMetal, .0, .13, -.48);
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.04, .055, .8, 10), metalEdge); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .13, -.78); gun.add(barrel);
const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.064, .052, .08, 10), darkMetal); muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, .13, -1.19); gun.add(muzzle);
// Distinctive ring-and-post iron sight.
const sight = new THREE.Mesh(new THREE.TorusGeometry(.105, .018, 6, 14), metalEdge); sight.position.set(0, .27, -.5); gun.add(sight);
gunBox(.035, .09, .035, metalEdge, 0, .27, -.89);
// Ammunition belt draped from the receiver.
for (let i = 0; i < 8; i++) {
  const round = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .12, 6), mat('#a78a50', .55, { metalness: .4 }));
  round.rotation.x = Math.PI / 2; round.position.set(.14 + i * .022, -.18 - Math.sin(i / 7 * Math.PI) * .11, -.05 + i * .025); gun.add(round);
}

const enemies = [], enemyMeshes = [], tracers = [], particles = [];
const raycaster = new THREE.Raycaster(); raycaster.far = 100;
const enemyUniform = mat('#545447'), enemyPants = mat('#49483e'), helmetMat = mat('#333b34', .6), skinMat = mat('#927b63');
const ui = {
  lives: document.querySelector('#lives'), wave: document.querySelector('#wave'), score: document.querySelector('#score'),
  ammo: document.querySelector('#ammo'), fill: document.querySelector('#ammo-fill'), progress: document.querySelector('#progress'),
  objective: document.querySelector('#objective'), integrity: document.querySelector('#integrity-label'),
  crosshair: document.querySelector('#crosshair'), hit: document.querySelector('#hitmarker'), reload: document.querySelector('#reload-note'),
  msg: document.querySelector('#message'), toast: document.querySelector('#toast')
};
let game = { active: false, over: false, wave: 0, score: 0, lives: 5, ammo: 30, reserve: 120, aim: false, reload: 0, fireTimer: 0, recoil: 0, spawnTimer: 0, spawned: 0, waveSize: 0, wavePause: 0, elapsed: 0, sound: true, pointerLocked: false, mouseDown: false, toastTimer: 0, flash: 0 };
function makeEnemy(x, z, speed) {
  const root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.52, .69, .3), enemyUniform); torso.position.y = 1.02; root.add(torso);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.38, .44, .23), mat('#3f443a')); pack.position.set(0, 1.13, .22); root.add(pack);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 7), skinMat); head.position.set(0, 1.52, -.015); root.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.21, 8, 5, 0, Math.PI * 2, 0, Math.PI * .58), helmetMat); helmet.position.set(0, 1.59, -.02); helmet.scale.set(1.12, .72, 1); root.add(helmet);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .055, 9), helmetMat); brim.position.set(0, 1.57, -.005); root.add(brim);
  const arms = [], legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.17, .57, .18), enemyUniform); arm.position.set(side * .37, 1.05, -.06); arm.rotation.z = side * -.24; root.add(arm); arms.push(arm);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.22, .65, .25), enemyPants); leg.position.set(side * .15, .39, 0); root.add(leg); legs.push(leg);
  }
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(.11, .11, .74), mat('#352f25')); rifle.position.set(.08, .9, -.42); rifle.rotation.x = -.1; root.add(rifle);
  const enemy = { root, meshes: [torso, pack, head, helmet, brim, ...arms, ...legs, rifle], arms, legs, speed, phase: rand(0, Math.PI * 2), alive: true, hitFlash: 0, hp: 1 };
  enemies.push(enemy); enemyMeshes.push(...enemy.meshes); return enemy;
}

function sound(type) {
  if (!game.sound) return;
  try {
    const ctx = sound.ctx || (sound.ctx = new AudioContext());
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    if (type === 'shot') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * .13, ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const src = ctx.createBufferSource(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
      src.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 850; gain.gain.setValueAtTime(.32, now); gain.gain.exponentialRampToValueAtTime(.001, now + .13); src.connect(filter).connect(gain).connect(ctx.destination); src.start();
    } else {
      const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'triangle'; osc.frequency.setValueAtTime(type === 'hit' ? 660 : 240, now); osc.frequency.exponentialRampToValueAtTime(type === 'hit' ? 320 : 100, now + .11); gain.gain.setValueAtTime(.09, now); gain.gain.exponentialRampToValueAtTime(.001, now + .12); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(now + .13);
    }
  } catch { /* Audio is an optional flourish. */ }
}
function flashMessage(text, duration = 1700) {
  ui.msg.textContent = text; ui.msg.classList.add('show'); clearTimeout(flashMessage.timer);
  flashMessage.timer = setTimeout(() => ui.msg.classList.remove('show'), duration);
}
function toast(text) {
  ui.toast.textContent = text; ui.toast.classList.add('show'); clearTimeout(game.toastTimer);
  game.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1500);
}
function updateHud() {
  ui.lives.innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="life-mark" style="opacity:${i < game.lives ? 1 : .2}">✣</span>`).join('');
  ui.wave.textContent = String(Math.max(game.wave, 1)).padStart(2, '0');
  ui.score.textContent = String(game.score).padStart(4, '0'); ui.ammo.textContent = String(game.ammo).padStart(2, '0');
  ui.fill.style.width = `${100 * game.ammo / 30}%`;
  ui.progress.style.width = game.waveSize ? `${100 * game.spawned / game.waveSize}%` : '0%';
  ui.integrity.textContent = game.lives >= 4 ? 'LINE INTACT' : game.lives >= 2 ? 'LINE UNDER PRESSURE' : 'LINE CRITICAL';
  ui.objective.textContent = game.spawned < game.waveSize ? 'ENEMIES INBOUND' : enemies.length ? 'CLEAR THE FIELD' : 'POSITION SECURE';
}
function beginWave() {
  game.wave++; game.spawned = 0; game.waveSize = 4 + Math.min(7, game.wave * 2); game.spawnTimer = .7; updateHud();
  flashMessage(`WAVE ${String(game.wave).padStart(2, '0')} — INCOMING`, 1900);
}
function startGame() {
  document.querySelector('#title-screen').classList.remove('visible'); document.querySelector('#end-screen').classList.remove('visible');
  game.active = true; game.over = false; game.wave = 0; game.score = 0; game.lives = 5; game.ammo = 30; game.reserve = 120; game.reload = 0;
  for (const e of [...enemies]) removeEnemy(e); game.x = 0; player.x = 0; player.yaw = 0; player.pitch = -.035; camera.fov = 54; camera.updateProjectionMatrix();
  updateHud(); beginWave(); sound('other');
  if (!isTouch && canvas.requestPointerLock) canvas.requestPointerLock();
}
function removeEnemy(enemy) {
  scene.remove(enemy.root); enemy.alive = false;
  const ei = enemies.indexOf(enemy); if (ei >= 0) enemies.splice(ei, 1);
  for (const mesh of enemy.meshes) { const mi = enemyMeshes.indexOf(mesh); if (mi >= 0) enemyMeshes.splice(mi, 1); }
}
function endGame() {
  game.active = false; game.over = true; if (document.pointerLockElement) document.exitPointerLock();
  document.querySelector('#final-wave').textContent = game.wave; document.querySelector('#final-kills').textContent = game.score;
  document.querySelector('#end-screen').classList.add('visible'); sound('other');
}
function spawnEnemy() {
  const x = rand(-12, 12); makeEnemy(x, rand(-38, -27), rand(.66, 1.05) + game.wave * .035); game.spawned++;
}
function showHit() { ui.hit.classList.add('show'); clearTimeout(showHit.timer); showHit.timer = setTimeout(() => ui.hit.classList.remove('show'), 130); }
function addTracer(from, to, color = '#f3c26c') {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .9 })); scene.add(line); tracers.push({ line, life: .095 });
}
function shoot() {
  if (!game.active || game.reload > 0) return;
  if (game.ammo <= 0) { reload(); return; }
  game.ammo--; game.fireTimer = game.aim ? .13 : .105; game.recoil = Math.min(game.recoil + .025, .09); game.flash = .045; sound('shot');
  const origin = camera.position.clone(); raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(enemyMeshes, false);
  const end = hits.length ? hits[0].point : raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 65);
  addTracer(origin.clone().add(new THREE.Vector3(.32, -.3, -.65).applyQuaternion(camera.quaternion)), end);
  if (hits.length) {
    const enemy = enemies.find(e => e.meshes.includes(hits[0].object));
    if (enemy) {
      game.score++; sound('hit'); showHit(); enemy.hitFlash = .1;
      updateHud(); removeEnemy(enemy);
      if (game.score % 5 === 0) toast('5 CONFIRMED — KEEP IT UP');
    }
  }
  updateHud();
}
function reload() {
  if (!game.active || game.reload > 0 || game.ammo === 30 || game.reserve <= 0) return;
  game.reload = 1.55; ui.reload.classList.add('active'); gun.rotation.x = -.16;
}
function setAim(value) {
  game.aim = value; document.body.classList.toggle('aiming', value);
}

// Button and pointer controls; pointer-lock look on desktop, drag look on touch.
const held = { left: false, right: false, fire: false };
function bindHold(id, key) {
  const el = document.getElementById(id); if (!el) return;
  const down = e => { e.preventDefault(); held[key] = true; el.classList.add('pressed'); if (el.setPointerCapture && e.pointerId != null) el.setPointerCapture(e.pointerId); };
  const up = e => { e.preventDefault(); held[key] = false; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
bindHold('move-left', 'left'); bindHold('move-right', 'right'); bindHold('fire-btn', 'fire');
document.querySelector('#aim-btn').addEventListener('pointerdown', e => { e.preventDefault(); setAim(true); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) document.querySelector('#aim-btn').addEventListener(ev, () => setAim(false));
document.querySelector('#reload-btn').addEventListener('pointerdown', e => { e.preventDefault(); reload(); });
document.querySelector('#start-btn').addEventListener('click', startGame);
document.querySelector('#again-btn').addEventListener('click', startGame);
document.querySelector('#sound-btn').addEventListener('click', e => { game.sound = !game.sound; e.currentTarget.textContent = game.sound ? '♫' : '♪'; e.currentTarget.style.opacity = game.sound ? '1' : '.45'; toast(game.sound ? 'SOUND ON' : 'SOUND OFF'); });
document.addEventListener('pointerlockchange', () => { game.pointerLocked = document.pointerLockElement === canvas; });
canvas.addEventListener('click', () => { if (game.active && !isTouch && !game.pointerLocked) canvas.requestPointerLock?.(); });
document.addEventListener('mousemove', e => {
  if (!game.active || !game.pointerLocked) return;
  player.yaw -= e.movementX * .0024; player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * .0018, -.38, .3);
});
document.addEventListener('mousedown', e => { if (e.button === 0 && game.active) { game.mouseDown = true; } if (e.button === 2 && game.active) setAim(true); });
document.addEventListener('mouseup', e => { if (e.button === 0) game.mouseDown = false; if (e.button === 2) setAim(false); });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') held.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') held.right = true;
  if (e.code === 'Space') { held.fire = true; game.mouseDown = true; }
  if (e.code === 'KeyR') reload();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setAim(true);
});
document.addEventListener('keyup', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') held.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') held.right = false;
  if (e.code === 'Space') { held.fire = false; game.mouseDown = false; }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setAim(false);
});
let touchLook = null;
canvas.addEventListener('pointerdown', e => { if (!isTouch || !game.active || e.target !== canvas) return; touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!touchLook || e.pointerId !== touchLook.id) return;
  const dx = e.clientX - touchLook.x, dy = e.clientY - touchLook.y;
  player.yaw -= dx * .004; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * .003, -.38, .3);
  touchLook.x = e.clientX; touchLook.y = e.clientY;
});
canvas.addEventListener('pointerup', e => { if (touchLook?.id === e.pointerId) touchLook = null; });
canvas.addEventListener('pointercancel', () => touchLook = null);

function resize() {
  renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
}
addEventListener('resize', resize);

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05); game.elapsed += dt;
  const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  if (game.active) {
    player.x = THREE.MathUtils.clamp(player.x + dir * dt * 3.8, -3.15, 3.15);
    if (game.aim) camera.fov = THREE.MathUtils.damp(camera.fov, 34, 9, dt); else camera.fov = THREE.MathUtils.damp(camera.fov, 54, 8, dt);
    camera.updateProjectionMatrix();
    if (!game.pointerLocked && !isTouch) player.yaw = THREE.MathUtils.damp(player.yaw, 0, .65, dt);
    camera.position.x = player.x; camera.position.y = 2.02 + Math.sin(game.elapsed * 7) * (dir ? .025 : .008); camera.position.z = 4.2;
    const recoilPitch = game.recoil; game.recoil = Math.max(0, game.recoil - dt * .24);
    camera.rotation.order = 'YXZ'; camera.rotation.y = player.yaw; camera.rotation.x = player.pitch + recoilPitch;
    gun.visible = true; gun.position.y = -.34 + Math.sin(game.elapsed * 7) * (dir ? .012 : .004) - game.recoil * 1.2;
    gun.rotation.x = THREE.MathUtils.damp(gun.rotation.x, game.reload > 0 ? -.16 : (game.aim ? .04 : 0), 8, dt);
    game.fireTimer -= dt; game.reload = Math.max(0, game.reload - dt);
    if (game.reload === 0 && ui.reload.classList.contains('active')) {
      const amount = Math.min(30 - game.ammo, game.reserve); game.ammo += amount; game.reserve -= amount; ui.reload.classList.remove('active'); updateHud();
    }
    if ((held.fire || game.mouseDown) && game.fireTimer <= 0) shoot();
    if (game.spawned < game.waveSize) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) { spawnEnemy(); game.spawnTimer = Math.max(.58, 1.42 - game.wave * .05) + rand(0, .55); updateHud(); }
    } else if (!enemies.length) {
      game.wavePause += dt;
      if (game.wavePause > 3.1) { game.wavePause = 0; game.reserve = Math.min(180, game.reserve + 30); beginWave(); toast('AMMUNITION RESUPPLIED +30'); }
    }
    for (const enemy of [...enemies]) {
      enemy.phase += dt * (5.4 + enemy.speed);
      enemy.root.position.z += enemy.speed * dt;
      const dx = player.x - enemy.root.position.x;
      enemy.root.position.x += THREE.MathUtils.clamp(dx, -1, 1) * dt * .2;
      enemy.root.rotation.y = Math.PI + Math.atan2(dx, 24) * .22;
      enemy.root.position.y = Math.abs(Math.sin(enemy.phase * 2)) * .05;
      enemy.legs[0].rotation.x = Math.sin(enemy.phase) * .55; enemy.legs[1].rotation.x = -Math.sin(enemy.phase) * .55;
      enemy.arms[0].rotation.x = -Math.sin(enemy.phase) * .3; enemy.arms[1].rotation.x = Math.sin(enemy.phase) * .3;
      if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
      if (enemy.root.position.z > -.4) {
        removeEnemy(enemy); game.lives--; updateHud(); sound('other');
        flashMessage(game.lives ? 'THE LINE IS BREACHED!' : 'POSITION OVERRUN', 1100);
        if (!game.lives) { endGame(); break; }
      }
    }
    if (game.flash > 0) game.flash -= dt;
  }
  for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].life -= dt; tracers[i].line.material.opacity = Math.max(0, tracers[i].life / .095); if (tracers[i].life <= 0) { scene.remove(tracers[i].line); tracers[i].line.geometry.dispose(); tracers[i].line.material.dispose(); tracers.splice(i, 1); } }
  // Gentle moving haze gives the distant battlefield a lived-in, cinematic depth.
  renderer.render(scene, camera);
}
updateHud(); frame();
