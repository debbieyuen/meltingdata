// src/heart/createCurveFromJSON.js

import * as THREE from 'three';
import { makeStrokeTexture } from '../textures/strokeTexture.js';

function sanitizeColorString(c) {
  if (!c) return '#ff69b4';
  if (typeof c !== 'string') return '#ff69b4';
  const s = c.trim();
  if (s[0] === '#') {
    // handle "#rrggbbaa" -> "#rrggbb"
    if (s.length === 9) return s.slice(0, 7);
    if (s.length === 7) return s;
  }
  return s; // return whatever string (e.g. "pink" or "rgb(...)") and let Three try it
}

export function createCurveFromJSON(data) {
  const obj = Array.isArray(data) ? data[0] : data;

  // defensive: ensure points exist
  const pts = (obj.points || []);
  const points = pts.map(p => new THREE.Vector3(p.x, p.y, p.z));
  if (points.length < 2) {
    console.error('createCurveFromJSON: not enough points to build a curve');
    const dummyCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0), new THREE.Vector3(0.1,0,0)]);
    const dummyTube = new THREE.Mesh(new THREE.TubeGeometry(dummyCurve, 8, 0.005, 6, false), new THREE.MeshBasicMaterial({ color: '#ff69b4' }));
    return { curve: dummyCurve, tube: dummyTube };
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

  // sanitize color and create material
  const colorStr = sanitizeColorString(obj.color || '#ff69b4');
  // Use MeshBasicMaterial while testing so lighting won't desaturate it.
//   const strokeTex = makeStrokeTexture('#ff69b4');
// strokeTex.repeat.set(3, 1);

// const tubeMat = new THREE.MeshStandardMaterial({
//   color: new THREE.Color('#ff69b4').convertSRGBToLinear(),
//   map: strokeTex,
//   bumpMap: strokeTex,
//   bumpScale: 0.02,
//   roughness: 0.45,
//   metalness: 0.05,
//   side: THREE.DoubleSide
// });

// prepare texture
const strokeTex = makeStrokeTexture(colorStr || '#ff69b4');
strokeTex.wrapS = strokeTex.wrapT = THREE.RepeatWrapping;
strokeTex.encoding = THREE.sRGBEncoding;
strokeTex.repeat.set(3, 1);
strokeTex.needsUpdate = true;

// base PBR material
const tubeMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#ffffff').convertSRGBToLinear(), // neutral base so texture color is respected
  map: strokeTex,
  bumpMap: strokeTex,
  bumpScale: 0.02,
  roughness: 0.45,
  metalness: 0.05,
  side: THREE.DoubleSide,
});

// Inject a reveal uniform and fragment clip via onBeforeCompile
tubeMat.onBeforeCompile = (shader) => {
  // add uniform
  shader.uniforms.uReveal = { value: 1.0 }; // 1.0 = fully visible
  // prepend uniform declaration
  shader.fragmentShader = `uniform float uReveal;\n` + shader.fragmentShader;

  // Ensure the varying for uv is present (vUv). Then discard fragments beyond reveal.
  // Insert the discard just before dithering fragment include so lighting still evaluates correctly
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `#include <dithering_fragment>
    // reveal clipping: discard fragments beyond the reveal threshold (vUv.x in [0..1])
    if (vUv.x > uReveal) {
      discard;
    }`
  );

  // Keep reference so we can update uniform later from trace code
  tubeMat.userData.__shader = shader;
  tubeMat.userData.__uniforms = shader.uniforms;
};

  const tubularSegments = Math.max(64, points.length * 2);
  const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, 0.006, 8, false);
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.renderOrder = 500;

  return { curve, tube };
}