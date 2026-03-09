// src/textures/strokeTexture.js
import * as THREE from 'three';

export function makeStrokeTexture(color = '#ff69b4') {
  try {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // base
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // subtle darker strokes
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 3;
    for (let y = 10; y < size; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 8) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + y) * 2);
      }
      ctx.stroke();
    }

    // highlight lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let y = 6; y < size; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) {
        ctx.lineTo(x, y + Math.cos(x * 0.05) * 1.5);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  } catch (err) {
    console.error('makeStrokeTexture error', err);
    // fallback: simple solid color texture so app still runs
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 2;
    const c = cvs.getContext('2d');
    c.fillStyle = color;
    c.fillRect(0, 0, 2, 2);
    const t = new THREE.CanvasTexture(cvs);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
}