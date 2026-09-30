import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mineControls } from "./mineControls";
import { AMBER, NAVY, ORANGE, STEEL, SUIT } from "./palette";
import MinerFigure from "./MinerFigure";
import Shadowed from "./Shadowed";

// Jackleg (air-leg) rock drill working a development face: the operator holds the handle while the
// air leg carries the thrust, the drill steel rotates and hammers into the rock, and water flushing
// keeps the dust down. The drill pivots about its handle between holes, so the hands stay on it.

const RIG_POSITION = [1.45, 0, 0.35];
const RIG_ROTATION = [0, Math.PI / 2, 0]; // rig +z points at the face (world +x)
const PIVOT = new THREE.Vector3(0, 1.21, 0); // drill handle, rig-local
const CHUCK = 0.7; // distance from handle to the chuck along the drill axis
const STANDOFF = 0.2; // bit clearance from the face while retracted
const LEG_FOOT = new THREE.Vector3(0.02, 0.03, -0.5);
const LEG_MOUNT = new THREE.Vector3(0, -0.1, 0.3); // drill-local
const HOLES = [
  { pitch: 0.1, yaw: 0.0 },
  { pitch: 0.2, yaw: 0.09 },
  { pitch: 0.06, yaw: 0.13 },
  { pitch: 0.17, yaw: -0.05 },
];
const PHASES = [
  { name: "position", duration: 0.9 },
  { name: "collar", duration: 0.5 },
  { name: "drill", duration: 4.6 },
  { name: "retract", duration: 0.8 },
];
const OPERATOR = { position: [0.32, 0, -0.62], yaw: Math.atan2(-0.32, 0.62), lean: 0.3, arms: -1.22 };

const smooth = (t) => t * t * (3 - 2 * t);
const holeQuaternion = (hole, target = new THREE.Quaternion()) => target.setFromEuler(new THREE.Euler(-hole.pitch, hole.yaw, 0, "YXZ"));

const unitCylinderZ = (() => {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 12);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, 0.5);
  return geo;
})();
const steelGeometry = (() => {
  const geo = new THREE.CylinderGeometry(0.017, 0.017, 1, 6);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, 0.5);
  return geo;
})();

// A cylinder mesh stretched between two points (used for the telescopic leg).
function placeBetween(mesh, from, to, radius) {
  const dir = to.clone().sub(from);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
  mesh.scale.set(radius, radius, dir.length());
}

function DrillBody({ steelRef, spinRef, bitRef }) {
  const body = <meshStandardMaterial color="#2f506b" metalness={0.6} roughness={0.4} />;
  const steel = <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />;
  const dark = <meshStandardMaterial color="#141c22" metalness={0.4} roughness={0.6} />;
  const along = (z, length, radius, material, key) => (
    <mesh key={key} position={[0, 0, z]} scale={[radius, radius, length]} geometry={unitCylinderZ}>
      {material}
    </mesh>
  );

  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.34, 12]} />
        {dark}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.09, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.08, 8]} />
          {steel}
        </mesh>
      ))}
      {along(0.06, 0.08, 0.07, dark, "backhead")}
      {along(0.14, 0.42, 0.085, body, "cylinder")}
      {along(0.3, 0.05, 0.089, <meshStandardMaterial color={ORANGE} roughness={0.5} />, "band")}
      {along(0.56, 0.1, 0.062, steel, "fronthead")}
      {along(0.66, 0.04, 0.046, dark, "chuck")}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.095, 0.035, 0.08]} scale={[0.009, 0.009, 0.54]} geometry={unitCylinderZ}>
          {steel}
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0.36]}>
        <boxGeometry args={[0.07, 0.04, 0.12]} />
        {dark}
      </mesh>
      <mesh position={[0, -0.1, 0.3]}>
        <boxGeometry args={[0.05, 0.05, 0.08]} />
        {steel}
      </mesh>
      <mesh position={[0, -0.09, 0.1]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.08, 10]} />
        {steel}
      </mesh>

      <group ref={spinRef} position={[0, 0, CHUCK]}>
        <mesh ref={steelRef} geometry={steelGeometry}>
          <meshStandardMaterial color="#8c99a3" metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh position={[0.017, 0, 0.06]}>
          <boxGeometry args={[0.006, 0.02, 0.05]} />
          <meshStandardMaterial color={ORANGE} />
        </mesh>
        <group ref={bitRef}>
          <mesh position={[0, 0, -0.03]} scale={[0.027, 0.027, 0.045]} geometry={unitCylinderZ}>
            {steel}
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos(k * 1.57) * 0.015, Math.sin(k * 1.57) * 0.015, 0.016]}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshStandardMaterial color="#e9ecef" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// Spray-painted drill pattern on the face; a hole appears once it has been drilled.
function HoleMarks({ marks, drilled }) {
  return (
    <group>
      {marks.map((mark, i) => (
        <group key={i} position={mark.point} quaternion={mark.quaternion}>
          <mesh position={[0, 0, 0.004]}>
            <ringGeometry args={[0.028, 0.04, 24]} />
            <meshBasicMaterial color={ORANGE} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          {drilled[i] && (
            <mesh position={[0, 0, 0.006]}>
              <circleGeometry args={[0.024, 20]} />
              <meshBasicMaterial color="#04080b" side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function DrillingRig({ rockRef }) {
  const rig = useRef();
  const drill = useRef();
  const steel = useRef();
  const spin = useRef();
  const bit = useRef();
  const legOuter = useRef();
  const legInner = useRef();
  const spine = useRef();
  const arms = useRef();
  const state = useRef({ hole: 0, phase: 0, time: 0, boost: 0, emit: 0, distances: null, points: null, normals: null, fromQ: new THREE.Quaternion() });
  const [marks, setMarks] = useState([]);
  const [drilled, setDrilled] = useState(() => HOLES.map(() => false));
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), v: new THREE.Vector3(), mount: new THREE.Vector3(), foot: new THREE.Vector3(), legSplit: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

  // Find where each planned hole meets the rock, so the steel collars on the real surface.
  function survey() {
    const s = state.current;
    rig.current.updateWorldMatrix(true, false);
    rockRef.current?.updateWorldMatrix(true, true);
    const raycaster = new THREE.Raycaster();
    const origin = rig.current.localToWorld(PIVOT.clone());
    const rigQ = rig.current.getWorldQuaternion(new THREE.Quaternion());
    s.distances = [];
    s.points = [];
    s.normals = [];
    const found = [];
    HOLES.forEach((hole) => {
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(holeQuaternion(hole)).applyQuaternion(rigQ);
      raycaster.set(origin, dir);
      raycaster.near = CHUCK + 0.1;
      raycaster.far = 4;
      const hit = rockRef.current ? raycaster.intersectObject(rockRef.current, true)[0] : null;
      const distance = hit ? hit.distance : 1.45;
      const point = hit ? hit.point.clone() : origin.clone().addScaledVector(dir, distance);
      const normal = hit?.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : dir.clone().negate();
      if (normal.dot(dir) > 0) normal.negate();
      s.distances.push(distance);
      s.points.push(point);
      s.normals.push(normal);
      found.push({ point: point.clone().addScaledVector(normal, 0.004).toArray(), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal).toArray() });
    });
    holeQuaternion(HOLES[0], s.fromQ);
    setMarks(found);
  }

  useFrame(({ clock }, delta) => {
    const c = mineControls;
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    if (!s.distances) survey();

    if (c.boost) {
      s.boost = 2.4;
      c.boost = false;
      const i = s.hole;
      c.burst = { point: s.points[i].clone().addScaledVector(s.normals[i], 0.04), dir: s.normals[i], amount: 26, sparks: 0.4 };
      c.flash = 1;
      c.shake = 0.08;
    }
    s.boost = Math.max(0, s.boost - dt);
    const speed = (c.reducedMotion ? 0.4 : 1) * (s.boost > 0 ? 2.2 : 1);

    s.time += dt * speed;
    let phase = PHASES[s.phase];
    if (s.time >= phase.duration) {
      s.time -= phase.duration;
      if (phase.name === "drill") {
        const done = s.hole;
        setDrilled((current) => (current[done] ? current : current.map((value, i) => value || i === done)));
        c.flash = Math.max(c.flash, 0.6);
      }
      if (phase.name === "retract") {
        holeQuaternion(HOLES[s.hole], s.fromQ);
        s.hole = (s.hole + 1) % HOLES.length;
        if (s.hole === 0) setDrilled(HOLES.map(() => false));
      }
      s.phase = (s.phase + 1) % PHASES.length;
      phase = PHASES[s.phase];
    }
    const t = Math.min(1, s.time / phase.duration);
    const distance = s.distances[s.hole];

    // Orientation: swing from the previous hole to the next while positioning.
    const target = holeQuaternion(HOLES[s.hole], tmp.q);
    if (phase.name === "position") drill.current.quaternion.slerpQuaternions(s.fromQ, target, smooth(t));
    else drill.current.quaternion.copy(target);

    // Bit travel relative to the face: negative = standing off, positive = depth into the rock.
    let depth = -STANDOFF;
    let advance = 0;
    if (phase.name === "collar") depth = -STANDOFF + STANDOFF * smooth(t);
    if (phase.name === "drill") {
      depth = 0.32 * t;
      advance = 0.05 * t;
    }
    if (phase.name === "retract") {
      depth = (0.32 + STANDOFF) * (1 - smooth(t)) - STANDOFF;
      advance = 0.05 * (1 - smooth(t));
    }
    const drilling = phase.name === "drill";

    tmp.dir.set(0, 0, 1).applyQuaternion(drill.current.quaternion);
    drill.current.position.copy(PIVOT).addScaledVector(tmp.dir, advance);
    if (drilling && !c.reducedMotion) {
      const amp = s.boost > 0 ? 0.006 : 0.0035;
      drill.current.position.x += (Math.random() - 0.5) * amp;
      drill.current.position.y += (Math.random() - 0.5) * amp;
    }
    const length = Math.max(0.05, distance - CHUCK - advance + depth);
    steel.current.scale.z = length;
    bit.current.position.z = length;
    if (drilling || phase.name === "collar") spin.current.rotation.z += dt * (c.reducedMotion ? 3 : 14) * (s.boost > 0 ? 1.6 : 1);

    // Telescopic air leg from the floor foot to the mount under the drill.
    tmp.mount.copy(LEG_MOUNT).applyQuaternion(drill.current.quaternion).add(drill.current.position);
    tmp.legSplit.copy(LEG_FOOT).lerp(tmp.mount, 0.55);
    placeBetween(legOuter.current, LEG_FOOT, tmp.legSplit, 0.045);
    placeBetween(legInner.current, tmp.legSplit, tmp.mount, 0.028);

    // Operator leans into the drill as it advances; hands ride the vibration.
    const jitter = drilling && !c.reducedMotion ? (Math.random() - 0.5) * 0.02 : 0;
    spine.current.rotation.x = OPERATOR.lean + advance * 1.2 + Math.sin(clock.elapsedTime * 1.3) * 0.01;
    arms.current.rotation.x = OPERATOR.arms - advance * 0.6 + jitter;

    // Flushing water, rock dust and chips blow back out of the collar while drilling.
    if (drilling) {
      s.emit -= dt;
      if (s.emit <= 0) {
        s.emit = s.boost > 0 ? 0.04 : 0.08;
        const i = s.hole;
        c.burst = { point: s.points[i].clone().addScaledVector(s.normals[i], 0.03), dir: s.normals[i], amount: s.boost > 0 ? 6 : 3, sparks: s.boost > 0 ? 0.25 : 0.08 };
      }
    }
  });

  return (
    <>
      <group ref={rig} position={RIG_POSITION} rotation={RIG_ROTATION}>
        <Shadowed cast receive={false} position={OPERATOR.position} rotation={[0, OPERATOR.yaw, 0]}>
          <MinerFigure spineRef={spine} armsRef={arms} lampShadow beam earMuffs respirator />
        </Shadowed>
        <Shadowed cast receive={false}>
          <group ref={drill} position={PIVOT}>
            <DrillBody steelRef={steel} spinRef={spin} bitRef={bit} />
          </group>
          <mesh ref={legOuter} geometry={unitCylinderZ}>
            <meshStandardMaterial color={SUIT} metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh ref={legInner} geometry={unitCylinderZ}>
            <meshStandardMaterial color={STEEL} metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={LEG_FOOT.toArray()} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.08, 10]} />
            <meshStandardMaterial color={NAVY} metalness={0.6} roughness={0.5} />
          </mesh>
        </Shadowed>
        <pointLight position={[0, 1.3, 1.1]} color={AMBER} intensity={1.2} distance={2.5} decay={2} />
      </group>
      <HoleMarks marks={marks} drilled={drilled} />
    </>
  );
}
