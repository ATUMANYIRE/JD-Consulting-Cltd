import * as THREE from "three";

export const UP = new THREE.Vector3(0, 1, 0);

export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function alignY(direction) {
  return new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
}

// Position, length and orientation for a cylinder/capsule spanning two points.
export function segment(from, to) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  return { position: a.clone().add(b).multiplyScalar(0.5), length: dir.length(), quaternion: alignY(dir) };
}

export function deformedRock(radius, seed, detail = 2, strength = 0.28) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const position = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n =
      1 +
      Math.sin(v.x * 2.1 + seed) * Math.cos(v.y * 1.7 + seed * 1.3) * Math.sin(v.z * 2.3 + seed * 0.7) * strength +
      Math.sin(v.x * 7.3 + seed * 2) * Math.sin(v.z * 6.1 + seed) * strength * 0.25;
    v.multiplyScalar(n);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function displacedPlane(width, height, segments, amplitude, seed, edgeFalloff = false) {
  const geo = new THREE.PlaneGeometry(width, height, segments, segments);
  const position = geo.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    let d =
      Math.sin(x * 1.3 + seed) * Math.cos(y * 1.1 + seed * 0.7) * 0.6 +
      Math.sin(x * 3.7 + seed * 2) * Math.sin(y * 2.9) * 0.3 +
      Math.sin(x * 9.1) * Math.cos(y * 8.3 + seed) * 0.1;
    if (edgeFalloff) {
      const ex = 1 - Math.abs(x) / (width / 2);
      const ey = 1 - Math.abs(y) / (height / 2);
      d = Math.max(0, d) * Math.min(1, Math.min(ex, ey) * 5);
    }
    position.setZ(i, d * amplitude);
  }
  geo.computeVertexNormals();
  return geo;
}

let hardHat = null;

// Unit-scale hard hat: lathe shell plus a centre ridge, brim front facing +z.
export function hardHatGeometries() {
  if (hardHat) return hardHat;
  const profile = [
    [0.0, 0.74], [0.18, 0.735], [0.34, 0.7], [0.48, 0.62], [0.58, 0.52], [0.65, 0.38], [0.69, 0.22],
    [0.71, 0.1], [0.72, 0.06], [0.86, 0.045], [0.95, 0.02], [0.97, 0.0], [0.95, -0.012], [0.72, -0.004], [0.69, 0.03],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const shell = new THREE.LatheGeometry(profile, 56);
  shell.scale(1, 1, 1.12);
  shell.computeVertexNormals();

  const top = profile.slice(0, 8);
  const ridgePoints = [
    ...top.slice().reverse().map((p) => new THREE.Vector3(0, p.y + 0.02, -p.x * 1.12)),
    ...top.slice(1).map((p) => new THREE.Vector3(0, p.y + 0.02, p.x * 1.12)),
  ];
  const ridge = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ridgePoints), 48, 0.035, 8, false);
  hardHat = { shell, ridge };
  return hardHat;
}
