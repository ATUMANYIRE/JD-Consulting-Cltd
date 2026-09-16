import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { mineControls } from "./mineControls";
import { AMBER, NAVY, ORANGE, STEEL } from "./palette";
import { glowTexture, surfaceTextures } from "./textures";
import { deformedRock, displacedPlane, mulberry32 } from "./geometry";
import MinerFigure, { Pickaxe, Shovel } from "./MinerFigure";
import Shadowed from "./Shadowed";

const FOG = "#0a1d2b";
const SWING_PERIOD = 1.7;
const IMPACT_PHASE = 0.82;
const RAISED = -3.3;
const STRIKE = -1.0;

const lerp = THREE.MathUtils.lerp;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeIn = (t) => t * t * t;

// [arm rotation, torso lean] for a point in the swing cycle (0..1).
function swingPose(p) {
  if (p < 0.55) {
    const t = easeInOut(p / 0.55);
    return [lerp(STRIKE + 0.15, RAISED, t), lerp(0.3, -0.12, t)];
  }
  if (p < 0.7) {
    const t = (p - 0.55) / 0.15;
    return [RAISED - Math.sin(t * Math.PI) * 0.12, -0.12];
  }
  if (p < IMPACT_PHASE) {
    const t = easeIn((p - 0.7) / (IMPACT_PHASE - 0.7));
    return [lerp(RAISED, STRIKE, t), lerp(-0.12, 0.38, t)];
  }
  const t = (p - IMPACT_PHASE) / (1 - IMPACT_PHASE);
  return [STRIKE + Math.sin(t * Math.PI) * 0.12 + t * 0.15, lerp(0.38, 0.3, t)];
}

const oreMaterial = new THREE.MeshStandardMaterial({ color: ORANGE, emissive: AMBER, emissiveIntensity: 0.6, flatShading: true, roughness: 0.25, metalness: 0.35 });

function rockTextures(key, repeat) {
  return surfaceTextures({ key, size: 512, dark: "#0c1c28", light: "#465f71", scale: 6, speckle: 0.012, veins: "#9c6a33", repeat });
}

function SwingingMiner() {
  const spine = useRef();
  const arms = useRef();
  const pickHead = useRef();
  const phase = useRef(0.1);
  const boost = useRef(0);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const c = mineControls;
    const dt = Math.min(delta, 0.05);
    if (c.strike) {
      boost.current = 2.4;
      c.strike = false;
    }
    boost.current = Math.max(0, boost.current - dt);
    const speed = (c.reducedMotion ? 0.4 : 1) * (boost.current > 0 ? 2.1 : 1);

    const prev = phase.current;
    let next = prev + (dt * speed) / SWING_PERIOD;
    const wrapped = next >= 1;
    if (wrapped) next -= 1;
    phase.current = next;

    const [arm, lean] = swingPose(next);
    arms.current.rotation.x = arm;
    spine.current.rotation.x = lean;

    if (prev < IMPACT_PHASE && (next >= IMPACT_PHASE || wrapped)) {
      pickHead.current.getWorldPosition(hit);
      c.burst = { point: hit.clone(), amount: boost.current > 0 ? 28 : 18 };
      c.flash = 1;
      c.shake = boost.current > 0 ? 0.12 : 0.05;
    }
  });

  return (
    <Shadowed cast receive={false} position={[1.6, 0, 0.3]} rotation={[0, Math.PI / 2, 0]}>
      <MinerFigure spineRef={spine} armsRef={arms} lampShadow beam tool={<Pickaxe headRef={pickHead} />} />
    </Shadowed>
  );
}

function ShovelWorker() {
  const spine = useRef();
  const arms = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    spine.current.rotation.x = 0.08 + Math.sin(t * 1.4) * 0.02;
    spine.current.rotation.y = Math.sin(t * 0.35) * 0.25;
    arms.current.rotation.x = -0.55;
  });
  return (
    <Shadowed cast receive={false} position={[-1.35, 0, -4.2]} rotation={[0, 0.7, 0]}>
      <MinerFigure spineRef={spine} armsRef={arms}>
        <Shovel />
      </MinerFigure>
    </Shadowed>
  );
}

const boulders = [
  { position: [3.7, 0.5, 0.3], radius: 1.1, seed: 1 },
  { position: [4.2, 2.1, -0.4], radius: 1.2, seed: 2 },
  { position: [3.6, 0.4, 1.9], radius: 0.8, seed: 3 },
  { position: [4.6, 1.4, 1.6], radius: 1.1, seed: 4 },
  { position: [4.1, 0.6, -1.7], radius: 1.0, seed: 5 },
  { position: [4.9, 3.3, 0.9], radius: 1.1, seed: 6 },
  { position: [4.8, 3.2, -1.9], radius: 1.2, seed: 9 },
  { position: [4.5, 0.8, -3.6], radius: 1.3, seed: 10 },
  { position: [2.9, 0.12, -0.9], radius: 0.25, seed: 7 },
  { position: [2.5, 0.1, 1.2], radius: 0.18, seed: 8 },
];

const ore = [
  { position: [2.72, 0.55, 0.45], rotation: [0.2, 0, Math.PI / 2 + 0.2], radius: 0.1, height: 0.32 },
  { position: [2.82, 0.95, 0.05], rotation: [-0.3, 0, Math.PI / 2 - 0.1], radius: 0.08, height: 0.26 },
  { position: [3.05, 1.55, -0.7], rotation: [0.1, 0, Math.PI / 2 + 0.3], radius: 0.12, height: 0.36 },
  { position: [3.0, 0.3, 1.3], rotation: [0.4, 0, Math.PI / 2], radius: 0.07, height: 0.22 },
  { position: [3.4, 2.4, 0.5], rotation: [-0.2, 0, Math.PI / 2 - 0.3], radius: 0.1, height: 0.3 },
  { position: [3.3, 1.2, -2.2], rotation: [0.3, 0, Math.PI / 2 + 0.1], radius: 0.09, height: 0.28 },
];

function RockFace() {
  const geometries = useMemo(() => boulders.map((b) => deformedRock(b.radius, b.seed)), []);
  const rock = rockTextures("mine-rock", 1);

  useFrame(({ clock }, delta) => {
    mineControls.flash = Math.max(0, mineControls.flash - delta * 2.5);
    oreMaterial.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 2) * 0.15 + mineControls.flash * 2.5;
  });

  return (
    <Shadowed>
      {boulders.map((b, i) => (
        <mesh key={b.seed} geometry={geometries[i]} position={b.position}>
          <meshStandardMaterial map={rock.map} bumpMap={rock.bump} bumpScale={4} roughness={0.92} />
        </mesh>
      ))}
      {ore.map((o, i) => (
        <group key={i} position={o.position} rotation={o.rotation}>
          <mesh position={[0, o.height / 2, 0]} material={oreMaterial}>
            <cylinderGeometry args={[o.radius, o.radius * 1.1, o.height, 6]} />
          </mesh>
          <mesh position={[0, o.height + o.radius * 0.9, 0]} material={oreMaterial}>
            <coneGeometry args={[o.radius, o.radius * 1.8, 6]} />
          </mesh>
        </group>
      ))}
    </Shadowed>
  );
}

function Sparks() {
  const COUNT = 70;
  const mesh = useRef();
  const next = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => ({ spark: new THREE.Color(AMBER), hot: new THREE.Color("#fff1d6"), chip: new THREE.Color("#2d4556") }), []);
  const particles = useRef(Array.from({ length: COUNT }, () => ({ life: 0, maxLife: 1, size: 1, spark: true, pos: new THREE.Vector3(), vel: new THREE.Vector3() })));

  useLayoutEffect(() => {
    for (let i = 0; i < COUNT; i++) mesh.current.setColorAt(i, colors.spark);
    mesh.current.instanceColor.needsUpdate = true;
  }, [colors]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const c = mineControls;
    if (c.burst) {
      for (let n = 0; n < c.burst.amount; n++) {
        const i = next.current;
        next.current = (i + 1) % COUNT;
        const p = particles.current[i];
        p.spark = Math.random() > 0.35;
        p.life = p.maxLife = 0.45 + Math.random() * 0.55;
        p.size = p.spark ? 0.5 + Math.random() * 0.6 : 0.9 + Math.random() * 1.3;
        p.pos.copy(c.burst.point);
        p.vel.set(-(0.5 + Math.random() * 2.2), 0.6 + Math.random() * 2.4, (Math.random() - 0.5) * 2.2);
        mesh.current.setColorAt(i, p.spark ? (Math.random() > 0.5 ? colors.hot : colors.spark) : colors.chip);
      }
      mesh.current.instanceColor.needsUpdate = true;
      c.burst = null;
    }
    particles.current.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt;
        p.vel.y -= 6 * dt;
        p.pos.addScaledVector(p.vel, dt);
        if (p.pos.y < 0.03) {
          p.pos.y = 0.03;
          p.vel.multiplyScalar(0.5);
          p.vel.y = Math.abs(p.vel.y) * 0.4;
        }
      }
      dummy.position.copy(p.pos);
      dummy.rotation.set(p.pos.x * 5, p.pos.y * 5, 0);
      dummy.scale.setScalar(p.life > 0 ? 0.035 * p.size * (p.spark ? p.life / p.maxLife : 1) : 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

const leftWall = displacedPlane(30, 6, 60, 0.45, 2);
const rightWall = displacedPlane(30, 6, 60, 0.45, 5);
const ceiling = displacedPlane(14, 30, 60, 0.3, 8);
const floor = displacedPlane(16, 30, 80, 0.05, 3);

function Tunnel() {
  const wall = rockTextures("mine-wall", 4);
  const ground = surfaceTextures({ key: "mine-floor", size: 512, dark: "#08141d", light: "#2c4150", scale: 14, speckle: 0.06, repeat: 5 });
  const wood = surfaceTextures({ key: "timber", dark: "#3e2616", light: "#7a5232", scale: 4, veins: "#2c1a0e" });
  const timber = <meshStandardMaterial map={wood.map} bumpMap={wood.bump} bumpScale={2} roughness={0.9} />;
  const wallMaterial = <meshStandardMaterial map={wall.map} bumpMap={wall.bump} bumpScale={5} roughness={0.95} color="#b9c7d2" />;
  const frames = [-3.2, -7.5, -11.8, -16.1];
  const sleepers = Array.from({ length: 26 }, (_, i) => 3.5 - i * 0.8);

  return (
    <group>
      <mesh geometry={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0, -6]} receiveShadow>
        <meshStandardMaterial map={ground.map} bumpMap={ground.bump} bumpScale={3} roughness={0.85} />
      </mesh>
      <mesh geometry={leftWall} rotation={[0, Math.PI / 2, 0]} position={[-4.6, 2.5, -6]} receiveShadow>
        {wallMaterial}
      </mesh>
      <mesh geometry={rightWall} rotation={[0, -Math.PI / 2, 0]} position={[6.3, 2.5, -6]} receiveShadow>
        {wallMaterial}
      </mesh>
      <mesh geometry={ceiling} rotation={[Math.PI / 2, 0, 0]} position={[0.8, 4.3, -6]}>
        {wallMaterial}
      </mesh>
      {[-1.8, 2.7].map((x, i) => (
        <mesh key={x} position={[x, 0.012, [1.5, -2.6][i]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[[0.7, 0.5][i], 40]} />
          <meshStandardMaterial color="#284a60" metalness={0.25} roughness={0.12} transparent opacity={0.85} />
        </mesh>
      ))}

      <Shadowed>
        {frames.map((z) => (
          <group key={z} position={[0, 0, z]}>
            {[-3.9, 5.4].map((x) => (
              <mesh key={x} position={[x, 1.85, 0]}>
                <boxGeometry args={[0.3, 3.7, 0.3]} />
                {timber}
              </mesh>
            ))}
            <mesh position={[0.75, 3.75, 0]}>
              <boxGeometry args={[9.6, 0.32, 0.32]} />
              {timber}
            </mesh>
            {[
              [-3.55, 1],
              [5.05, -1],
            ].map(([x, s]) => (
              <mesh key={x} position={[x, 3.38, 0]} rotation={[0, 0, s * (Math.PI / 4)]}>
                <boxGeometry args={[0.16, 0.9, 0.16]} />
                {timber}
              </mesh>
            ))}
          </group>
        ))}
        {sleepers.map((z) => (
          <mesh key={z} position={[0.1, 0.04, z]}>
            <boxGeometry args={[1.15, 0.07, 0.2]} />
            {timber}
          </mesh>
        ))}
        {[-0.2, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.11, -6.5]}>
            <boxGeometry args={[0.06, 0.07, 21]} />
            <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.35} />
          </mesh>
        ))}
      </Shadowed>
    </group>
  );
}

const cartGeometry = (() => {
  const geo = new THREE.CylinderGeometry(0.62, 0.48, 1, 4, 1, true);
  geo.rotateY(Math.PI / 4);
  return geo;
})();

function MineCart() {
  const ref = useRef();
  const rock = rockTextures("mine-rock", 1);
  const lumps = useMemo(() => {
    const rand = mulberry32(12);
    return Array.from({ length: 9 }, (_, i) => ({
      geometry: deformedRock(0.1 + rand() * 0.08, i + 20, 1, 0.3),
      position: [(rand() - 0.5) * 0.6, 0.8 + rand() * 0.12, (rand() - 0.5) * 0.8],
      ore: rand() > 0.55,
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = mineControls.reducedMotion ? 0 : clock.elapsedTime;
    ref.current.position.z = -5.4 + Math.sin(t * 0.22) * 3.2;
  });

  return (
    <group ref={ref} position={[0.1, 0, -5.4]}>
      <Shadowed>
        <mesh geometry={cartGeometry} position={[0, 0.58, 0]} scale={[1.05, 0.5, 1.35]}>
          <meshStandardMaterial color="#2f506b" metalness={0.7} roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.66, 0.03, 0.9]} />
          <meshStandardMaterial color="#1d3346" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.84, 0]}>
          <boxGeometry args={[0.92, 0.04, 1.2]} />
          <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.35} />
        </mesh>
        {lumps.map((lump, i) => (
          <mesh key={i} geometry={lump.geometry} position={lump.position}>
            {lump.ore ? (
              <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.3} roughness={0.4} metalness={0.3} flatShading />
            ) : (
              <meshStandardMaterial map={rock.map} bumpMap={rock.bump} bumpScale={3} roughness={0.9} />
            )}
          </mesh>
        ))}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <group key={`${sx}${sz}`} position={[sx * 0.3, 0.17, sz * 0.4]} rotation={[0, 0, Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[0.15, 0.15, 0.07, 20]} />
                <meshStandardMaterial color="#0d1822" metalness={0.6} roughness={0.5} />
              </mesh>
              <mesh position={[0, sx * 0.04, 0]}>
                <cylinderGeometry args={[0.17, 0.17, 0.02, 20]} />
                <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.35} />
              </mesh>
            </group>
          ))
        )}
      </Shadowed>
    </group>
  );
}

function Equipment() {
  const wood = surfaceTextures({ key: "timber", dark: "#3e2616", light: "#7a5232", scale: 4, veins: "#2c1a0e" });
  const barrels = [
    { position: [-2.7, 0.45, -1.9], color: ORANGE },
    { position: [-3.35, 0.45, -1.3], color: "#2f506b" },
    { position: [-2.5, 0.3, -0.7], color: ORANGE, rotation: [0, 0.6, Math.PI / 2] },
  ];
  const crates = [
    { position: [-3.3, 0.4, -5.2], rotation: 0.2, size: 0.8 },
    { position: [-3.25, 1.12, -5.15], rotation: -0.15, size: 0.64 },
    { position: [-2.45, 0.32, -5.6], rotation: 0.5, size: 0.64 },
  ];

  const ribs = useRef();
  const RIBS = 28;
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < RIBS; i++) {
      dummy.position.set(0, 0, 3.5 - i * 0.75);
      dummy.updateMatrix();
      ribs.current.setMatrixAt(i, dummy.matrix);
    }
    ribs.current.instanceMatrix.needsUpdate = true;
  }, []);

  const cable = useMemo(() => {
    const points = [];
    for (let z = 3.5; z >= -17; z -= 0.5) {
      const local = ((z % 4.3) + 4.3) % 4.3;
      points.push(new THREE.Vector3(5.15, 3.45 - Math.sin((local / 4.3) * Math.PI) * 0.35, z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 200, 0.022, 6, false);
  }, []);

  return (
    <Shadowed>
      {barrels.map((barrel, i) => (
        <group key={i} position={barrel.position} rotation={barrel.rotation ?? [0, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.9, 28]} />
            <meshStandardMaterial color={barrel.color} metalness={0.55} roughness={0.55} />
          </mesh>
          {[-0.28, 0.28].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.305, 0.018, 8, 28]} />
              <meshStandardMaterial color={barrel.color} metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.451, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.28, 28]} />
            <meshStandardMaterial color="#1b2a35" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {crates.map((crate, i) => (
        <group key={i} position={crate.position} rotation={[0, crate.rotation, 0]}>
          <mesh>
            <boxGeometry args={[crate.size, crate.size, crate.size]} />
            <meshStandardMaterial map={wood.map} bumpMap={wood.bump} bumpScale={2} roughness={0.9} color="#caa27a" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, s * (crate.size / 2 - 0.04), crate.size / 2 + 0.005]}>
              <boxGeometry args={[crate.size, 0.07, 0.02]} />
              <meshStandardMaterial map={wood.map} roughness={0.9} color="#8a6848" />
            </mesh>
          ))}
          <mesh position={[0, 0, crate.size / 2 + 0.006]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[crate.size * 1.25, 0.06, 0.02]} />
            <meshStandardMaterial map={wood.map} roughness={0.9} color="#8a6848" />
          </mesh>
        </group>
      ))}
      <group position={[-3.0, 3.35, 0]}>
        <mesh position={[0, 0, -6.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 21, 24, 1, true]} />
          <meshStandardMaterial color={AMBER} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <instancedMesh ref={ribs} args={[undefined, undefined, RIBS]}>
          <torusGeometry args={[0.285, 0.022, 8, 24]} />
          <meshStandardMaterial color="#b56d20" roughness={0.8} />
        </instancedMesh>
      </group>
      <mesh geometry={cable}>
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <group position={[3.2, 0.55, 2.2]} rotation={[0.1, -0.4, -0.35]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
          <meshStandardMaterial map={wood.map} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.66, 0.02]} scale={[1, 1, 0.25]}>
          <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Shadowed>
  );
}

const pebbleGeometry = new THREE.IcosahedronGeometry(1, 0);

function Gravel() {
  const ref = useRef();
  const COUNT = 320;
  const rock = rockTextures("mine-rock", 1);
  useLayoutEffect(() => {
    const rand = mulberry32(7);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const nearWall = i < 140;
      const x = nearWall ? 2.2 + rand() * 1.4 : -4 + rand() * 9.5;
      const z = nearWall ? -2.5 + rand() * 5 : -14 + rand() * 17;
      const s = (nearWall ? 0.03 : 0.02) + rand() * (nearWall ? 0.09 : 0.05);
      dummy.position.set(x, s * 0.4, z);
      dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      dummy.scale.set(s, s * (0.6 + rand() * 0.5), s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[pebbleGeometry, undefined, COUNT]} castShadow receiveShadow>
      <meshStandardMaterial map={rock.map} roughness={0.9} flatShading />
    </instancedMesh>
  );
}

function Lantern({ position, offset = 0, shadow = false }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset;
    const flicker = mineControls.reducedMotion ? 0 : Math.sin(t * 13) * 0.8 + Math.sin(t * 7.3) * 0.6;
    light.current.intensity = 20 + flicker;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
        <meshBasicMaterial color="#05090c" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <coneGeometry args={[0.14, 0.1, 12]} />
        <meshStandardMaterial color="#1b2a35" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.09, 0.18, 12]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      <spotLight ref={light} color={AMBER} angle={1.1} penumbra={1} distance={9} decay={2} intensity={14} castShadow={shadow} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} target={target} />
      <primitive object={target} position={[0.3, -3, 1.4]} />
      <pointLight color={AMBER} intensity={3} distance={4} decay={2} />
    </group>
  );
}

// Scroll-driven fly-through: wide shot, rock face close-up, turn down the tunnel, head for the exit glow.
const CAMERA_PATH = [
  { at: 0, pos: [-0.6, 1.8, 7.2], look: [-0.2, 1.1, -0.4] },
  { at: 0.33, pos: [0.15, 1.65, 3.7], look: [2.8, 1.0, 0.1] },
  { at: 0.66, pos: [0.35, 1.55, 1.9], look: [0.6, 0.9, -6] },
  { at: 1, pos: [0.8, 1.3, -8.5], look: [0.8, 1.2, -20] },
];
const NARROW_START = { pos: [2.0, 2.0, 9.5], look: [2.2, 1.0, 0] };
const smoothstep = (t) => t * t * (3 - 2 * t);

function samplePath(progress, narrow, key) {
  let i = 0;
  while (i < CAMERA_PATH.length - 2 && progress > CAMERA_PATH[i + 1].at) i++;
  const from = i === 0 && narrow ? NARROW_START : CAMERA_PATH[i];
  const to = CAMERA_PATH[i + 1];
  const t = smoothstep(THREE.MathUtils.clamp((progress - CAMERA_PATH[i].at) / (to.at - CAMERA_PATH[i].at), 0, 1));
  return [0, 1, 2].map((k) => lerp(from[key][k], to[key][k], t));
}

const backWall = displacedPlane(12, 6, 30, 0.4, 13);

function TunnelExit() {
  const glow = useRef();
  const wall = rockTextures("mine-wall", 4);
  useFrame(({ clock }) => {
    glow.current.material.opacity = 0.55 + Math.sin(clock.elapsedTime * 1.3) * 0.08;
  });
  return (
    <group>
      <mesh geometry={backWall} position={[0.8, 2.5, -21.2]}>
        <meshStandardMaterial map={wall.map} bumpMap={wall.bump} bumpScale={5} roughness={0.95} color="#b9c7d2" />
      </mesh>
      <mesh ref={glow} position={[0.8, 1.9, -20.9]} renderOrder={3}>
        <planeGeometry args={[9, 6]} />
        <meshBasicMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const lookAt = useRef(null);

  useFrame((state, delta) => {
    const c = mineControls;
    const dt = Math.min(delta, 0.05);
    const narrow = state.size.width < 768;
    const cam = state.camera;
    const fov = narrow ? 55 : 40;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const progress = THREE.MathUtils.clamp(c.scroll, 0, 1);
    const pos = samplePath(progress, narrow, "pos");
    const target = samplePath(progress, narrow, "look");
    const px = c.reducedMotion ? 0 : c.pointer.x;
    const py = c.reducedMotion ? 0 : c.pointer.y;

    cam.position.x = THREE.MathUtils.damp(cam.position.x, pos[0] + px * 0.35, 2.6, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, pos[1] + py * 0.2, 2.6, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, pos[2], 2.6, dt);

    c.shake = Math.max(0, c.shake - dt * 0.6);
    if (c.shake > 0 && !c.reducedMotion) {
      cam.position.x += (Math.random() - 0.5) * c.shake;
      cam.position.y += (Math.random() - 0.5) * c.shake;
    }

    if (!lookAt.current) lookAt.current = new THREE.Vector3(...target);
    lookAt.current.x = THREE.MathUtils.damp(lookAt.current.x, target[0], 2.6, dt);
    lookAt.current.y = THREE.MathUtils.damp(lookAt.current.y, target[1], 2.6, dt);
    lookAt.current.z = THREE.MathUtils.damp(lookAt.current.z, target[2], 2.6, dt);
    cam.lookAt(lookAt.current);
  });

  return null;
}

export function MineWorld() {
  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 8, 24]} />
      <hemisphereLight args={["#6f93b8", "#3a2410", 0.7]} />
      <directionalLight position={[-3, 5, 6]} intensity={0.9} />
      <directionalLight position={[5, 4, -5]} intensity={1.1} color="#9cc3e6" />
      <Environment resolution={64} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={2} color={AMBER} position={[1, 3, -2]} scale={[3, 1, 1]} />
        <Lightformer form="rect" intensity={1} color="#8fb3d9" position={[-4, 2, 4]} scale={[4, 2, 1]} />
      </Environment>
      <CameraRig />
      <Tunnel />
      <Gravel />
      <Equipment />
      <MineCart />
      <RockFace />
      <SwingingMiner />
      <ShovelWorker />
      <Sparks />
      <Lantern position={[1.0, 3.0, -1.6]} shadow />
      <Lantern position={[3.8, 3.0, -7.5]} offset={2} />
      <Lantern position={[-1.8, 3.0, -11.8]} offset={4} />
      <TunnelExit />
      <pointLight position={[0.8, 2, -18.5]} color={AMBER} intensity={30} distance={14} decay={2} />
      <Sparkles count={160} scale={[14, 4, 12]} position={[0.5, 1.8, -3]} size={2.2} speed={0.22} opacity={0.55} color={AMBER} />
      <Sparkles count={40} scale={[1.4, 1.2, 1.6]} position={[2.6, 1.0, 0.3]} size={1.6} speed={0.4} opacity={0.8} color="#fff1d6" />
    </>
  );
}

export default function MineScene({ active }) {
  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "never"}
      camera={{ position: [-0.6, 1.8, 7.2], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.45 }}
      style={{ background: NAVY }}
    >
      <MineWorld />
    </Canvas>
  );
}
