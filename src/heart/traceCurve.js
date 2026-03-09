// src/heart/traceCurve.js
import * as THREE from 'three';
import { makeStrokeTexture } from '../textures/strokeTexture.js';

export function traceCurve(scene, curve, options = {}) {
  const {
    duration = 4,
    radius = 0.006,
    radialSegments = 8,
    tubularSegments = Math.max(300, Math.round(curve.getLength() * 30)),
    color = '#ff69b4',
    loop = true,
  } = options;

  // Build full geometry ONCE
  const geometry = new THREE.TubeGeometry(
    curve,
    tubularSegments,
    radius,
    radialSegments,
    false
  );

  // Texture
  const strokeTex = makeStrokeTexture(color);
  strokeTex.wrapS = strokeTex.wrapT = THREE.RepeatWrapping;
  strokeTex.encoding = THREE.sRGBEncoding;
  strokeTex.repeat.set(Math.max(1, Math.round(curve.getLength() * 0.6)), 1);

  // Material
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffffff).convertSRGBToLinear(),
    map: strokeTex,
    roughness: 0.55,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  // Inject reveal shader logic
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = { value: 0.0 };

    // vertex shader modification
    shader.vertexShader =
      `varying float vRevealUv;\n` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
       vRevealUv = uv.x;`
    );

    // fragment shader modification
    shader.fragmentShader =
      `uniform float uReveal;
       varying float vRevealUv;\n` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
       if (vRevealUv > uReveal) discard;
       #include <dithering_fragment>
      `
    );

    material.userData.shader = shader;
  };

  const tube = new THREE.Mesh(geometry, material);
  tube.castShadow = false;
  tube.receiveShadow = false;
  scene.add(tube);

  
  // Pen
  const pen = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xff69b4 })
  );
  scene.add(pen);

  // ----------------------------
  // Animation
  // ----------------------------
  let startTime = performance.now();
  let paused = false;

  function animate(now) {
    if (paused) {
      requestAnimationFrame(animate);
      return;
    }

    let t = (now - startTime) / (duration * 1000);

    if (loop) {
      t = t % 1;
    } else {
      t = Math.min(1, t);
    }

    // update shader uniform
    if (material.userData.shader) {
      material.userData.shader.uniforms.uReveal.value = t;
    }

    // update pen
    const point = curve.getPointAt(t);
    pen.position.copy(point);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // Controller (optional)
  const controller = {
    pause() { paused = true; },
    play() {
      paused = false;
      startTime = performance.now();
    },
    seek(v) {
      v = Math.max(0, Math.min(1, v));
      if (material.userData.shader) {
        material.userData.shader.uniforms.uReveal.value = v;
      }
      pen.position.copy(curve.getPointAt(v));
    }
  };

  return { tube, pen, controller };
}