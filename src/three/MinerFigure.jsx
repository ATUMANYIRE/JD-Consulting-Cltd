import { useMemo } from "react";
import * as THREE from "three";
import { hardHatGeometries, segment } from "./geometry";
import { ORANGE, REFLECTIVE, SKIN, STEEL, SUIT } from "./palette";

// A miner in full PPE: hard hat with cap lamp, safety glasses, hi-vis vest over navy coveralls with
// reflective bands, work gloves and safety boots, optional ear defenders and half-mask respirator.
// Proportions follow a ~1.8 m adult. The legs are posed by a small solver so the boots always sit
// flat on the floor, whatever the stance.
//
// Animation hooks (unchanged for the scene code): `spineRef` rotates the upper body at the hips,
// `armsRef` swings both arms at the shoulders; `tool` is rendered inside the arms group.

const RUBBER = "#11181e";
const SOLE = "#060a0d";
const GLOVE = "#a7834f";
const GLOVE_CUFF = "#7a5a32";
const BELT = "#1d1712";
const VEST = ORANGE;

const THIGH = 0.46;
const SHIN = 0.44;
const ANKLE = 0.1; // ankle joint height above the floor

const reflective = <meshStandardMaterial color={REFLECTIVE} emissive="#ffffff" emissiveIntensity={0.3} roughness={0.35} />;

// Stances: hip height and, per leg (left, right), forward swing of the thigh and outward splay.
// The knee bend is solved so each boot reaches the floor.
const STANCES = {
  stand: { hip: 0.985, legs: [{ swing: 0.06, splay: 0.05 }, { swing: -0.04, splay: -0.05 }] },
  brace: { hip: 0.93, legs: [{ swing: 0.42, splay: 0.12 }, { swing: -0.3, splay: -0.08 }] },
};

// Arm shapes in the arms group (x is mirrored per side): shoulder, elbow, wrist.
const ARMS = {
  // Near-straight reach, elbows tucked: rotate the arms group forward to grip a tool ahead.
  reach: { elbow: [0.215, -0.28, -0.035], wrist: [0.09, -0.53, 0.05] },
  // Upper arms hanging, forearms forward: holds something at chest height with the group upright.
  hold: { elbow: [0.215, -0.27, -0.03], wrist: [0.11, -0.31, 0.25] },
};
const SHOULDER_X = 0.19;

// Torso outline from the belt (y = 0) to the base of the neck, revolved and flattened front to back.
const TORSO_PROFILE = [
  [0.0, 0.0], [0.168, 0.0], [0.162, 0.08], [0.168, 0.2], [0.188, 0.31], [0.198, 0.4], [0.198, 0.47], [0.188, 0.515], [0.155, 0.56], [0.1, 0.59], [0.06, 0.605], [0.0, 0.608],
];
const DEPTH = 0.7;

function revolve(profile, grow = 0, from = 0, to = Infinity) {
  const points = profile.filter(([, y]) => y >= from && y <= to).map(([r, y]) => new THREE.Vector2(r > 0 ? r + grow : 0, y));
  const geo = new THREE.LatheGeometry(points, 40);
  geo.scale(1, 1, DEPTH);
  geo.computeVertexNormals();
  return geo;
}

// Radius of the torso at height y, for wrapping straps and bands around it.
function torsoRadius(y) {
  for (let i = 1; i < TORSO_PROFILE.length; i++) {
    const [r1, y1] = TORSO_PROFILE[i];
    const [r0, y0] = TORSO_PROFILE[i - 1];
    if (y <= y1 && y1 > y0) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return 0;
}

// A band hugging the torso between two heights.
function bandGeometry(y0, y1, grow) {
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const y = y0 + ((y1 - y0) * i) / 4;
    pts.push(new THREE.Vector2(torsoRadius(y) + grow, y));
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  geo.scale(1, 1, DEPTH);
  geo.computeVertexNormals();
  return geo;
}

// A strap running over one shoulder, from the front of the vest to the back, on the oval surface.
function strapGeometry(side) {
  const x = side * 0.105;
  const front = (y) => DEPTH * Math.sqrt(Math.max(0, (torsoRadius(y) + 0.02) ** 2 - x * x)) + 0.004;
  const points = [
    new THREE.Vector3(x, 0.36, front(0.36)),
    new THREE.Vector3(x * 1.02, 0.5, front(0.5)),
    new THREE.Vector3(x * 1.05, 0.585, 0.06),
    new THREE.Vector3(x * 1.05, 0.59, -0.02),
    new THREE.Vector3(x * 1.02, 0.5, -front(0.5)),
    new THREE.Vector3(x, 0.36, -front(0.36)),
  ];
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.017, 6, false);
}

const shared = (() => {
  const geo = {
    torso: revolve(TORSO_PROFILE),
    vest: bandGeometry(0.05, 0.5, 0.012),
    bands: [bandGeometry(0.15, 0.19, 0.016), bandGeometry(0.31, 0.35, 0.016)],
    straps: [strapGeometry(-1), strapGeometry(1)],
    belt: bandGeometry(-0.01, 0.06, 0.008),
  };
  // Wrap-around safety glasses: a short arc of a cylinder in front of the eyes.
  geo.glasses = new THREE.CylinderGeometry(0.112, 0.112, 0.036, 24, 1, true, -Math.PI * 0.42, Math.PI * 0.84);
  return geo;
})();

const lampBeam = (() => {
  const geo = new THREE.ConeGeometry(0.9, 3.2, 32, 1, true);
  geo.translate(0, -1.6, 0);
  return geo;
})();
const beamQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.2, 1).normalize());

// A tapered limb segment between two points, with rounded ends.
function Limb({ from, to, top, bottom, children }) {
  const { position, length, quaternion } = segment(from, to);
  return (
    <>
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[bottom, top, length, 14]} />
        {children}
      </mesh>
      <mesh position={to}>
        <sphereGeometry args={[bottom, 14, 10]} />
        {children}
      </mesh>
    </>
  );
}

// A reflective band around a limb at fraction `at` along it.
function LimbBand({ from, to, at, radius }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const { quaternion } = segment(from, to);
  return (
    <mesh position={a.lerp(b, at).toArray()} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, 0.04, 14, 1, true]} />
      {reflective}
    </mesh>
  );
}

function Boot() {
  return (
    <group>
      <mesh position={[0, 0.02, -0.005]}>
        <cylinderGeometry args={[0.068, 0.075, 0.17, 16]} />
        <meshStandardMaterial color={RUBBER} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.045, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 0.75]}>
        <capsuleGeometry args={[0.06, 0.15, 6, 14]} />
        <meshStandardMaterial color={RUBBER} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.088, 0.06]}>
        <boxGeometry args={[0.145, 0.025, 0.3]} />
        <meshStandardMaterial color={SOLE} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Leg({ side, swing, splay, hip }) {
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;
  // Solve the knee so the ankle sits ANKLE above the floor: THIGH·cos(s) + SHIN·cos(s - k) = reach.
  const reach = hip - ANKLE;
  const cosShin = Math.min(1, Math.max(-1, (reach / Math.cos(splay) - THIGH * Math.cos(swing)) / SHIN));
  const knee = swing + Math.acos(cosShin);
  return (
    <group position={[side * 0.1, 0, 0]} rotation={[-swing, 0, -side * splay]}>
      <Limb from={[0, 0.02, 0]} to={[0, -THIGH, 0]} top={0.092} bottom={0.072}>
        {suit}
      </Limb>
      <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
        <Limb from={[0, 0, 0]} to={[0, -SHIN, 0]} top={0.07} bottom={0.056}>
          {suit}
        </Limb>
        <LimbBand from={[0, 0, 0]} to={[0, -SHIN, 0]} at={0.45} radius={0.066} />
        <group position={[0, -SHIN, 0]} rotation={[swing - knee, 0, side * splay]}>
          <Boot />
        </group>
      </group>
    </group>
  );
}

function Glove({ side }) {
  return (
    <group>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.043, 0.047, 0.05, 14]} />
        <meshStandardMaterial color={GLOVE_CUFF} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.07, 0.005]} scale={[0.85, 1.25, 0.6]}>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial color={GLOVE} roughness={0.9} />
      </mesh>
      <mesh position={[side * -0.03, 0.055, 0.025]} rotation={[-0.5, 0, side * -0.6]}>
        <capsuleGeometry args={[0.014, 0.035, 4, 8]} />
        <meshStandardMaterial color={GLOVE} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Arm({ side, shape }) {
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;
  const mirror = ([x, y, z]) => [side * x, y, z];
  const shoulder = [side * SHOULDER_X, 0, 0];
  const elbow = mirror(shape.elbow);
  const wrist = mirror(shape.wrist);
  const { quaternion } = segment(elbow, wrist);
  return (
    <group>
      <mesh position={[shoulder[0] * 0.93, 0.005, 0]} scale={[1, 0.85, 1.1]}>
        <sphereGeometry args={[0.064, 16, 12]} />
        {suit}
      </mesh>
      <Limb from={shoulder} to={elbow} top={0.06} bottom={0.052}>
        {suit}
      </Limb>
      <Limb from={elbow} to={wrist} top={0.052} bottom={0.043}>
        {suit}
      </Limb>
      <LimbBand from={elbow} to={wrist} at={0.55} radius={0.052} />
      <group position={wrist} quaternion={quaternion}>
        <Glove side={side} />
      </group>
    </group>
  );
}

function EarDefenders() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.118, -0.005, -0.005]}>
          <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.2]}>
            <cylinderGeometry args={[0.043, 0.047, 0.04, 20]} />
            <meshStandardMaterial color={ORANGE} roughness={0.45} />
          </mesh>
          <mesh position={[s * -0.022, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.012, 20]} />
            <meshStandardMaterial color="#1a2229" roughness={0.7} />
          </mesh>
          {/* Arm from the cup up into the helmet's accessory slot. */}
          <mesh position={[s * 0.012, 0.065, 0]} rotation={[0, 0, s * -0.12]}>
            <boxGeometry args={[0.012, 0.09, 0.022]} />
            <meshStandardMaterial color="#1a2229" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Respirator() {
  return (
    <group position={[0, -0.055, 0.082]}>
      <mesh scale={[0.95, 0.9, 0.62]}>
        <sphereGeometry args={[0.062, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#3b434a" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.012, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.018, 0.02, 14]} />
        <meshStandardMaterial color="#22292f" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.058, -0.012, 0.012]} rotation={[Math.PI / 2, 0, s * 0.9]}>
          <cylinderGeometry args={[0.027, 0.027, 0.026, 18]} />
          <meshStandardMaterial color="#c9ced3" roughness={0.5} />
        </mesh>
      ))}
      {/* Head straps */}
      {[-1, 1].map((s) => (
        <mesh key={`strap${s}`} position={[s * 0.07, 0.02, -0.07]} rotation={[0, s * 0.9, 0]}>
          <boxGeometry args={[0.008, 0.012, 0.11]} />
          <meshStandardMaterial color="#20262b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Head({ lampTarget, lampShadow, beam, earMuffs, respirator }) {
  const { shell, ridge } = hardHatGeometries();
  const skin = <meshStandardMaterial color={SKIN} roughness={0.6} />;
  return (
    <group position={[0, 0.735, 0.012]}>
      {/* Cranium and jaw */}
      <mesh scale={[0.93, 1.08, 1.02]}>
        <sphereGeometry args={[0.104, 28, 22]} />
        {skin}
      </mesh>
      <mesh position={[0, -0.058, 0.03]} scale={[0.8, 0.62, 0.8]}>
        <sphereGeometry args={[0.085, 20, 14]} />
        {skin}
      </mesh>
      <mesh position={[0, -0.005, 0.104]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
        <coneGeometry args={[0.019, 0.042, 10]} />
        {skin}
      </mesh>
      {!respirator && (
        <mesh position={[0, -0.06, 0.092]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.005, 0.03, 3, 6]} />
          <meshStandardMaterial color="#3b2416" roughness={0.7} />
        </mesh>
      )}
      {!earMuffs &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.097, -0.005, -0.005]} scale={[0.45, 1, 0.75]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            {skin}
          </mesh>
        ))}
      {/* Safety glasses */}
      <mesh geometry={shared.glasses} position={[0, 0.022, 0]}>
        <meshPhysicalMaterial color="#1b2a35" metalness={0.3} roughness={0.08} clearcoat={1} transparent opacity={0.88} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.104, 0.025, -0.03]} rotation={[0, s * 0.12, 0]}>
          <boxGeometry args={[0.005, 0.008, 0.07]} />
          <meshStandardMaterial color="#1b2a35" roughness={0.4} />
        </mesh>
      ))}
      {earMuffs && <EarDefenders />}
      {respirator && <Respirator />}

      {/* Hard hat with cap lamp */}
      <group position={[0, 0.042, -0.004]} scale={0.185}>
        <mesh geometry={shell}>
          <meshPhysicalMaterial color={ORANGE} roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={ridge}>
          <meshPhysicalMaterial color={ORANGE} roughness={0.35} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.34, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.16, 0.2, 20]} />
          <meshStandardMaterial color="#1f2d36" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.34, 0.961]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.125, 20]} />
          <meshBasicMaterial color="#fff6e0" toneMapped={false} />
        </mesh>
        {/* Reflective decal on the side of the shell */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.705, 0.24, 0]} rotation={[0, s * (Math.PI / 2), 0]}>
            <planeGeometry args={[0.32, 0.07]} />
            {reflective}
          </mesh>
        ))}
      </group>

      <spotLight
        position={[0, 0.105, 0.17]}
        target={lampTarget}
        angle={0.45}
        penumbra={0.75}
        intensity={36}
        distance={7}
        decay={2}
        color="#fff1d6"
        castShadow={lampShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      />
      <primitive object={lampTarget} position={[0, -0.8, 3]} />
      {beam && (
        <mesh geometry={lampBeam} position={[0, 0.105, 0.17]} quaternion={beamQuaternion} renderOrder={2}>
          <meshBasicMaterial color="#ffe9c4" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// Supervisor's field tablet, held in both hands at chest height (lives in the arms group, `hold` arms).
export function Tablet() {
  return (
    <group position={[0, -0.335, 0.33]} rotation={[-0.55, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.27, 0.018, 0.19]} />
        <meshStandardMaterial color="#141c22" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.245, 0.165]} />
        <meshBasicMaterial color="#9cc3e6" toneMapped={false} />
      </mesh>
      <mesh position={[-0.05, 0.01, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 0.02]} />
        <meshBasicMaterial color={ORANGE} toneMapped={false} />
      </mesh>
      <mesh position={[0.06, 0.01, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 0.05]} />
        <meshBasicMaterial color="#e8f1f8" toneMapped={false} />
      </mesh>
    </group>
  );
}

// Personal gas monitor clipped to the vest (lives in the spine group).
export function GasDetector() {
  return (
    <group position={[0.11, 0.43, 0.15]} rotation={[-0.08, 0.25, 0]}>
      <mesh>
        <boxGeometry args={[0.06, 0.09, 0.03]} />
        <meshStandardMaterial color="#f2c230" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.015, 0.016]}>
        <planeGeometry args={[0.04, 0.028]} />
        <meshBasicMaterial color="#0b1620" />
      </mesh>
      <mesh position={[0, -0.025, 0.016]}>
        <circleGeometry args={[0.007, 10]} />
        <meshBasicMaterial color="#4ade80" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function MinerFigure({
  spineRef,
  armsRef,
  children,
  stance = "stand",
  arms = "reach",
  lampShadow = false,
  beam = false,
  earMuffs = false,
  respirator = false,
  tool = null,
}) {
  const lampTarget = useMemo(() => new THREE.Object3D(), []);
  const pose = STANCES[stance];
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;
  // Cap-lamp cable: from the back of the helmet, down the back of the vest to the battery on the belt.
  const lampCable = useMemo(() => {
    const back = (y) => -DEPTH * (torsoRadius(y) + 0.024);
    const points = [[0.01, 0.84, -0.115], [0.015, 0.72, -0.1], [0.02, 0.6, -0.095], [0.025, 0.5, back(0.5)], [0.03, 0.35, back(0.35)], [0.03, 0.2, back(0.2)], [0.025, 0.08, back(0.08) - 0.01]];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 32, 0.008, 6, false);
  }, []);

  return (
    <group>
      {/* Hips and legs */}
      <group position={[0, pose.hip, 0]}>
        <mesh position={[0, 0.02, 0]} scale={[1, 0.7, DEPTH]}>
          <sphereGeometry args={[0.172, 20, 14]} />
          {suit}
        </mesh>
        {pose.legs.map((leg, i) => (
          <Leg key={i} side={i === 0 ? -1 : 1} swing={leg.swing} splay={leg.splay} hip={pose.hip} />
        ))}
      </group>

      <group ref={spineRef} position={[0, pose.hip, 0]}>
        <mesh geometry={shared.torso}>{suit}</mesh>
        <mesh geometry={shared.vest}>
          <meshStandardMaterial color={VEST} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {shared.bands.map((geometry, i) => (
          <mesh key={i} geometry={geometry}>
            {reflective}
          </mesh>
        ))}
        {shared.straps.map((geometry, i) => (
          <mesh key={i} geometry={geometry}>
            {reflective}
          </mesh>
        ))}
        {/* Belt with buckle, cap-lamp battery at the back and a pouch */}
        <mesh geometry={shared.belt}>
          <meshStandardMaterial color={BELT} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.025, DEPTH * 0.18]}>
          <boxGeometry args={[0.06, 0.05, 0.015]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.02, -DEPTH * 0.19]}>
          <boxGeometry args={[0.16, 0.11, 0.05]} />
          <meshStandardMaterial color="#141414" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0.17, -0.02, 0.02]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.12, 0.09]} />
          <meshStandardMaterial color={BELT} roughness={0.7} />
        </mesh>
        <mesh geometry={lampCable}>
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
        {/* Neck with the coverall collar */}
        <mesh position={[0, 0.635, 0.005]}>
          <cylinderGeometry args={[0.048, 0.056, 0.09, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0]} scale={[1, 1, 0.85]}>
          <torusGeometry args={[0.068, 0.018, 8, 20]} />
          {suit}
        </mesh>
        <Head lampTarget={lampTarget} lampShadow={lampShadow} beam={beam} earMuffs={earMuffs} respirator={respirator} />
        <group ref={armsRef} position={[0, 0.535, 0]}>
          <Arm side={-1} shape={ARMS[arms]} />
          <Arm side={1} shape={ARMS[arms]} />
          {tool}
        </group>
        {children}
      </group>
    </group>
  );
}
