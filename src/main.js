// src/main.js (fixed) - trace the JSON curve
import * as THREE from 'three';
import data from './data/heart_010.json';
import { setupScene } from './scene/setupScene.js';
import { handleResize } from './scene/resize.js';
import { createCurveFromJSON } from './heart/createCurveFromJSON.js';
import { traceCurve } from './heart/traceCurve.js';

console.clear();
console.log('MAIN: starting. Imported data keys:', Object.keys(Array.isArray(data) ? data[0] : data));

/* --- Setup canvas + scene --- */
const container = document.getElementById('app') || document.body;
let canvas = container.querySelector('canvas');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'webgl';
  container.appendChild(canvas);
}

const { scene, camera, renderer, controls } = setupScene(canvas);
handleResize(camera, renderer);

// /* --- optional floor for shadows/readability --- */
// const floor = new THREE.Mesh(
//   new THREE.PlaneGeometry(50, 50),
//   new THREE.MeshStandardMaterial({ color: 0x021219, roughness: 1 })
// );
// floor.rotation.x = -Math.PI / 2;
// floor.position.y = -1.25;
// floor.receiveShadow = true;
// scene.add(floor);

/* --- Create curve from JSON and start trace --- */
const jsonObj = Array.isArray(data) ? data[0] : data;
console.log('MAIN: json object top-level keys:', Object.keys(jsonObj));

if (!jsonObj.points || jsonObj.points.length < 2) {
  console.error('MAIN: JSON has too few points to build a curve. points length =', (jsonObj.points || []).length);
} else {
  // createCurveFromJSON returns { curve, tube } (it may create a static tube)
  let created = null;
  try {
    created = createCurveFromJSON(jsonObj);
  } catch (err) {
    console.error('MAIN: createCurveFromJSON threw', err);
  }

  if (!created || !created.curve) {
    console.error('MAIN: no curve available from JSON — aborting trace.');
  } else {
    const { curve, tube: maybeStaticTube } = created;

    // If createCurveFromJSON added a static tube to the scene (or returned it), remove it,
    // because traceCurve will build the progressive tube geometry itself.
    if (maybeStaticTube && maybeStaticTube.parent) {
      maybeStaticTube.parent.remove(maybeStaticTube);
      try { maybeStaticTube.geometry.dispose(); } catch (e) {}
      try { maybeStaticTube.material.dispose(); } catch (e) {}
    }

    // optional visible start/end markers
    try {
      const start = jsonObj.points[0];
      const end = jsonObj.points[jsonObj.points.length - 1];
      const startMark = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      const endMark   = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
      startMark.position.set(start.x, start.y, start.z);
      endMark.position.set(end.x, end.y, end.z);
      scene.add(startMark, endMark);
    } catch (err) {
      console.warn('MAIN: could not add start/end markers', err);
    }

    // Start the trace animation
    let trace = null;
    try {
      trace = traceCurve(scene, curve, {
        duration: 4,                // seconds to fully draw the curve
        radius: 0.006,
        radialSegments: 8,
        maxSamples: Math.max(32, Math.round(curve.getLength() * 20)),
        color: jsonObj.color || '#ff69b4'
      });

      // expose for interactive control
      window.__trace = {
        tube: trace.tube,
        pen: trace.pen,
        controller: trace.controller,
        curve
      };
      console.log('MAIN: trace created. Use window.__trace.controller.play() to start.');

      // show a tiny initial segment and remain paused so you can inspect
      trace.controller.seek(0.0001);
      trace.controller.pause();

      // frame camera to the trace (after short delay so geometry exists)
      setTimeout(() => {
        try {
          const box = new THREE.Box3().setFromObject(trace.tube);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.5);
          const fov = (camera.fov * Math.PI) / 180;
          const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6 + 0.5;

          camera.position.set(center.x, center.y, center.z + cameraZ);
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();
          console.log('MAIN: camera framed to trace.');
        } catch (err) {
          console.warn('MAIN: framing failed', err);
        }
      }, 120);

    } catch (err) {
      console.error('MAIN: traceCurve threw', err);
      if (maybeStaticTube) scene.add(maybeStaticTube); // fallback
    }
  }
}

/* --- Render loop --- */
function renderLoop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}
renderLoop();

console.log('MAIN: render loop started. Use window.__trace.controller.play() to run the trace.');