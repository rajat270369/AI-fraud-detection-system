
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import "./Loader3D.css";

function createBladeGeometry(length, width) {
  const segments = 32;
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 0.95;
    const radius = 0.18 + t * length;
    const centerX = Math.cos(angle) * radius;
    const centerY = Math.sin(angle) * radius;
    const halfWidth = width * Math.pow(1 - t, 0.65) + 0.008;

    vertices.push(
      centerX - Math.sin(angle) * halfWidth,
      centerY + Math.cos(angle) * halfWidth,
      0.035 * Math.sin(t * Math.PI),
      centerX + Math.sin(angle) * halfWidth,
      centerY - Math.cos(angle) * halfWidth,
      -0.035 * Math.sin(t * Math.PI)
    );
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function Vortex() {
  const vortex = useRef();
  const core = useRef();
  const halo = useRef();

  const blades = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        angle: (i / 8) * Math.PI * 2,
        geometry: createBladeGeometry(
          0.78 + (i % 3) * 0.08,
          0.22
        ),
        color: i % 2 === 0 ? "#fa4cff" : "#7247ff",
      })),
    []
  );

  const particles = useMemo(() => {
    const positions = [];

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.3 + Math.random() * 2.2;

      positions.push(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2.6,
        Math.sin(angle) * radius
      );
    }

    return new Float32Array(positions);
  }, []);

  useFrame((state, delta) => {
    if (vortex.current) {
      vortex.current.rotation.z += delta * 0.42;
      vortex.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.45) * 0.12;
    }

    if (core.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.035;
      core.current.scale.setScalar(pulse);
    }

    if (halo.current) {
      halo.current.rotation.z -= delta * 0.12;
    }
  });

  return (
    <>
      <group ref={vortex}>
        {blades.map((blade, i) => (
          <mesh
            key={i}
            geometry={blade.geometry}
            rotation={[0, 0, blade.angle]}
          >
            <meshPhysicalMaterial
              color={blade.color}
              emissive={blade.color}
              emissiveIntensity={0.65}
              metalness={0.55}
              roughness={0.2}
              side={THREE.DoubleSide}
              clearcoat={1}
              clearcoatRoughness={0.15}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={halo}>
        <torusGeometry args={[0.67, 0.009, 8, 96]} />
        <meshBasicMaterial
          color="#a65aff"
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={core}>
        <sphereGeometry args={[0.23, 32, 32]} />
        <meshPhysicalMaterial
          color="#180523"
          emissive="#a323ff"
          emissiveIntensity={1.1}
          metalness={0.4}
          roughness={0.15}
          clearcoat={1}
        />
      </mesh>

      <pointLight
        color="#c044ff"
        intensity={3}
        distance={5}
      />

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#b879ff"
          size={0.025}
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}

export default function Loader3D() {
  return (
    <div className="loader3d">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={["#05020b"]} />
        <ambientLight intensity={0.5} />
        <Vortex />
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.25}
          />
        </EffectComposer>
      </Canvas>

      <div className="loader3d-caption">
        <span>INITIALIZING SECURE ENVIRONMENT</span>
        <div className="loader3d-track">
          <div className="loader3d-track-fill" />
        </div>
      </div>
    </div>
  );
}
