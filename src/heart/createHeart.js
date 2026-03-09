import * as THREE from 'three';

export function createHeart(color = '#ff69b4') {
  const shape = new THREE.Shape();
  const size = 0.06;

  shape.moveTo(0, size * 0.5);
  shape.bezierCurveTo(size * 0.5, size * 1.1, size * 1.6, size * 0.8, size, size * 0.2);
  shape.bezierCurveTo(size * 0.7, -size * 0.4, size * 0.2, -size * 0.6, 0, -size * 0.3);
  shape.bezierCurveTo(-size * 0.2, -size * 0.6, -size * 0.7, -size * 0.4, -size, size * 0.2);
  shape.bezierCurveTo(-size * 1.6, size * 0.8, -size * 0.5, size * 1.1, 0, size * 0.5);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.01,
    bevelSegments: 3
  });

  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.3
  });

  return new THREE.Mesh(geometry, material);
}