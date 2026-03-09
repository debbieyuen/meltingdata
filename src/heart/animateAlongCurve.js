import * as THREE from 'three';

export function animateAlongCurve(mesh, curve, duration = 6) {
  const clock = new THREE.Clock();

  function update() {
    const t = (clock.getElapsedTime() % duration) / duration;

    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    mesh.position.copy(position);

    const axis = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
    mesh.quaternion.copy(quaternion);

    mesh.rotateX(Math.PI * 0.5);

    requestAnimationFrame(update);
  }

  update();
}