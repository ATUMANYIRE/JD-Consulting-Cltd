import { useMemo } from "react";
import * as THREE from "three";
import { hardHatGeometries, segment } from "./geometry";
import { ORANGE, REFLECTIVE, SKIN, STEEL, SUIT, TIMBER } from "./palette";

const DARK_RUBBER = "#0a141c";
const LEATHER = "#2a1d12";
const GLOVE = "#3a2a1c";

const beamGeometry = (() => {
  const geo = new THREE.ConeGeometry(0.9, 3.2, 32, 1, true);
  geo.translate(0, -1.6, 0);
  return geo;
})();
const beamDirection = new THREE.Vector3(0, -0.2, 1).normalize();
const beamQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), beamDirection);

const lampCable = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.02, -0.19), new THREE.Vector3(0, 0.35, -0.24), new THREE.Vector3(0, 0.75, -0.2), new THREE.Vector3(0, 0.95, -0.12)]),
  24,
  0.012,
  6,
  false
);

function Limb({ from, to, radius, children }) {
  const { position, length, quaternion } = segment(from, to);
  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 6, 12]} />
      {children}
    </mesh>
  );
}

function Leg({ side }) {
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;
  const hip = side * 0.2;
  const knee = side < 0 ? 0.28 : 0.06;
  return (
    <group position={[side * 0.12, 1.0, 0]} rotation={[hip, 0, side * 0.03]}>
      <mesh position={[0, -0.24, 0]}>
        <capsuleGeometry args={[0.1, 0.3, 6, 12]} />
        {suit}
      </mesh>
      <group position={[0, -0.47, 0]} rotation={[knee, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.095, 12, 12]} />
          {suit}
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.085, 0.3, 6, 12]} />
          {suit}
        </mesh>
        <mesh position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.045, 16]} />
          <meshStandardMaterial color={REFLECTIVE} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.3} />
        </mesh>
        <group position={[0, -0.45, 0]} rotation={[-(hip + knee), 0, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.095, 0.1, 0.16, 16]} />
            <meshStandardMaterial color={DARK_RUBBER} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.04, 0.07]}>
            <boxGeometry args={[0.16, 0.1, 0.3]} />
            <meshStandardMaterial color={DARK_RUBBER} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.1, 0.07]}>
            <boxGeometry args={[0.175, 0.03, 0.33]} />
            <meshStandardMaterial color="#04080b" roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.04, 0.21]} scale={[1, 0.7, 0.8]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color={ORANGE} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Arm({ side }) {
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;
  const shoulder = [side * 0.27, 0, 0];
  const elbow = [side * 0.2, -0.32, 0.07];
  const hand = [side * 0.05, -0.62, 0];
  return (
    <group>
      <mesh position={shoulder}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={ORANGE} roughness={0.7} />
      </mesh>
      <Limb from={shoulder} to={elbow} radius={0.065}>
        {suit}
      </Limb>
      <mesh position={elbow}>
        <sphereGeometry args={[0.062, 12, 12]} />
        {suit}
      </mesh>
      <Limb from={elbow} to={hand} radius={0.055}>
        {suit}
      </Limb>
      <mesh position={[side * 0.08, -0.53, 0.02]} rotation={[0, 0, side * 0.45]}>
        <cylinderGeometry args={[0.062, 0.062, 0.04, 16]} />
        <meshStandardMaterial color={REFLECTIVE} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={hand} scale={[1, 1.15, 0.9]}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshStandardMaterial color={GLOVE} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Head({ lampTarget, lampShadow, beam }) {
  const { shell, ridge } = hardHatGeometries();
  const skin = <meshStandardMaterial color={SKIN} roughness={0.65} />;
  return (
    <group position={[0, 0.87, 0.02]}>
      <mesh scale={[1, 1.12, 1.05]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        {skin}
      </mesh>
      <mesh position={[0, -0.01, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.024, 0.05, 8]} />
        {skin}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, 0, 0]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          {skin}
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0.128]}>
        <boxGeometry args={[0.2, 0.045, 0.02]} />
        <meshStandardMaterial color="#0b1620" metalness={0.7} roughness={0.08} />
      </mesh>
      <mesh position={[0, -0.09, 0.09]} scale={[1, 0.6, 0.7]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        {skin}
      </mesh>

      <group position={[0, 0.07, 0]} scale={0.235}>
        <mesh geometry={shell}>
          <meshPhysicalMaterial color={ORANGE} roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={ridge}>
          <meshPhysicalMaterial color={ORANGE} roughness={0.35} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.34, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.14, 0.16, 20]} />
          <meshStandardMaterial color="#1f2d36" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.34, 0.945]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.11, 20]} />
          <meshBasicMaterial color="#fff6e0" toneMapped={false} />
        </mesh>
      </group>

      <spotLight
        position={[0, 0.16, 0.24]}
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
        <mesh geometry={beamGeometry} position={[0, 0.16, 0.24]} quaternion={beamQuaternion} renderOrder={2}>
          <meshBasicMaterial color="#ffe9c4" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function Pickaxe({ headRef }) {
  const steel = <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.28} />;
  return (
    <group>
      <mesh position={[0, -0.97, 0]}>
        <cylinderGeometry args={[0.026, 0.032, 1.0, 10]} />
        <meshStandardMaterial color={TIMBER} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.2, 10]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      <group ref={headRef} position={[0, -1.43, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.11, 0.11]} />
          {steel}
        </mesh>
        <mesh position={[0, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.042, 0.34, 10]} />
          {steel}
        </mesh>
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]} scale={[1.6, 1, 0.5]}>
          <coneGeometry args={[0.035, 0.24, 4]} />
          {steel}
        </mesh>
      </group>
    </group>
  );
}

export function Shovel() {
  return (
    <group position={[0, 0.66, 0.36]} rotation={[-0.14, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.025, 0.025, 1.2, 10]} />
        <meshStandardMaterial color={TIMBER} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.66, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.07, 0.015, 8, 16]} />
        <meshStandardMaterial color="#141414" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.72, 0.02]} scale={[1, 1, 0.25]}>
        <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function MinerFigure({ spineRef, armsRef, children, lampShadow = false, beam = false, tool = null }) {
  const lampTarget = useMemo(() => new THREE.Object3D(), []);
  const suit = <meshStandardMaterial color={SUIT} roughness={0.85} />;

  return (
    <group>
      <Leg side={-1} />
      <Leg side={1} />
      <mesh position={[0, 0.98, 0]} scale={[1, 1, 0.75]}>
        <cylinderGeometry args={[0.21, 0.2, 0.12, 20]} />
        <meshStandardMaterial color={LEATHER} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0.155]}>
        <boxGeometry args={[0.08, 0.07, 0.02]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.92, 0.04]}>
        <boxGeometry args={[0.09, 0.15, 0.1]} />
        <meshStandardMaterial color={LEATHER} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.98, -0.17]}>
        <boxGeometry args={[0.18, 0.13, 0.07]} />
        <meshStandardMaterial color="#121212" roughness={0.5} metalness={0.3} />
      </mesh>

      <group ref={spineRef} position={[0, 0.98, 0]}>
        <mesh position={[0, 0.34, 0]} scale={[1.15, 1, 0.72]}>
          <capsuleGeometry args={[0.2, 0.36, 8, 16]} />
          {suit}
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.33]} />
          <meshStandardMaterial color={ORANGE} roughness={0.75} />
        </mesh>
        {[0.29, 0.5].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[0.506, 0.045, 0.336]} />
            <meshStandardMaterial color={REFLECTIVE} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.4, 0.168]}>
          <boxGeometry args={[0.02, 0.5, 0.004]} />
          <meshStandardMaterial color="#5a3510" />
        </mesh>
        <mesh geometry={lampCable}>
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.065, 0.075, 0.1, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <Head lampTarget={lampTarget} lampShadow={lampShadow} beam={beam} />
        <group ref={armsRef} position={[0, 0.64, 0.02]}>
          <Arm side={-1} />
          <Arm side={1} />
          {tool}
        </group>
      </group>
      {children}
    </group>
  );
}
