// src/main.js
import * as THREE from 'three';
import { setupScene } from './scene/setupScene.js';
import { handleResize } from './scene/resize.js';
import { createCurveFromJSON } from './heart/createCurveFromJSON.js';
import { traceCurve } from './heart/traceCurve.js';

console.clear();
console.log('MAIN GRID: starting');

/* ---------- canvas + scene ---------- */
const container = document.getElementById('app') || document.body;
let canvas = container.querySelector('canvas');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'webgl';
  container.appendChild(canvas);
}

const { scene, camera, renderer, controls } = setupScene(canvas);
handleResize(camera, renderer);

/* ---------- optional background floor ---------- */
// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(200, 200),
//   new THREE.MeshStandardMaterial({ color: 0x021219, roughness: 1 })
// );
// floor.rotation.x = -Math.PI / 2;
// floor.position.y = -1.25;
// floor.receiveShadow = true;
// scene.add(floor);

/* ---------- collect JSON files (Vite) ---------- */
const modules = import.meta.glob('./data/*.json', { eager: true, as: 'json' });
const jsonEntries = Object.keys(modules).map(k => modules[k].default || modules[k]);

if (jsonEntries.length === 0) {
  console.error('MAIN GRID: no JSON files found under src/data/*.json — add files and restart dev server.');
}

/* ---------- grid config ---------- */
const COLS = 7;
const ROWS = 3;
const CELL_DRAW_SIZE = 2.2;      // how big each curve should draw inside the cell
const CELL_SPACING = 4.5;        // world units between cell centers
const START_X = -((COLS - 1) * CELL_SPACING) / 2;
const START_Y = ((ROWS - 1) * CELL_SPACING) / 2;

/* ---------- build grid of traces ---------- */
// const chosen = jsonEntries.slice(0, COLS * ROWS);
// shuffle jsonEntries so selection is different on every full page load
for (let i = jsonEntries.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [jsonEntries[i], jsonEntries[j]] = [jsonEntries[j], jsonEntries[i]];
}

// take the first N after shuffle
const chosen = jsonEntries.slice(0, COLS * ROWS);
const traces = [];

let idx = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (idx >= chosen.length) break;

    const jsonObj = chosen[idx];

    // Create curve from JSON (returns { curve, tube } but we use curve)
    const { curve } = createCurveFromJSON(jsonObj);

    // Sample and compute bounding box to center/scale
    const sampleCount = Math.max(64, Math.round(curve.getLength() * 20));
    const worldPoints = curve.getPoints(sampleCount);
    const bbox = new THREE.Box3().setFromPoints(worldPoints);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.0001);

    // Center the points so local curve is around origin
    const localPoints = worldPoints.map(p => new THREE.Vector3(p.x - center.x, p.y - center.y, p.z - center.z));
    const localCurve = new THREE.CatmullRomCurve3(localPoints, false, 'catmullrom', 0.5);

    // scale factor so each cell has consistent draw size
    const scaleFactor = CELL_DRAW_SIZE / maxDim;

    // create group positioned in grid and scaled
    const group = new THREE.Group();
    group.position.set(START_X + c * CELL_SPACING, START_Y - r * CELL_SPACING, 0);
    group.scale.set(scaleFactor, scaleFactor, scaleFactor);
    scene.add(group);

    // create trace inside group (local curve coords)
    const duration = 5 + (idx % 4) * 0.8;
    const tubularSegments = Math.max(120, Math.round(localCurve.getLength() * 18));

    const trace = traceCurve(group, localCurve, {
        duration,   // ← now actually uses the varying duration
        radius: 0.006,
        radialSegments: 8,
        tubularSegments,
        color: jsonObj.color || '#ff69b4',
        loop: true
    });

    // stagger start
    setTimeout(() => {
        trace.controller.play();
    }, idx * 300);

    traces.push({ trace, group, json: jsonObj, index: idx, bbox, center });

// group.add(label);
    idx++;
}
}

/* ---------- expose controls ---------- */
window.__traces = {
  list: traces,
  playAll() { traces.forEach(t => t.trace.controller.play()); },
  pauseAll() { traces.forEach(t => t.trace.controller.pause()); },
  seekAll(v) { traces.forEach(t => t.trace.controller.seek(v)); }
};
console.log('MAIN GRID: created', traces.length, 'traces. Controls at window.__traces');

/* ---------- frame camera to fit grid ---------- */
setTimeout(() => {
  try {
    const totalBox = new THREE.Box3();
    traces.forEach(t => totalBox.expandByObject(t.group));
    if (totalBox.isEmpty()) return;

    const center = totalBox.getCenter(new THREE.Vector3());
    const size = totalBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);

    const fov = (camera.fov * Math.PI) / 180;
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 0.9 + 0.6;

    camera.position.set(center.x, center.y, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
    console.log('MAIN GRID: camera framed to grid. center=', center, 'size=', size);
  } catch (err) {
    console.warn('MAIN GRID: framing failed', err);
  }
}, 160);

/* ---------- main render loop ---------- */
function renderLoop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}
renderLoop();

console.log('MAIN GRID: running. Use window.__traces to control.');