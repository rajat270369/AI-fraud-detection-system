import { Canvas, useFrame } from "@react-three/fiber";
import Loader3D from "./Loader3D";

import {
  Environment,
  Float,
  Sparkles,
  Torus,
  useGLTF,
  useProgress,
} from "@react-three/drei";

import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
} from "three";

import "./App.css";


function DarkMatter() {
  const particles = useMemo(() => {
    const points = [];

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 1.05;

      points.push({
        angle,
        radius,
        y: (Math.random() - 0.5) * 0.12,
        speed: 0.15 + Math.random() * 0.35,
        size: 0.012 + Math.random() * 0.025,
      });
    }

    return points;
  }, []);

  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y =
      state.clock.elapsedTime * 0.18;

    group.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <group
      ref={group}
      position={[0, 0.28, 0]}
    >
      {/* Deep void */}
      <mesh>
        <cylinderGeometry
          args={[1.25, 1.25, 0.12, 96]}
        />

       <meshBasicMaterial color="#280d3e" />
      </mesh>

      {/* Inner dark-matter core */}
      <mesh position={[0, 0.075, 0]}>
        <sphereGeometry
          args={[0.65, 48, 24]}
        />

       <meshBasicMaterial color="#280d3e" />
      </mesh>

      {/* Dark matter particles */}
      <group>
        {particles.map((particle, index) => (
          <mesh
            key={index}
            position={[
              Math.cos(particle.angle) * particle.radius,
              particle.y,
              Math.sin(particle.angle) * particle.radius,
            ]}
          >
            <sphereGeometry
              args={[particle.size, 8, 8]}
            />

            <meshBasicMaterial
              color={
                index % 3 === 0
                  ? "#c59dd9"
                  : "#7a3f91"
              }
              transparent
              opacity={0.65}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}


function CrystalPedestal() {
  const pedestal = useRef();

  useFrame((state) => {
    if (!pedestal.current) return;

    pedestal.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
  });

  return (
    <group
      ref={pedestal}
      position={[0, -3.85, 0]}
    >
      {/* Main pedestal body */}
      <mesh>
        <cylinderGeometry
          args={[1.85, 2.05, 0.65, 96]}
        />

        <meshStandardMaterial
          color="#160b20"
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>

      {/* Upper platform */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry
          args={[1.7, 1.85, 0.18, 96]}
        />

        <meshStandardMaterial
          color="#24102f"
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Dark matter chamber */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry
          args={[1.35, 1.35, 0.12, 96]}
        />

        <meshStandardMaterial
          color="#050308"
          roughness={0.12}
          metalness={0.9}
        />
      </mesh>

      {/* Dark matter */}
      <DarkMatter />

      {/* Small center light */}
      <pointLight
        position={[0, 0.65, 0]}
        intensity={2.5}
        distance={4}
        decay={2}
        color="#7a3f91"
      />
    </group>
  );
}


function AmethystCore() {
  const group = useRef();
  const aura = useRef();
  const core = useRef();

  const orbit1 = useRef();
  const orbit2 = useRef();
  const orbit3 = useRef();
  const orbits = useRef();

  const { scene } = useGLTF(
    "/models/royal-amethyst-core.glb"
  );
useEffect(() => {
  scene.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => {
      if (!material) return;

      /*
       * RICHER AMETHYST
       */
      if (material.color) {
        material.color.multiplyScalar(1.15);
      }

      /*
       * STRONGER ENVIRONMENT REFLECTION
       *
       * This is the important part that was missing.
       */
      if ("envMapIntensity" in material) {
        material.envMapIntensity = 2.4;
      }

      /*
       * More reflective surface
       */
      if ("metalness" in material) {
        material.metalness = Math.min(
          material.metalness + 0.18,
          0.85
        );
      }

      /*
       * Sharper highlights
       */
      if ("roughness" in material) {
        material.roughness = Math.max(
          material.roughness - 0.12,
          0.10
        );
      }

      /*
       * Small controlled purple glow
       */
      if ("emissive" in material) {
        material.emissive.set("#4b1766");

        material.emissiveIntensity =
          Math.max(
            material.emissiveIntensity || 0,
            0.22
          );
      }

      material.needsUpdate = true;
    });
  });
}, [scene]);

useEffect(() => {
  const edgeObjects = [];

  scene.traverse((child) => {
    if (!child.isMesh) return;

    // Prevent duplicates during development/hot reload
    if (child.userData.__premiumEdges) return;

    const edgesGeometry = new EdgesGeometry(
      child.geometry,
      18
    );

    const edgeMaterial = new LineBasicMaterial({
      color: "#e5c9ef",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });

    const edgeLines = new LineSegments(
      edgesGeometry,
      edgeMaterial
    );

    // Keep the edge layer exactly on the existing crystal mesh
    edgeLines.position.set(0, 0, 0);
    edgeLines.rotation.set(0, 0, 0);
    edgeLines.scale.set(1, 1, 1);

    child.add(edgeLines);

    child.userData.__premiumEdges = true;

    edgeObjects.push({
      child,
      edgeLines,
      edgesGeometry,
      edgeMaterial,
    });
  });

  return () => {
    edgeObjects.forEach(
      ({
        child,
        edgeLines,
        edgesGeometry,
        edgeMaterial,
      }) => {
        child.remove(edgeLines);
        edgesGeometry.dispose();
        edgeMaterial.dispose();
        child.userData.__premiumEdges = false;
      }
    );
  };
}, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (group.current) {
      group.current.position.y =
        Math.sin(t * 0.7) * 0.08;

      group.current.rotation.y =
        Math.sin(t * 0.25) * 0.08;
    }

    if (aura.current) {
      const pulse =
        1 + Math.sin(t * 1.8) * 0.045;

      aura.current.scale.setScalar(pulse);

      aura.current.material.opacity =
        0.10 + Math.sin(t * 2.2) * 0.025;
    }

    if (core.current) {
      const pulse =
        1.5 + Math.sin(t * 2.5) * 0.45;

      core.current.material.emissiveIntensity =
        pulse;

      core.current.scale.setScalar(
        1 + Math.sin(t * 2.5) * 0.035
      );
    }

    
    if (orbits.current) {
    orbits.current.rotation.y = t * 0.22;
    orbits.current.rotation.x =
      Math.sin(t * 0.35) * 0.08;
    orbits.current.rotation.z =
      Math.sin(t * 0.25) * 0.05;
  }
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.08}
      floatIntensity={0.25}
    >
      <group
        ref={group}
        scale={1.15}
        position={[0, 0.45, 0]}
      >
        {/* FINISHED CRYSTAL */}
        <primitive
          object={scene}
          position={[0, 0.8, 0]}
        />

        {/* PRIMARY ORBITAL SYSTEM */}
        <group
  ref={orbits}
  position={[0, 0.8, 0]}
>
          {/* Large horizontal orbit */}
          <Torus
            ref={orbit1}
            args={[2.15, 0.018, 16, 160]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <meshBasicMaterial
              color="#c59dd9"
              transparent
              opacity={0.9}
            />
          </Torus>

          {/* Tilted orbit */}
          <Torus
            ref={orbit2}
            args={[2.45, 0.014, 16, 160]}
            rotation={[Math.PI / 2.7, 0.35, 0]}
          >
            <meshBasicMaterial
              color="#9b4dcc"
              transparent
              opacity={0.82}
            />
          </Torus>

          {/* Wide diagonal orbit */}
          <Torus
            ref={orbit3}
            args={[2.75, 0.010, 16, 180]}
            rotation={[
              Math.PI / 3.2,
              -0.45,
              0.2,
            ]}
          >
            <meshBasicMaterial
              color="#e5c9ef"
              transparent
              opacity={0.72}
            />
          </Torus>
        </group>

        {/* PURPLE AURA */}
        <mesh
          ref={aura}
          scale={[1.55, 2.15, 1.55]}
        >
          <sphereGeometry
            args={[1.15, 48, 32]}
          />

          <meshBasicMaterial
            color="#8e4bb5"
            transparent
            opacity={0.13}
            depthWrite={false}
          />
        </mesh>

        {/* INTERNAL ENERGY CORE */}
        <mesh
          ref={core}
          position={[0, 0.05, 0]}
          scale={0.95}
        >
          <icosahedronGeometry
            args={[0.30, 2]}
          />

          <meshStandardMaterial
            color="#d9b5e8"
            emissive="#9b4dcc"
            emissiveIntensity={2.2}
            metalness={0.25}
            roughness={0.08}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* ENERGY LIGHT */}
        <pointLight
          position={[0, 0.2, 0]}
          color="#9b4dcc"
          intensity={4}
          distance={4}
          decay={2}
        />

        <pointLight
          position={[0, 1.2, 0]}
          color="#c59dd9"
          intensity={3}
          distance={5}
          decay={2}
        />

        <pointLight
          position={[0, 0.4, 0]}
          color="#b96be8"
          intensity={5}
          distance={5}
          decay={2}
        />
      </group>
    </Float>
  );
}


function Scene() {
  return (
    <>
      <color
        attach="background"
        args={["#280d3e"]}
      />

      {/* Soft global illumination */}
      <ambientLight intensity={0.45} />

      {/* Main white key light */}
      <directionalLight
        position={[4, 6, 7]}
        intensity={4.2}
        color="#f2eaf7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Purple front light */}
      <pointLight
        position={[3.5, 2.5, 4]}
        intensity={12}
        distance={14}
        decay={2}
        color="#c59dd9"
      />

      {/* Deep purple side light */}
      <pointLight
        position={[-5, 1, 1]}
        intensity={14}
        distance={12}
        decay={2}
        color="#7a3f91"
      />

      {/* Bright rim light */}
      <pointLight
        position={[0, 5, -5]}
        intensity={22}
        distance={14}
        decay={2}
        color="#f2eaf7"
      />

      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -4, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />

        <meshBasicMaterial color="#280d3e" />
      </mesh>

      <Suspense fallback={null}>
        <CrystalPedestal />

        <AmethystCore />

        <Sparkles
          count={180}
          scale={[14, 9, 14]}
          size={1.5}
          speed={0.25}
          color="#c59dd9"
        />

        <Environment
          preset="night"
          environmentIntensity={1.2}
        />
      </Suspense>
    </>
  );
}



function App() {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("150000");
  const [sender, setSender] = useState("Account-A");
  const [receiver, setReceiver] = useState("Account-B");
  const [location, setLocation] = useState("Delhi");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkTransaction(event) {
    event.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("http://localhost:8080/api/fraud/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          sender,
          receiver,
          location,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        setResult("Error: " + text);
      } else {
        setResult("Transaction result: " + text);
      }
    } catch (error) {
      setResult("Could not connect to backend. Check that Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <Canvas camera={{ position: [0, 1.4, 15], fov: 38 }} dpr={[1, 2]}>
        <Scene />
        <EffectComposer>
          <Bloom
            intensity={1.35}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <section className="hero">
        <div className="hero-label">REAL-TIME FINANCIAL PROTECTION</div>
        <h1>
          FRAUD
          <br />
          <span>DETECTION</span>
        </h1>
        <p>
          AI-powered transaction intelligence designed
          to identify suspicious activity before it becomes
          a financial threat.
        </p>
        <button
          className="launch-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "CLOSE COMMAND CENTER" : "OPEN COMMAND CENTER"}
          <span>↗</span>
        </button>
      </section>

      {showForm && (
        <section
          style={{
            position: "absolute",
            zIndex: 10,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(90%, 420px)",
            padding: "24px",
            border: "1px solid #9b4dcc",
            borderRadius: "16px",
            background: "rgba(18, 8, 29, 0.96)",
            color: "white",
            boxSizing: "border-box",
          }}
        >
          <h2>Transaction Analysis</h2>
          <form onSubmit={checkTransaction}>
            <label>Amount</label>
            <input required type="number" min="0.01" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={inputStyle} />

            <label>Sender</label>
            <input required value={sender}
              onChange={e => setSender(e.target.value)} style={inputStyle} />

            <label>Receiver</label>
            <input required value={receiver}
              onChange={e => setReceiver(e.target.value)} style={inputStyle} />

            <label>Location</label>
            <input required value={location}
              onChange={e => setLocation(e.target.value)} style={inputStyle} />

            <button className="launch-button" type="submit" disabled={loading}>
              {loading ? "ANALYZING..." : "CHECK TRANSACTION"}
            </button>
          </form>
          {result && <p role="status">{result}</p>}
        </section>
      )}
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  margin: "6px 0 14px",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #9b4dcc",
  background: "#21132c",
  color: "white",
};


useGLTF.preload(
  "/models/royal-amethyst-core.glb"
);

export default App;