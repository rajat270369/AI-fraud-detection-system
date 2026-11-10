import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Sparkles,
  Torus,
  useGLTF,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Quaternion,
  Vector3,
} from "three";
import "./App.css";
import ModuleCrystal from "./components/ModuleCrystal";

// Each module has its own visual identity. The selected palette is blended
// into the existing 3D scene; the Canvas and GLB crystal are never remounted.
const PALETTES = {
  home: {
    background: "#280d3e", ground: "#280d3e", accent: "#c59dd9", rgb: "197,157,217",
    crystal: "#45dfe4", emissive: "#087f91", crystalBlend: 0, emissiveBlend: 0, aura: "#8e4bb5", core: "#d9b5e8", coreGlow: "#9b4dcc",
    rings: ["#c59dd9", "#9b4dcc", "#e5c9ef"], sparkles: "#c59dd9",
    pedestal: ["#160b20", "#24102f", "#050308", "#7a3f91"],
  },
  analysis: {
    background: "#071b28", ground: "#061722", accent: "#72e8e9", rgb: "91,218,224",
    crystal: "#45dfe4", emissive: "#087f91", aura: "#168b9a", core: "#a4faff", coreGlow: "#16c4d1",
    rings: ["#75f1ee", "#26bfc9", "#c5ffff"], sparkles: "#75f1ee",
    pedestal: ["#09232d", "#103744", "#031017", "#22becb"],
  },
  overview: {
    background: "#091b35", ground: "#07152b", accent: "#7db7ff", rgb: "105,163,239",
    crystal: "#62aaff", emissive: "#174f9b", aura: "#245eaa", core: "#b8d9ff", coreGlow: "#428cff",
    rings: ["#7db7ff", "#397cce", "#d0e6ff"], sparkles: "#9bcaff",
    pedestal: ["#0b1a30", "#102949", "#06101e", "#397cce"],
  },
  monitor: {
    background: "#28120f", ground: "#1d0c0a", accent: "#ff9a70", rgb: "255,139,99",
    crystal: "#ff966f", emissive: "#9c321d", aura: "#a8432d", core: "#ffd0b8", coreGlow: "#ff6b45",
    rings: ["#ffb18a", "#e66c49", "#ffe0ca"], sparkles: "#ffb18a",
    pedestal: ["#24110e", "#3a1a14", "#150907", "#e66c49"],
  },
  transactions: {
    background: "#0b2030", ground: "#071925", accent: "#65d6f2", rgb: "87,202,232",
    crystal: "#61d9f4", emissive: "#087394", aura: "#167d9d", core: "#c4f4ff", coreGlow: "#20b8e0",
    rings: ["#7fe7ff", "#27a9d4", "#d1f8ff"], sparkles: "#75e4ff",
    pedestal: ["#0a202c", "#103849", "#04131d", "#27a9d4"],
  },
  investigations: {
    background: "#25102e", ground: "#190b22", accent: "#e6a2ff", rgb: "211,135,241",
    crystal: "#d58df2", emissive: "#71318e", aura: "#71318e", core: "#f1d0ff", coreGlow: "#bd61e9",
    rings: ["#e6a2ff", "#a84dcc", "#f8ddff"], sparkles: "#e7b4ff",
    pedestal: ["#210e2b", "#351641", "#120817", "#a84dcc"],
  },
  network: {
    background: "#10162f", ground: "#0b1025", accent: "#a69bff", rgb: "155,144,255",
    crystal: "#9b9aff", emissive: "#453c9c", aura: "#5147ae", core: "#d6d1ff", coreGlow: "#7769ff",
    rings: ["#b2aaff", "#7064d8", "#e4e0ff"], sparkles: "#b7b0ff",
    pedestal: ["#14132d", "#211d43", "#0a091b", "#7064d8"],
  },
  model: {
    background: "#28200f", ground: "#1d170a", accent: "#f2ce76", rgb: "226,186,91",
    crystal: "#efc86a", emissive: "#8a6116", aura: "#987022", core: "#fff0b8", coreGlow: "#e2aa38",
    rings: ["#ffe19a", "#c38e2b", "#fff3ce"], sparkles: "#ffe19a",
    pedestal: ["#241b0c", "#3a2b11", "#171004", "#c38e2b"],
  },
  reports: {
    background: "#0c251f", ground: "#071b17", accent: "#80e0b4", rgb: "105,206,154",
    crystal: "#79e0b2", emissive: "#1b8059", aura: "#237c5b", core: "#c5ffe2", coreGlow: "#39bd85",
    rings: ["#9af2c6", "#43ae7b", "#d9ffeb"], sparkles: "#9af2c6",
    pedestal: ["#0b211a", "#10382a", "#04150f", "#43ae7b"],
  },
  settings: {
    background: "#19222d", ground: "#101821", accent: "#a8bdcf", rgb: "151,178,199",
    crystal: "#a9c2d8", emissive: "#49657e", aura: "#49657e", core: "#e0efff", coreGlow: "#7eabc9",
    rings: ["#b7d1e5", "#6b8ba4", "#e8f5ff"], sparkles: "#bdd7ea",
    pedestal: ["#172330", "#24374a", "#0a1119", "#6b8ba4"],
  },
};

const MODULES = [
  { id: "analysis", number: "01", title: "Transaction Analysis", short: "Assess a single transaction", description: "Submit transaction details and inspect the response from the fraud detection API.", icon: "⌁", category: "DETECTION" },
  { id: "overview", number: "02", title: "Threat Overview", short: "See the bigger picture", description: "A command-level view of transaction activity, risk exposure and recent alerts.", icon: "◫", category: "INTELLIGENCE" },
  { id: "monitor", number: "03", title: "Live Monitor", short: "Watch incoming activity", description: "Explore a simulated transaction stream with live status filters and event details.", icon: "⌁", category: "MONITORING" },
  { id: "transactions", number: "04", title: "Transaction Explorer", short: "Search and inspect records", description: "Filter, sort, select and export a rich transaction dataset.", icon: "▤", category: "DATA" },
  { id: "investigations", number: "05", title: "Investigation Centre", short: "Review suspicious cases", description: "Work through flagged cases, record analyst notes and capture decisions.", icon: "◎", category: "RESPONSE" },
  { id: "network", number: "06", title: "Network Intelligence", short: "Trace connected entities", description: "Explore relationships between accounts, devices, IP addresses and merchants.", icon: "⌘", category: "GRAPH ANALYTICS" },
  { id: "model", number: "07", title: "Model Intelligence Lab", short: "Explore model performance", description: "Adjust a decision threshold and see its effect on evaluation metrics.", icon: "∿", category: "MACHINE LEARNING" },
  { id: "reports", number: "08", title: "Reports & Intelligence", short: "Turn activity into insight", description: "Explore reporting snapshots and export a concise analytical report.", icon: "▥", category: "REPORTING" },
  { id: "settings", number: "09", title: "Preferences", short: "Configure your workspace", description: "Personalize interface behavior, motion and notification preferences.", icon: "⚙", category: "SYSTEM" },
];

const INITIAL_TRANSACTIONS = [
  { id: "TX-1042", sender: "AC-90821", receiver: "AC-77109", amount: 148500, location: "Mumbai", channel: "Web", device: "DV-881A", status: "HIGH RISK", time: "10:42:18", score: 94 },
  { id: "TX-1041", sender: "AC-11802", receiver: "AC-44190", amount: 2450, location: "Delhi", channel: "Mobile", device: "DV-21F0", status: "LOW RISK", time: "10:40:52", score: 12 },
  { id: "TX-1040", sender: "AC-55120", receiver: "AC-33881", amount: 42000, location: "Bengaluru", channel: "Web", device: "DV-9AB1", status: "REVIEW", time: "10:39:07", score: 67 },
  { id: "TX-1039", sender: "AC-90821", receiver: "AC-11993", amount: 98500, location: "Jaipur", channel: "API", device: "DV-881A", status: "HIGH RISK", time: "10:35:41", score: 89 },
  { id: "TX-1038", sender: "AC-77218", receiver: "AC-33017", amount: 1800, location: "Pune", channel: "Mobile", device: "DV-102B", status: "LOW RISK", time: "10:31:16", score: 8 },
  { id: "TX-1037", sender: "AC-44901", receiver: "AC-23991", amount: 76500, location: "Hyderabad", channel: "Web", device: "DV-99C2", status: "REVIEW", time: "10:28:44", score: 59 },
  { id: "TX-1036", sender: "AC-18871", receiver: "AC-00912", amount: 213000, location: "Kolkata", channel: "API", device: "DV-BC31", status: "HIGH RISK", time: "10:24:09", score: 97 },
  { id: "TX-1035", sender: "AC-66102", receiver: "AC-11028", amount: 5600, location: "Chandigarh", channel: "Mobile", device: "DV-8A21", status: "LOW RISK", time: "10:19:32", score: 17 },
  { id: "TX-1034", sender: "AC-55880", receiver: "AC-77190", amount: 31800, location: "Ahmedabad", channel: "Web", device: "DV-71DA", status: "REVIEW", time: "10:14:55", score: 62 },
  { id: "TX-1033", sender: "AC-90821", receiver: "AC-33201", amount: 121000, location: "Mumbai", channel: "API", device: "DV-881A", status: "HIGH RISK", time: "10:08:13", score: 91 },
];

const INITIAL_CASES = [
  { id: "CASE-208", transaction: "TX-1042", title: "Unusual high-value transfer", priority: "CRITICAL", status: "OPEN", owner: "Unassigned", amount: 148500, reason: "Amount and device pattern differ from the account's recent activity.", notes: [] },
  { id: "CASE-207", transaction: "TX-1039", title: "Repeated device across accounts", priority: "HIGH", status: "IN REVIEW", owner: "A. Sharma", amount: 98500, reason: "The same device identifier appears across several accounts.", notes: ["Initial device correlation completed."] },
  { id: "CASE-206", transaction: "TX-1036", title: "High-value API transfer", priority: "CRITICAL", status: "OPEN", owner: "Unassigned", amount: 213000, reason: "Large transfer initiated through an API channel.", notes: [] },
  { id: "CASE-204", transaction: "TX-1037", title: "Location and velocity anomaly", priority: "MEDIUM", status: "RESOLVED", owner: "R. Mehta", amount: 76500, reason: "Location pattern requires additional verification.", notes: ["Customer verification completed."] },
];

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const compactMoney = (value) => `₹${(value / 100000).toFixed(value >= 1000000 ? 1 : 2)}L`;
const downloadCsv = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function DarkMatter({ palette, reducedMotion }) {
  const diskMaterial = useRef();
  const innerMaterial = useRef();
  const particles = useMemo(() => Array.from({ length: 90 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.25 + Math.random() * 1.05,
    y: (Math.random() - 0.5) * 0.12,
    size: 0.012 + Math.random() * 0.025,
  })), []);
  const group = useRef();
  const particleMaterials = useRef([]);
  const glowColor = useMemo(() => new Color(palette.accent), [palette.accent]);
  const darkColor = useMemo(() => new Color(palette.background), [palette.background]);
  const groundColor = useMemo(() => new Color(palette.ground), [palette.ground]);
  const secondaryColor = useMemo(() => new Color(palette.rings[1]), [palette.rings]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y = reducedMotion ? 0 : state.clock.elapsedTime * 0.18;
      group.current.rotation.z = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
    }
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.8);
    if (diskMaterial.current) diskMaterial.current.color.lerp(darkColor, alpha);
    if (innerMaterial.current) innerMaterial.current.color.lerp(groundColor, alpha);
    particleMaterials.current.forEach((material, index) => {
      if (material) material.color.lerp(index % 3 === 0 ? glowColor : secondaryColor, alpha);
    });
  });

  return (
    <group ref={group} position={[0, 0.28, 0]}>
      <mesh>
        <cylinderGeometry args={[1.25, 1.25, 0.12, 96]} />
        <meshBasicMaterial ref={diskMaterial} color={PALETTES.home.background} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <sphereGeometry args={[0.65, 48, 24]} />
        <meshBasicMaterial ref={innerMaterial} color={PALETTES.home.ground} />
      </mesh>
      <group>
        {particles.map((particle, index) => (
          <mesh key={index} position={[Math.cos(particle.angle) * particle.radius, particle.y, Math.sin(particle.angle) * particle.radius]}>
            <sphereGeometry args={[particle.size, 8, 8]} />
            <meshBasicMaterial ref={(node) => { particleMaterials.current[index] = node; }} color={index % 3 === 0 ? PALETTES.home.accent : PALETTES.home.ground} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CrystalPedestal({ palette, reducedMotion }) {
  const pedestal = useRef();
  const bodyMaterial = useRef();
  const platformMaterial = useRef();
  const chamberMaterial = useRef();
  const centerLight = useRef();
  const targets = useMemo(() => palette.pedestal.map((color) => new Color(color)), [palette]);

  useFrame((state, delta) => {
    if (pedestal.current) pedestal.current.rotation.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.6);
    [bodyMaterial, platformMaterial, chamberMaterial, centerLight].forEach((ref, index) => {
      if (ref.current?.color) ref.current.color.lerp(targets[index], alpha);
    });
  });

  return (
    <group ref={pedestal} position={[0, -3.85, 0]}>
      <mesh>
        <cylinderGeometry args={[1.85, 2.05, 0.65, 96]} />
        <meshStandardMaterial ref={bodyMaterial} color={PALETTES.home.pedestal[0]} roughness={0.25} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[1.7, 1.85, 0.18, 96]} />
        <meshStandardMaterial ref={platformMaterial} color={PALETTES.home.pedestal[1]} roughness={0.2} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.12, 96]} />
        <meshStandardMaterial ref={chamberMaterial} color={PALETTES.home.pedestal[2]} roughness={0.12} metalness={0.9} />
      </mesh>
      <DarkMatter palette={palette} reducedMotion={reducedMotion} />
      <pointLight ref={centerLight} position={[0, 0.65, 0]} intensity={2.5} distance={4} decay={2} color={PALETTES.home.pedestal[3]} />
    </group>
  );
}

function AmethystCore({ palette, reducedMotion }) {
  const group = useRef();
  const aura = useRef();
  const core = useRef();
  const orbits = useRef();
  const orbitOne = useRef();
  const orbitTwo = useRef();
  const orbitThree = useRef();
  const orbitRefs = [orbitOne, orbitTwo, orbitThree];
  const crystalMaterials = useRef([]);
  const edgeMaterials = useRef([]);
  const coreLightOne = useRef();
  const coreLightTwo = useRef();
  const coreLightThree = useRef();
  const coreLights = [coreLightOne, coreLightTwo, coreLightThree];
  const { scene } = useGLTF("/models/royal-amethyst-core.glb");
  const targetCrystal = useMemo(() => new Color(palette.crystal), [palette.crystal]);
  const targetEmissive = useMemo(() => new Color(palette.emissive), [palette.emissive]);
  const targetAura = useMemo(() => new Color(palette.aura), [palette.aura]);
  const targetCore = useMemo(() => new Color(palette.core), [palette.core]);
  const targetCoreGlow = useMemo(() => new Color(palette.coreGlow), [palette.coreGlow]);
  const targetAccent = useMemo(() => new Color(palette.accent), [palette.accent]);
  const targetRings = useMemo(() => palette.rings.map((c) => new Color(c)), [palette]);

  useEffect(() => {
    const animatedMaterials = [];
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;
        if (!material.userData.__fraudXStyled) {
          if (material.color) material.color.multiplyScalar(1.15);
          if ("envMapIntensity" in material) material.envMapIntensity = 2.4;
          if ("metalness" in material) material.metalness = Math.min(material.metalness + 0.18, 0.85);
          if ("roughness" in material) material.roughness = Math.max(material.roughness - 0.12, 0.10);
          if (material.emissive) {
            material.emissive.set("#4b1766");
            material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.22);
          }
          material.userData.__fraudXStyled = true;
          material.userData.__fraudXBaseColor = material.color?.clone();
          material.userData.__fraudXBaseEmissive = material.emissive?.clone();
          material.needsUpdate = true;
        }
        animatedMaterials.push({
          material,
          baseColor: material.userData.__fraudXBaseColor,
          baseEmissive: material.userData.__fraudXBaseEmissive,
          desiredColor: new Color(),
          desiredEmissive: new Color(),
        });
      });
    });
    crystalMaterials.current = animatedMaterials;
    return () => { crystalMaterials.current = []; };
  }, [scene]);

  useEffect(() => {
    const addedEdges = [];
    scene.traverse((child) => {
      if (!child.isMesh || child.userData.__fraudXEdges) return;
      const geometry = new EdgesGeometry(child.geometry, 18);
      const material = new LineBasicMaterial({ color: PALETTES.home.rings[2], transparent: true, opacity: 0.16, depthWrite: false });
      const lines = new LineSegments(geometry, material);
      child.add(lines);
      child.userData.__fraudXEdges = true;
      addedEdges.push({ child, lines, geometry, material });
    });
    edgeMaterials.current = addedEdges.map((entry) => entry.material);
    return () => {
      addedEdges.forEach(({ child, lines, geometry, material }) => {
        child.remove(lines); geometry.dispose(); material.dispose(); child.userData.__fraudXEdges = false;
      });
      edgeMaterials.current = [];
    };
  }, [scene]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.7);
    crystalMaterials.current.forEach(({ material, baseColor, baseEmissive, desiredColor, desiredEmissive }) => {
      if (baseColor && material.color) {
        desiredColor.copy(baseColor).lerp(targetCrystal, 0.68 * (palette.crystalBlend ?? 1));
        material.color.lerp(desiredColor, alpha);
      }
      if (baseEmissive && material.emissive) {
        desiredEmissive.copy(baseEmissive).lerp(targetEmissive, 0.78 * (palette.emissiveBlend ?? 1));
        material.emissive.lerp(desiredEmissive, alpha);
      }
    });
    edgeMaterials.current.forEach((material) => material.color.lerp(targetRings[2], alpha));
    orbitRefs.forEach((ref, index) => { if (ref.current?.material?.color) ref.current.material.color.lerp(targetRings[index], alpha); });
    if (aura.current?.material?.color) aura.current.material.color.lerp(targetAura, alpha);
    if (core.current?.material) {
      core.current.material.color.lerp(targetCore, alpha);
      core.current.material.emissive.lerp(targetCoreGlow, alpha);
    }
    coreLights.forEach((ref, index) => {
      if (!ref.current) return;
      const target = index === 0 ? targetAccent : index === 1 ? targetRings[0] : targetCoreGlow;
      ref.current.color.lerp(target, alpha);
    });
    if (group.current) {
      group.current.position.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.08;
      group.current.rotation.y = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.08;
    }
    if (aura.current) {
      aura.current.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(t * 1.8) * 0.045);
      aura.current.material.opacity = reducedMotion ? 0.10 : 0.10 + Math.sin(t * 2.2) * 0.025;
    }
    if (core.current) {
      core.current.material.emissiveIntensity = reducedMotion ? 1.5 : 1.5 + Math.sin(t * 2.5) * 0.45;
      core.current.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(t * 2.5) * 0.035);
    }
    if (orbits.current) {
      orbits.current.rotation.y = reducedMotion ? 0 : t * 0.22;
      orbits.current.rotation.x = reducedMotion ? 0 : Math.sin(t * 0.35) * 0.08;
      orbits.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.05;
    }
  });

  return (
    <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={reducedMotion ? 0 : 0.08} floatIntensity={reducedMotion ? 0 : 0.25}>
      <group ref={group} scale={1.15} position={[0, 0.45, 0]}>
        <primitive object={scene} position={[0, 0.8, 0]} />
        <group ref={orbits} position={[0, 0.8, 0]}>
          <Torus ref={orbitOne} args={[2.15, 0.018, 16, 160]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={PALETTES.home.rings[0]} transparent opacity={0.9} />
          </Torus>
          <Torus ref={orbitTwo} args={[2.45, 0.014, 16, 160]} rotation={[Math.PI / 2.7, 0.35, 0]}>
            <meshBasicMaterial color={PALETTES.home.rings[1]} transparent opacity={0.82} />
          </Torus>
          <Torus ref={orbitThree} args={[2.75, 0.010, 16, 180]} rotation={[Math.PI / 3.2, -0.45, 0.2]}>
            <meshBasicMaterial color={PALETTES.home.rings[2]} transparent opacity={0.72} />
          </Torus>
        </group>
        <mesh ref={aura} scale={[1.55, 2.15, 1.55]}>
          <sphereGeometry args={[1.15, 48, 32]} />
          <meshBasicMaterial color={PALETTES.home.aura} transparent opacity={0.13} depthWrite={false} />
        </mesh>
        <mesh ref={core} position={[0, 0.05, 0]} scale={0.95}>
          <icosahedronGeometry args={[0.30, 2]} />
          <meshStandardMaterial color={PALETTES.home.core} emissive={PALETTES.home.coreGlow} emissiveIntensity={2.2} metalness={0.25} roughness={0.08} transparent opacity={0.88} />
        </mesh>
        <pointLight ref={coreLightOne} position={[0, 0.2, 0]} color={PALETTES.home.accent} intensity={4} distance={4} decay={2} />
        <pointLight ref={coreLightTwo} position={[0, 1.2, 0]} color={PALETTES.home.rings[0]} intensity={3} distance={5} decay={2} />
        <pointLight ref={coreLightThree} position={[0, 0.4, 0]} color={PALETTES.home.coreGlow} intensity={5} distance={5} decay={2} />
      </group>
    </Float>
  );
}

// Transaction Analysis uses its own GLB pedestal, crystal and orbit geometry.
// Keep the homepage's Amethyst scene untouched; hide only the two small rings
// that sit inside the Aquamarine, and animate the three LARGE orbital groups.
function AquamarineAsset({ reducedMotion }) {
  const { scene: sourceScene } = useGLTF("/models/aquamarine-starry-night.glb");

  const { assetScene, crystalRoot, crystalBaseY, orbitControllers } = useMemo(() => {
    // Clone the cached glTF so the transforms/visibility here cannot affect
    // other modules that may use the same model in the future.
    const assetScene = sourceScene.clone(true);
    const orbitControllers = [];
    const orbitSpeed = {
      Precision_Orbit_Inner: 0.19,
      Precision_Orbit_Middle: -0.15,
      Precision_Orbit_Outer: 0.12,
    };
    const yAxis = new Vector3(0, 1, 0);

    assetScene.traverse((object) => {
      // Blender may append .001 when duplicate names exist.
      const name = object.name.replace(/\.\d{3}$/, "");

      // Use the original Drei Sparkles already present in the FRAUD-X scene.
      if (name.startsWith("Starfield_")) object.visible = false;

      // These are the two *small* mid-crystal rings, not the outer orbits.
      if (name === "Core_Energy_Ring_01" || name === "Core_Energy_Ring_02") {
        object.visible = false;
      }

      // Animate complete orbit groups, including their attached glow meshes
      // and transaction nodes. Retain each orbit's original tilted pose.
      if (Object.prototype.hasOwnProperty.call(orbitSpeed, name)) {
        orbitControllers.push({
          object,
          speed: orbitSpeed[name],
          baseQuaternion: object.quaternion.clone(),
          spin: new Quaternion(),
          yAxis,
        });
      }

      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const crystalRoot = assetScene.getObjectByName("AQUAMARINE_CRYSTAL_ROOT");
    return {
      assetScene,
      crystalRoot,
      crystalBaseY: crystalRoot?.position.y ?? 0,
      orbitControllers,
    };
  }, [sourceScene]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Crystal floats/turns independently; the original pedestal stays still.
    if (crystalRoot) {
      crystalRoot.rotation.y = reducedMotion ? 0 : time * 0.22;
      crystalRoot.position.y = crystalBaseY + (reducedMotion ? 0 : Math.sin(time * 0.85) * 0.095);
    }

    // Orbits precess independently around world Y. Multiplying by the saved
    // starting quaternion avoids drifting or losing their original tilt.
    orbitControllers.forEach(({ object, speed, baseQuaternion, spin, yAxis }) => {
      if (reducedMotion) {
        object.quaternion.copy(baseQuaternion);
      } else {
        spin.setFromAxisAngle(yAxis, time * speed);
        object.quaternion.copy(spin).multiply(baseQuaternion);
      }
    });
  });

  return (
    <group scale={0.92} position={[1.8, 0.05, 0]}>
      <primitive object={assetScene} />
    </group>
  );
}

function Scene({ palette, active, reducedMotion, moduleId }) {
  const crystalStage = useRef();
  const groundMaterial = useRef();
  const accentLight = useRef();
  const sideLight = useRef();
  const { scene, viewport } = useThree();
  const targetBackground = useMemo(() => new Color(palette.background), [palette.background]);
  const targetGround = useMemo(() => new Color(palette.ground), [palette.ground]);
  const targetAccent = useMemo(() => new Color(palette.accent), [palette.accent]);
  const targetSideLight = useMemo(() => new Color(palette.rings[1]), [palette.rings]);

  useFrame((_, delta) => {
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.5);
    if (crystalStage.current) {
      // Make Transaction Analysis the visual focus without changing the
      // homepage, other modules, or the more constrained mobile layout.
      const analysisDesktop = active &&  ["analysis", "overview"].includes(moduleId) && viewport.width >= 13;
      const standardX = Math.min(viewport.width * 0.265, 3.35);
      const targetX = active ? standardX - (analysisDesktop ? 0.22 : 0) : 0;
      const targetScale = active
        ? (analysisDesktop ? 0.90 : (viewport.width < 8 ? 0.58 : 0.78))
        : 1;
      crystalStage.current.position.x = reducedMotion ? targetX : MathUtils.damp(crystalStage.current.position.x, targetX, 3.1, delta);
      const scale = reducedMotion ? targetScale : MathUtils.damp(crystalStage.current.scale.x, targetScale, 3.1, delta);
      crystalStage.current.scale.setScalar(scale);
    }
    if (scene.background?.isColor) scene.background.lerp(targetBackground, alpha);
    if (groundMaterial.current) groundMaterial.current.color.lerp(targetGround, alpha);
    if (accentLight.current) accentLight.current.color.lerp(targetAccent, alpha);
    if (sideLight.current) sideLight.current.color.lerp(targetSideLight, alpha);
  });

  return (
    <>
      <color attach="background" args={[PALETTES.home.background]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 7]} intensity={4.2} color="#f2eaf7" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.1} shadow-camera-far={30} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <pointLight ref={accentLight} position={[3.5, 2.5, 4]} intensity={12} distance={14} decay={2} color={PALETTES.home.accent} />
      <pointLight ref={sideLight} position={[-5, 1, 1]} intensity={14} distance={12} decay={2} color={PALETTES.home.rings[1]} />
      <pointLight position={[0, 5, -5]} intensity={22} distance={14} decay={2} color="#f2eaf7" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial ref={groundMaterial} color={PALETTES.home.ground} />
      </mesh>
      <Suspense fallback={null}>
        <group ref={crystalStage}>
          {["analysis", "overview"].includes(moduleId) ? (
  <ModuleCrystal
    key={moduleId}
    moduleId={moduleId}
    reducedMotion={reducedMotion}
  />
) : (
  <>
    <CrystalPedestal
      palette={palette}
      reducedMotion={reducedMotion}
    />
    <AmethystCore
      palette={palette}
      reducedMotion={reducedMotion}
    />
  </>
)}
        </group>
        <Sparkles count={180} scale={[14, 9, 14]} size={1.5} speed={0.25} color="#e4eaff" />
        <Environment preset="night" environmentIntensity={1.2} />
      </Suspense>
    </>
  );
}

function PanelHeader({ module, eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        <div className="panel-kicker">FRAUD-X / {eyebrow || module.category}</div>
        <h1>{title || module.title}</h1>
        <p>{description || module.description}</p>
      </div>
      <div className="page-heading-actions">
        <span className="demo-chip">DEMO DATA</span>
        {action}
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon, tone = "default", onClick }) {
  return (
    <button className={`stat-card stat-card--${tone} ${onClick ? "stat-card--clickable" : ""}`} onClick={onClick} type="button">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-change">{change}</span>
    </button>
  );
}

function Sparkline({ values, color = "var(--accent)" }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 300},${70 - ((v - min) / Math.max(1, max - min)) * 55}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 300 80" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function OverviewPage({ module, onNavigate }) {
  const [period, setPeriod] = useState("24H");
  return (
    <div className="module-page overview-page">
      <PanelHeader module={module} eyebrow="GLOBAL THREAT INTELLIGENCE" description="A consolidated snapshot of the demo transaction environment and its risk signals." action={<select className="compact-select" value={period} onChange={(e) => setPeriod(e.target.value)}><option>24H</option><option>7D</option><option>30D</option></select>} />
      <div className="stat-grid stat-grid-4">
        <StatCard label="TRANSACTIONS SCANNED" value={period === "24H" ? "12,842" : period === "7D" ? "84,219" : "362,804"} change="↑ 8.4% vs prior period" icon="▤" onClick={() => onNavigate("transactions")} />
        <StatCard label="HIGH-RISK SIGNALS" value="284" change="18 require attention" icon="◈" tone="danger" onClick={() => onNavigate("transactions", "HIGH RISK")} />
        <StatCard label="UNDER REVIEW" value="37" change="12 opened this hour" icon="◎" tone="warning" onClick={() => onNavigate("investigations")} />
        <StatCard label="FLAGGED EXPOSURE" value="₹42.8L" change="Illustrative estimate" icon="↗" tone="success" />
      </div>
      <div className="content-grid content-grid-main">
        <section className="glass-card chart-card">
          <div className="card-heading"><div><span className="card-kicker">TRANSACTION ACTIVITY</span><h3>Volume & risk signals</h3></div><span className="chart-legend"><i /> Incoming <i className="legend-risk" /> Flagged</span></div>
          <div className="chart-area">
            <div className="chart-y-labels"><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div>
            <svg viewBox="0 0 600 190" preserveAspectRatio="none" className="activity-chart">
              {[20,60,100,140,180].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} className="chart-gridline" />)}
              <path d="M0 145 C45 135 55 88 100 105 S160 128 200 84 S260 100 300 70 S360 90 400 52 S460 70 500 35 S560 65 600 22 L600 190 L0 190Z" className="chart-fill" />
              <path d="M0 145 C45 135 55 88 100 105 S160 128 200 84 S260 100 300 70 S360 90 400 52 S460 70 500 35 S560 65 600 22" className="chart-line" />
              <path d="M0 170 C50 165 65 150 100 158 S160 148 200 153 S260 135 300 147 S360 140 400 128 S460 140 500 120 S560 130 600 110" className="chart-line chart-line-risk" />
            </svg>
          </div>
          <div className="chart-x-labels"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>NOW</span></div>
        </section>
        <section className="glass-card distribution-card">
          <div className="card-heading"><div><span className="card-kicker">RISK CLASSIFICATION</span><h3>Signal distribution</h3></div><span className="demo-mini">SAMPLE</span></div>
          <div className="donut-wrap"><div className="donut-chart"><div><strong>12.8k</strong><small>RECORDS</small></div></div></div>
          <div className="distribution-legend"><div><i className="risk-low"/><span>Low risk</span><strong>78%</strong></div><div><i className="risk-review"/><span>Review</span><strong>15%</strong></div><div><i className="risk-high"/><span>High risk</span><strong>7%</strong></div></div>
        </section>
      </div>
      <section className="glass-card table-card">
        <div className="card-heading"><div><span className="card-kicker">PRIORITY QUEUE</span><h3>Recent risk signals</h3></div><button className="text-action" onClick={() => onNavigate("transactions", "HIGH RISK")}>VIEW ALL ↗</button></div>
        <TransactionTable rows={INITIAL_TRANSACTIONS.slice(0, 4)} compact onSelect={() => onNavigate("investigations")} />
      </section>
    </div>
  );
}

function TransactionTable({ rows, compact = false, onSelect }) {
  return (
    <div className={`table-scroll ${compact ? "table-scroll-compact" : ""}`}>
      <table className="data-table"><thead><tr><th>TRANSACTION</th><th>ACCOUNT FLOW</th><th>AMOUNT</th><th>LOCATION</th><th>RISK</th><th>TIME</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} onClick={() => onSelect?.(row)} tabIndex={onSelect ? 0 : undefined} onKeyDown={(e) => e.key === "Enter" && onSelect?.(row)}><td><strong>{row.id}</strong><small>{row.channel} · {row.device}</small></td><td>{row.sender}<small>→ {row.receiver}</small></td><td className="amount-cell">{money(row.amount)}</td><td>{row.location}</td><td><RiskBadge status={row.status} /></td><td>{row.time}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function RiskBadge({ status }) {
  const cls = status === "HIGH RISK" || status === "CRITICAL" || status === "INVALID" ? "high" : status === "REVIEW" || status === "MEDIUM" || status === "IN REVIEW" ? "review" : "low";
  return <span className={`risk-badge risk-badge--${cls}`}>{status}</span>;
}

function LiveMonitorPage({ module, soundEnabled }) {
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [events, setEvents] = useState(() => INITIAL_TRANSACTIONS.slice(0, 6));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tick, setTick] = useState(0);
  const sequenceRef = useRef(1042);
  const audioContextRef = useRef(null);
  const playAlertTone = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
      const context = audioContextRef.current;
      if (context.state === "suspended") context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, context.currentTime);
      gain.gain.setValueAtTime(0.045, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.2);
    } catch { /* Audio may be unavailable or blocked by the browser. */ }
  }, []);
  useEffect(() => () => { if (audioContextRef.current) audioContextRef.current.close(); }, []);
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setTick((v) => v + 1);
      sequenceRef.current += 1;
      const id = `TX-${sequenceRef.current}`;
      const amounts = [1250, 8900, 42100, 116000, 24500, 183000];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const status = amount > 100000 ? "HIGH RISK" : amount > 30000 ? "REVIEW" : "LOW RISK";
      const next = { id, sender: `AC-${Math.floor(10000 + Math.random() * 89999)}`, receiver: `AC-${Math.floor(10000 + Math.random() * 89999)}`, amount, location: ["Mumbai", "Delhi", "Pune", "Bengaluru", "Jaipur"][Math.floor(Math.random() * 5)], channel: ["Web", "Mobile", "API"][Math.floor(Math.random() * 3)], device: `DV-${Math.random().toString(16).slice(2, 6).toUpperCase()}`, status, time: new Date().toLocaleTimeString("en-IN", { hour12: false }), score: Math.min(99, amount > 100000 ? 89 + Math.floor(Math.random() * 10) : amount > 30000 ? 50 + Math.floor(Math.random() * 30) : 5 + Math.floor(Math.random() * 20)) };
      if (soundEnabled && status === "HIGH RISK") playAlertTone();
      setEvents((previous) => [next, ...previous].slice(0, 12));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [running, soundEnabled, playAlertTone]);
  const filtered = events.filter((item) => filter === "ALL" || item.status === filter);
  const highRisk = events.filter((item) => item.status === "HIGH RISK").length;
  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="STREAMING EVENT FEED" description="Watch a simulated feed of incoming payment events and inspect each event as it is classified." action={<span className={`stream-state ${running ? "is-running" : "is-paused"}`}><i />{running ? "STREAMING" : "PAUSED"}</span>} />
      <div className="monitor-toolbar"><div className="monitor-metrics"><div><small>EVENTS THIS SESSION</small><strong>{(284 + tick).toLocaleString("en-IN")}</strong></div><div><small>HIGH-RISK IN FEED</small><strong className="text-danger">{highRisk}</strong></div><div><small>SIMULATOR INTERVAL</small><strong>3.2 sec</strong></div></div><div className="monitor-actions"><button className="outline-small" onClick={playAlertTone} title="Play a short test tone">♪ TEST SOUND</button><button className="primary-small" onClick={() => setRunning((v) => !v)}>{running ? "Ⅱ PAUSE STREAM" : "▶ RESUME STREAM"}</button></div></div>
      <section className="glass-card stream-card">
        <div className="card-heading"><div><span className="card-kicker">INCOMING TRANSACTIONS</span><h3>Event stream</h3></div><div className="filter-pills">{["ALL", "HIGH RISK", "REVIEW", "LOW RISK"].map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
        <div className="stream-list">{filtered.map((event, index) => <div className="stream-row" key={`${event.id}-${index}`} role="button" tabIndex="0" onClick={() => setSelectedEvent(event)} onKeyDown={(e) => e.key === "Enter" && setSelectedEvent(event)}><span className="stream-time">{event.time}</span><span className="stream-id">{event.id}</span><span className="stream-location">{event.location} / {event.channel}</span><strong>{money(event.amount)}</strong><RiskBadge status={event.status} /><span className="stream-score">{event.score}/100</span></div>)}{!filtered.length && <div className="empty-state">No events match this filter.</div>}</div>
        <div className="demo-disclaimer">SIMULATED EVENT STREAM · THESE EVENTS ARE GENERATED IN THE BROWSER AND ARE NOT BANK TRANSACTIONS.</div>
      </section>
      {selectedEvent && <div className="drawer-backdrop" onClick={() => setSelectedEvent(null)}><aside className="detail-drawer" onClick={(e) => e.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedEvent(null)}>×</button><span className="card-kicker">LIVE EVENT DETAIL</span><h2>{selectedEvent.id}</h2><RiskBadge status={selectedEvent.status}/><div className="drawer-amount">{money(selectedEvent.amount)}</div><div className="detail-grid">{[["SENDER", selectedEvent.sender], ["RECEIVER", selectedEvent.receiver], ["LOCATION", selectedEvent.location], ["CHANNEL", selectedEvent.channel], ["DEVICE", selectedEvent.device], ["RISK SCORE", `${selectedEvent.score}/100`], ["EVENT TIME", selectedEvent.time]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p className="drawer-note">This event was generated by the local stream simulator, not received from a payment network.</p></aside></div>}
    </div>
  );
}

function TransactionsPage({ module, initialFilter }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter || "ALL");
  const [preset, setPreset] = useState(initialFilter === "HIGH RISK" ? "high-risk" : "all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(["flow", "amount", "location", "score", "status", "time"]);
  useEffect(() => {
    setFilter(initialFilter || "ALL");
    setPreset(initialFilter === "HIGH RISK" ? "high-risk" : "all");
  }, [initialFilter]);
  useEffect(() => { setPage(1); }, [search, filter, preset, sort, pageSize]);

  const columnOptions = [
    ["flow", "Account flow"], ["amount", "Amount"], ["location", "Location"],
    ["score", "Risk score"], ["status", "Status"], ["time", "Time"],
  ];
  const filtered = INITIAL_TRANSACTIONS.filter((item) => {
    const matchesFilter = filter === "ALL" || item.status === filter;
    const haystack = `${item.id} ${item.sender} ${item.receiver} ${item.location} ${item.device}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesPreset = preset === "shared-device" ? item.device === "DV-881A" : preset === "high-value" ? item.amount >= 100000 : true;
    return matchesFilter && matchesSearch && matchesPreset;
  }).sort((a, b) => sort === "amount-high" ? b.amount - a.amount : sort === "amount-low" ? a.amount - b.amount : sort === "risk" ? b.score - a.score : INITIAL_TRANSACTIONS.indexOf(a) - INITIAL_TRANSACTIONS.indexOf(b));
  const pageCount = Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * Number(pageSize), currentPage * Number(pageSize));
  const toggleSelected = (id) => setSelected((old) => old.includes(id) ? old.filter((v) => v !== id) : [...old, id]);
  const choosePreset = (value) => {
    setPreset(value);
    if (value === "high-risk") { setFilter("HIGH RISK"); setSearch(""); }
    else { setFilter("ALL"); setSearch(""); }
  };
  const renderCell = (row, key) => {
    if (key === "flow") return <td key={key}>{row.sender}<small>→ {row.receiver}</small></td>;
    if (key === "amount") return <td key={key} className="amount-cell">{money(row.amount)}</td>;
    if (key === "location") return <td key={key}>{row.location}</td>;
    if (key === "score") return <td key={key}><div className="score-cell"><span>{row.score}</span><i><b style={{ width: `${row.score}%` }} /></i></div></td>;
    if (key === "status") return <td key={key}><RiskBadge status={row.status} /></td>;
    if (key === "time") return <td key={key}>{row.time}</td>;
    return null;
  };

  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="TRANSACTION DATA EXPLORER" description="Search the sample transaction ledger, apply saved views, customize the table and export selected records." action={<button className="outline-small" onClick={() => downloadCsv("fraudx-transactions.csv", filtered)}>↓ EXPORT CSV</button>} />
      <div className="explorer-summary"><span><strong>{filtered.length}</strong> RECORDS MATCHING</span><span>{selected.length} SELECTED</span><span className="demo-mini">SAMPLE DATASET</span></div>
      <section className="glass-card explorer-card">
        <div className="explorer-controls">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => { setSearch(e.target.value); setPreset("custom"); }} placeholder="Search transaction, account, device..." /></label>
          <select className="compact-select" value={filter} onChange={(e) => { setFilter(e.target.value); setPreset("custom"); }}><option value="ALL">All risk levels</option><option>HIGH RISK</option><option>REVIEW</option><option>LOW RISK</option></select>
          <select className="compact-select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="risk">Highest risk</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option></select>
          <select className="compact-select" value={preset} onChange={(e) => choosePreset(e.target.value)}><option value="all">Saved view: All</option><option value="high-risk">High-risk queue</option><option value="shared-device">Shared device cluster</option><option value="high-value">High-value transfers</option><option value="custom">Custom filters</option></select>
          <details className="column-menu"><summary>▤ COLUMNS</summary><div className="column-menu-popover">{columnOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={visibleColumns.includes(key)} onChange={(e) => setVisibleColumns((old) => e.target.checked ? [...old, key] : old.filter((item) => item !== key))}/>{label}</label>)}</div></details>
        </div>
        {selected.length > 0 && <div className="bulk-bar"><span>{selected.length} TRANSACTIONS SELECTED</span><button onClick={() => downloadCsv("fraudx-selected-transactions.csv", INITIAL_TRANSACTIONS.filter((r) => selected.includes(r.id)))}>EXPORT SELECTED ↗</button><button onClick={() => setSelected([])}>CLEAR</button></div>}
        <div className="table-scroll"><table className="data-table explorer-table"><thead><tr><th><input type="checkbox" aria-label="Select all visible" checked={visible.length > 0 && visible.every((r) => selected.includes(r.id))} onChange={(e) => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map((r) => r.id)])] : selected.filter((id) => !visible.some((r) => r.id === id)))} /></th><th>TRANSACTION</th>{visibleColumns.map((key) => <th key={key}>{columnOptions.find(([id]) => id === key)?.[1].toUpperCase()}</th>)}</tr></thead><tbody>{visible.map((row) => <tr key={row.id} onClick={() => setDetail(row)}><td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleSelected(row.id)} aria-label={`Select ${row.id}`} /></td><td><strong>{row.id}</strong><small>{row.channel} · {row.device}</small></td>{visibleColumns.map((key) => renderCell(row, key))}</tr>)}</tbody></table>{!visible.length && <div className="empty-state">No transactions match your search.</div>}</div>
        <div className="table-footer"><span>Showing {visible.length ? (currentPage - 1) * Number(pageSize) + 1 : 0}–{(currentPage - 1) * Number(pageSize) + visible.length} of {filtered.length} sample records</span><div className="pagination"><label>ROWS <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}><option>5</option><option>10</option></select></label><button disabled={currentPage <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>←</button><span>{currentPage} / {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => setPage((v) => Math.min(pageCount, v + 1))}>→</button></div></div>
      </section>
      {detail && <div className="drawer-backdrop" onClick={() => setDetail(null)}><aside className="detail-drawer" onClick={(e) => e.stopPropagation()}><button className="drawer-close" onClick={() => setDetail(null)}>×</button><span className="card-kicker">TRANSACTION RECORD</span><h2>{detail.id}</h2><RiskBadge status={detail.status} /><div className="drawer-amount">{money(detail.amount)}</div><div className="detail-grid">{[["SENDER", detail.sender], ["RECEIVER", detail.receiver], ["LOCATION", detail.location], ["CHANNEL", detail.channel], ["DEVICE", detail.device], ["RISK SCORE", `${detail.score}/100`], ["TIME", detail.time]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p className="drawer-note">Sample transaction record for frontend demonstration. Connect the transaction detail endpoint to replace this local record.</p></aside></div>}
    </div>
  );
}

function InvestigationsPage({ module }) {
  const [cases, setCases] = useState(INITIAL_CASES);
  const [selectedId, setSelectedId] = useState(INITIAL_CASES[0].id);
  const [note, setNote] = useState("");
  const selected = cases.find((item) => item.id === selectedId) || cases[0];
  const updateCase = (id, patch) => setCases((old) => old.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addNote = (event) => { event.preventDefault(); if (!note.trim()) return; updateCase(selected.id, { notes: [...selected.notes, note.trim()] }); setNote(""); };
  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="CASE MANAGEMENT WORKSPACE" description="Review suspicious activity, keep an investigation trail and record analyst outcomes." action={<span className="demo-mini">LOCAL DEMO CASES</span>} />
      <div className="case-layout"><section className="glass-card case-list"><div className="card-heading"><div><span className="card-kicker">INVESTIGATION QUEUE</span><h3>Open cases <span className="count-bubble">{cases.filter((c) => c.status !== "RESOLVED").length}</span></h3></div></div>{cases.map((item) => <button key={item.id} className={`case-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><div className="case-item-top"><strong>{item.id}</strong><RiskBadge status={item.priority} /></div><b>{item.title}</b><span>{item.transaction} · {money(item.amount)}</span><small>{item.status} · {item.owner}</small></button>)}</section>
        <section className="glass-card case-detail"><div className="case-detail-top"><div><span className="card-kicker">CASE / {selected.id}</span><h3>{selected.title}</h3></div><RiskBadge status={selected.priority} /></div><p className="case-reason">{selected.reason}</p><div className="case-facts"><div><small>LINKED TRANSACTION</small><strong>{selected.transaction}</strong></div><div><small>AMOUNT</small><strong>{money(selected.amount)}</strong></div><div><small>ASSIGNED TO</small><strong>{selected.owner}</strong></div><div><small>CASE STATUS</small><strong>{selected.status}</strong></div></div><div className="case-actions"><button className="outline-small" onClick={() => updateCase(selected.id, { status: "IN REVIEW", owner: selected.owner === "Unassigned" ? "You" : selected.owner })}>TAKE / REVIEW CASE</button><button className="primary-small" onClick={() => updateCase(selected.id, { status: "RESOLVED" })}>MARK RESOLVED ✓</button><button className="quiet-small" onClick={() => updateCase(selected.id, { status: "OPEN" })}>REOPEN</button></div><div className="case-notes"><div className="card-heading"><div><span className="card-kicker">INVESTIGATION LOG</span><h3>Analyst notes</h3></div></div>{selected.notes.length ? selected.notes.map((entry, i) => <div className="note-entry" key={`${selected.id}-${i}`}><span>NOTE {String(i + 1).padStart(2, "0")}</span><p>{entry}</p></div>) : <div className="empty-state empty-state-small">No notes recorded for this case.</div>}<form className="note-form" onSubmit={addNote}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an investigation note..." /><button type="submit" disabled={!note.trim()}>ADD NOTE ↗</button></form></div></section></div>
      <div className="demo-disclaimer">CASE CHANGES AND NOTES ARE STORED IN FRONTEND STATE ONLY. PERSISTENCE REQUIRES A CASE-MANAGEMENT API.</div>
    </div>
  );
}

const GRAPH_NODES = [
  { id: "AC-90821", type: "ACCOUNT", x: 145, y: 210, label: "AC-90821", risk: "HIGH" },
  { id: "DV-881A", type: "DEVICE", x: 340, y: 115, label: "DV-881A", risk: "HIGH" },
  { id: "AC-11993", type: "ACCOUNT", x: 525, y: 190, label: "AC-11993", risk: "HIGH" },
  { id: "AC-33201", type: "ACCOUNT", x: 495, y: 335, label: "AC-33201", risk: "HIGH" },
  { id: "IP-44.18", type: "IP ADDRESS", x: 330, y: 365, label: "IP-44.18", risk: "MEDIUM" },
  { id: "MR-220", type: "MERCHANT", x: 120, y: 365, label: "MR-220", risk: "LOW" },
  { id: "AC-77109", type: "ACCOUNT", x: 80, y: 75, label: "AC-77109", risk: "LOW" },
  { id: "DV-102B", type: "DEVICE", x: 555, y: 70, label: "DV-102B", risk: "LOW" },
];
const GRAPH_LINKS = [["AC-90821", "DV-881A"], ["DV-881A", "AC-11993"], ["DV-881A", "AC-33201"], ["AC-33201", "IP-44.18"], ["AC-90821", "MR-220"], ["AC-90821", "AC-77109"], ["AC-11993", "DV-102B"], ["AC-11993", "IP-44.18"]];

function NetworkPage({ module }) {
  const [selected, setSelected] = useState("DV-881A");
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const node = GRAPH_NODES.find((item) => item.id === selected);
  const connected = GRAPH_LINKS.filter(([a, b]) => a === selected || b === selected).map(([a, b]) => a === selected ? b : a);
  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="ENTITY RELATIONSHIP GRAPH" description="Select a node to inspect its connections. The graph below uses a small synthetic relationship set." action={<span className="demo-mini">SYNTHETIC GRAPH</span>} />
      <div className="network-layout"><section className="glass-card network-card"><div className="card-heading"><div><span className="card-kicker">ENTITY TOPOLOGY</span><h3>Relationship map</h3></div><div className="graph-tools"><button onClick={() => setZoom((v) => Math.min(1.35, v + 0.1))}>＋</button><button onClick={() => setZoom((v) => Math.max(0.7, v - 0.1))}>−</button><button onClick={() => setZoom(1)}>RESET</button></div></div><div className="network-canvas"><svg viewBox="0 0 650 440" role="img" aria-label="Interactive graph of linked accounts, devices, IP addresses and merchants"><g transform={`translate(${325 - 325 * zoom} ${220 - 220 * zoom}) scale(${zoom})`}>{GRAPH_LINKS.map(([a, b]) => { const from = GRAPH_NODES.find((n) => n.id === a); const to = GRAPH_NODES.find((n) => n.id === b); const active = a === selected || b === selected; return <line key={`${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={active ? "graph-edge graph-edge-active" : "graph-edge"} />; })}{GRAPH_NODES.map((item) => { const active = item.id === selected; const isConnected = connected.includes(item.id); return <g key={item.id} className="graph-node" onClick={() => setSelected(item.id)} role="button" tabIndex="0" onKeyDown={(e) => e.key === "Enter" && setSelected(item.id)}><circle cx={item.x} cy={item.y} r={active ? 23 : 17} className={`graph-node-halo ${item.risk.toLowerCase()} ${active ? "active" : ""}`} /><circle cx={item.x} cy={item.y} r={active ? 8 : 6} className={`graph-node-core ${item.risk.toLowerCase()} ${active || isConnected ? "bright" : ""}`} />{showLabels && <text x={item.x} y={item.y + 35} textAnchor="middle" className="graph-label">{item.label}</text>}</g>; })}</g></svg></div><div className="graph-legend"><span><i className="node-account"/> Account</span><span><i className="node-device"/> Device</span><span><i className="node-ip"/> IP / Merchant</span><label><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> LABELS</label></div></section>
        <aside className="glass-card entity-card"><span className="card-kicker">SELECTED ENTITY</span><div className="entity-symbol">◉</div><h3>{node.id}</h3><span className="entity-type">{node.type}</span><RiskBadge status={node.risk === "HIGH" ? "HIGH RISK" : node.risk === "MEDIUM" ? "REVIEW" : "LOW RISK"} /><div className="entity-stats"><div><small>DIRECT CONNECTIONS</small><strong>{connected.length}</strong></div><div><small>ENTITY RISK</small><strong>{node.risk}</strong></div></div><div className="connected-list"><span className="card-kicker">CONNECTED ENTITIES</span>{connected.map((id) => <button key={id} onClick={() => setSelected(id)}>{id}<span>↗</span></button>)}</div><p className="drawer-note">Relationships are illustrative and must be replaced with verified graph data from the backend.</p></aside></div>
    </div>
  );
}

function ModelLabPage({ module }) {
  const [threshold, setThreshold] = useState(55);
  const tp = Math.round(940 - (threshold - 20) * 4.2);
  const fn = 1000 - tp;
  const fp = Math.round(320 - (threshold - 20) * 4.0);
  const tn = 8000 - fp;
  const precision = Math.round((tp / (tp + fp)) * 100);
  const recall = Math.round((tp / (tp + fn)) * 100);
  const f1 = Math.round((2 * precision * recall / (precision + recall)) * 10) / 10;
  const features = [["Transaction amount deviation", 88], ["Device familiarity", 76], ["Transaction velocity", 68], ["Location anomaly", 54], ["Account age", 31]];
  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="MODEL EVALUATION WORKSPACE" description="Explore how a classification threshold changes the precision–recall trade-off on a demonstration evaluation set." action={<span className="demo-mini">ILLUSTRATIVE EVALUATION</span>} />
      <div className="stat-grid stat-grid-3"><StatCard label="PRECISION" value={`${precision}%`} change="Flagged predictions that are correct" icon="◎" tone="success" /><StatCard label="RECALL" value={`${recall}%`} change="Actual fraud cases detected" icon="⌖" tone="warning" /><StatCard label="F1 SCORE" value={`${f1}%`} change="Harmonic mean of precision & recall" icon="∿" /></div>
      <section className="glass-card threshold-card"><div className="card-heading"><div><span className="card-kicker">DECISION POLICY</span><h3>Risk threshold simulator</h3></div><strong className="threshold-value">{threshold}%</strong></div><input className="threshold-slider" type="range" min="20" max="90" step="1" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /><div className="threshold-labels"><span>MORE SENSITIVE · HIGHER RECALL</span><span>MORE SELECTIVE · HIGHER PRECISION</span></div><p className="threshold-explain">Raising the threshold reduces the number of alerts but can also allow more fraudulent transactions to pass undetected. These figures are a front-end illustration, not metrics from a trained model.</p></section>
      <div className="content-grid model-grid"><section className="glass-card matrix-card"><div className="card-heading"><div><span className="card-kicker">CLASSIFICATION OUTCOMES</span><h3>Confusion matrix</h3></div></div><div className="matrix"><div className="matrix-axis">PREDICTED →</div><div className="matrix-labels"><span>ACTUAL<br/>FRAUD</span><span>ACTUAL<br/>LEGITIMATE</span></div><div className="matrix-cells"><div className="matrix-cell tp"><small>TRUE POSITIVE</small><strong>{tp}</strong></div><div className="matrix-cell fp"><small>FALSE POSITIVE</small><strong>{fp}</strong></div><div className="matrix-cell fn"><small>FALSE NEGATIVE</small><strong>{fn}</strong></div><div className="matrix-cell tn"><small>TRUE NEGATIVE</small><strong>{tn.toLocaleString("en-IN")}</strong></div></div></div></section><section className="glass-card features-card"><div className="card-heading"><div><span className="card-kicker">MODEL EXPLANATION</span><h3>Illustrative feature impact</h3></div></div>{features.map(([label, value]) => <div className="feature-bar" key={label}><div><span>{label}</span><strong>{value}%</strong></div><i><b style={{ width: `${value}%` }} /></i></div>)}<p className="drawer-note">Feature values are sample visualization data. Connect SHAP or another explainer to show model-derived importance.</p></section></div>
      <div className="curves-grid"><section className="glass-card curve-card"><div className="card-heading"><div><span className="card-kicker">THRESHOLD RESPONSE</span><h3>Precision–recall profile</h3></div><span className="demo-mini">ILLUSTRATIVE</span></div><svg viewBox="0 0 420 150" preserveAspectRatio="none"><path d="M18 15 V128 H405" className="curve-axis"/><path d="M18 24 C65 30 90 51 130 61 S205 80 250 96 S340 113 405 119" className="curve-line"/><circle cx={18 + ((threshold - 20) / 70) * 385} cy={24 + ((threshold - 20) / 70) * 95} r="5" className="curve-marker"/></svg><div className="curve-foot"><span>HIGH RECALL</span><strong>THRESHOLD {threshold}%</strong><span>HIGH PRECISION</span></div></section><section className="glass-card curve-card"><div className="card-heading"><div><span className="card-kicker">CLASSIFIER SEPARATION</span><h3>ROC profile</h3></div><span className="demo-mini">ILLUSTRATIVE</span></div><svg viewBox="0 0 420 150" preserveAspectRatio="none"><path d="M18 15 V128 H405" className="curve-axis"/><path d="M18 128 C35 64 80 31 155 21 S310 17 405 15" className="curve-line curve-line-secondary"/><path d="M18 128 L405 15" className="curve-baseline"/></svg><div className="curve-foot"><span>FALSE POSITIVE RATE</span><strong>ROC SHAPE SAMPLE</strong><span>TRUE POSITIVE RATE</span></div></section></div>
    </div>
  );
}

function ReportsPage({ module }) {
  const [range, setRange] = useState("Last 30 days");
  const reportSets = {
    "Last 7 days": [
      { period: "Mon", tx: 2240, alerts: 52, loss: 98000 }, { period: "Tue", tx: 2860, alerts: 71, loss: 124000 },
      { period: "Wed", tx: 2510, alerts: 60, loss: 105000 }, { period: "Thu", tx: 3120, alerts: 79, loss: 141000 },
      { period: "Fri", tx: 2790, alerts: 66, loss: 118000 }, { period: "Sat", tx: 1940, alerts: 43, loss: 87000 },
      { period: "Sun", tx: 1680, alerts: 38, loss: 76000 },
    ],
    "Last 30 days": [
      { period: "Week 1", tx: 18240, alerts: 426, loss: 820000 }, { period: "Week 2", tx: 21600, alerts: 510, loss: 940000 },
      { period: "Week 3", tx: 19800, alerts: 468, loss: 710000 }, { period: "Week 4", tx: 24350, alerts: 592, loss: 1120000 },
    ],
    "Last 90 days": [
      { period: "Period 1", tx: 61200, alerts: 1410, loss: 2420000 }, { period: "Period 2", tx: 68400, alerts: 1590, loss: 2860000 },
      { period: "Period 3", tx: 72900, alerts: 1780, loss: 3140000 }, { period: "Period 4", tx: 83100, alerts: 1996, loss: 3590000 },
    ],
  };
  const rows = reportSets[range];
  const totalVolume = rows.reduce((sum, item) => sum + item.tx, 0);
  const totalAlerts = rows.reduce((sum, item) => sum + item.alerts, 0);
  const estimatedExposure = rows.reduce((sum, item) => sum + item.loss, 0);
  return (
    <div className="module-page">
      <PanelHeader module={module} eyebrow="ANALYTICS & EXPORTS" description="A reporting snapshot for operational review. Download the underlying sample aggregates as CSV." action={<select className="compact-select" value={range} onChange={(e) => setRange(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select>} />
      <div className="stat-grid stat-grid-3"><StatCard label="TOTAL VOLUME" value={totalVolume.toLocaleString("en-IN")} change={`${range} · sample aggregate`} icon="▤" /><StatCard label="ALERTS GENERATED" value={totalAlerts.toLocaleString("en-IN")} change="Sample alert count" icon="◈" tone="warning" /><StatCard label="EST. EXPOSURE" value={compactMoney(estimatedExposure)} change="Illustrative estimate only" icon="↗" tone="success" /></div>
      <section className="glass-card report-card"><div className="card-heading"><div><span className="card-kicker">PERIODIC PERFORMANCE</span><h3>Period fraud signals</h3></div><button className="outline-small" onClick={() => downloadCsv("fraudx-weekly-report.csv", rows)}>↓ EXPORT REPORT</button></div><div className="report-bars">{rows.map((row) => <div className="report-bar-column" key={row.period}><div className="report-bar-pair"><i style={{ height: `${(row.tx / Math.max(...rows.map((item) => item.tx))) * 100}%` }} /><b style={{ height: `${(row.alerts / Math.max(...rows.map((item) => item.alerts))) * 100}%` }} /></div><strong>{row.period}</strong><small>{row.tx.toLocaleString("en-IN")} tx</small></div>)}</div><div className="report-legend"><span><i/> Transactions</span><span><i/> Flagged alerts</span></div></section>
      <section className="glass-card table-card"><div className="card-heading"><div><span className="card-kicker">REPORT DATASET</span><h3>Period summary</h3></div><button className="text-action" onClick={() => window.print()}>PRINT / SAVE PDF ↗</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>PERIOD</th><th>TRANSACTIONS</th><th>ALERTS</th><th>ILLUSTRATIVE EXPOSURE</th></tr></thead><tbody>{rows.map((r) => <tr key={r.period}><td><strong>{r.period}</strong></td><td>{r.tx.toLocaleString("en-IN")}</td><td>{r.alerts}</td><td>{money(r.loss)}</td></tr>)}</tbody></table></div></section>
      <div className="demo-disclaimer">ALL REPORT VALUES ARE SYNTHETIC DEMONSTRATION DATA, NOT ACTUAL FINANCIAL PERFORMANCE.</div>
    </div>
  );
}

function SettingsPage({ module, preferences, setPreferences }) {
  const update = (key, value) => setPreferences((old) => ({ ...old, [key]: value }));
  return (
    <div className="module-page"><PanelHeader module={module} eyebrow="WORKSPACE CONFIGURATION" description="Adjust local interface preferences. These settings currently apply only in this browser session." action={<span className="demo-mini">LOCAL PREFERENCES</span>} />
      <section className="glass-card settings-card"><div className="settings-row"><div><strong>Reduced motion</strong><p>Reduce non-essential interface transitions and motion effects.</p></div><button className={`toggle ${preferences.reducedMotion ? "on" : ""}`} onClick={() => update("reducedMotion", !preferences.reducedMotion)} aria-pressed={preferences.reducedMotion}><i/></button></div><div className="settings-row"><div><strong>Sound alerts</strong><p>Allow sound cues for new simulated high-risk events.</p></div><button className={`toggle ${preferences.sound ? "on" : ""}`} onClick={() => update("sound", !preferences.sound)} aria-pressed={preferences.sound}><i/></button></div><div className="settings-row"><div><strong>Compact data tables</strong><p>Use denser rows in transaction and report tables.</p></div><button className={`toggle ${preferences.compactTables ? "on" : ""}`} onClick={() => update("compactTables", !preferences.compactTables)} aria-pressed={preferences.compactTables}><i/></button></div><div className="settings-row"><div><strong>Demo data labels</strong><p>Keep visible labels wherever sample data is displayed.</p></div><button className={`toggle ${preferences.demoLabels ? "on" : ""}`} onClick={() => update("demoLabels", !preferences.demoLabels)} aria-pressed={preferences.demoLabels}><i/></button></div></section>
      <section className="glass-card about-card"><span className="card-kicker">APPLICATION BUILD</span><h3>FRAUD-X / Financial Threat Intelligence</h3><p>React · React Three Fiber · Three.js · Spring Boot API integration</p><div className="about-meta"><span>FRONTEND DEMONSTRATION BUILD</span><span>MODULE SYSTEM 1.0</span></div></section>
    </div>
  );
}

function TransactionAnalysisPage({ module }) {
  const [amount, setAmount] = useState("150000");
  const [sender, setSender] = useState("Account-A");
  const [receiver, setReceiver] = useState("Account-B");
  const [location, setLocation] = useState("Delhi");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function checkTransaction(event) {
    event.preventDefault(); setLoading(true); setResult(""); setError(false);
    try {
      const response = await fetch("http://localhost:8080/api/fraud/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), sender, receiver, location }),
      });
      const responseText = await response.text();
      if (!response.ok) { setError(true); setResult(`Request rejected: ${responseText}`); }
      else setResult(`Transaction assessment: ${responseText}`);
    } catch {
      setError(true); setResult("Could not connect to the Spring Boot backend. Make sure it is running on port 8080.");
    } finally { setLoading(false); }
  }
  return (
    <div className="module-page analysis-page"><PanelHeader module={module} eyebrow="SINGLE-TRANSACTION ASSESSMENT" description="Submit a transaction to the currently connected Spring Boot fraud assessment endpoint." action={<span className="api-state"><i/> LOCAL API</span>} />
      <section className="glass-card analysis-form-card"><div className="form-card-heading"><div><span className="card-kicker">TRANSACTION PARAMETERS</span><h3>New assessment</h3></div><span className="form-step">INPUT / 01</span></div><form className="analysis-form" onSubmit={checkTransaction}><label className="form-field"><span>TRANSACTION AMOUNT</span><div className="input-shell amount-shell"><span>₹</span><input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"/></div></label><div className="form-grid"><label className="form-field"><span>SENDER ACCOUNT</span><input required value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Account-A"/></label><label className="form-field"><span>RECEIVER ACCOUNT</span><input required value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Account-B"/></label></div><label className="form-field"><span>TRANSACTION LOCATION <small>OPTIONAL</small></span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or region"/></label><button className="analyse-button" type="submit" disabled={loading}><span>{loading ? "ASSESSMENT IN PROGRESS" : "ANALYSE TRANSACTION"}</span><span>{loading ? "◌" : "↗"}</span></button></form>{result && <div className={`assessment-result ${error ? "result-error" : ""}`} role="status" aria-live="polite"><span className="result-indicator"/><div><strong>{error ? "CONNECTION / VALIDATION RESPONSE" : "ASSESSMENT RESPONSE"}</strong><p>{result}</p></div></div>}<div className="form-footnote"><i/> The existing backend returns a rule-based risk label. This screen does not claim to use a trained ML model.</div></section>
      <section className="glass-card assessment-info"><span className="card-kicker">CURRENT BACKEND RULES</span><div className="rule-row"><span>Amount ≤ 0</span><RiskBadge status="INVALID"/></div><div className="rule-row"><span>Amount ≥ ₹1,00,000</span><RiskBadge status="HIGH RISK"/></div><div className="rule-row"><span>Missing location</span><RiskBadge status="REVIEW"/></div><div className="rule-row"><span>Other valid inputs</span><RiskBadge status="LOW RISK"/></div></section>
    </div>
  );
}

function ModuleContent({ module, initialFilter, preferences, setPreferences, onNavigate }) {
  switch (module.id) {
    case "analysis": return <TransactionAnalysisPage module={module}/>;
    case "overview": return <OverviewPage module={module} onNavigate={onNavigate}/>;
    case "monitor": return <LiveMonitorPage module={module} soundEnabled={preferences.sound}/>;
    case "transactions": return <TransactionsPage module={module} initialFilter={initialFilter}/>;
    case "investigations": return <InvestigationsPage module={module}/>;
    case "network": return <NetworkPage module={module}/>;
    case "model": return <ModelLabPage module={module}/>;
    case "reports": return <ReportsPage module={module}/>;
    case "settings": return <SettingsPage module={module} preferences={preferences} setPreferences={setPreferences}/>;
    default: return null;
  }
}

function App() {
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [initialFilter, setInitialFilter] = useState("ALL");
  const [preferences, setPreferences] = useState({ reducedMotion: false, sound: false, compactTables: false, demoLabels: true });
  const selectedModule = MODULES.find((item) => item.id === activeModule) || null;
  const palette = selectedModule ? PALETTES[selectedModule.id] : PALETTES.home;

  function returnToModules() { setActiveModule(null); setInitialFilter("ALL"); setCommandCenterOpen(true); }
  function returnToLanding() { setActiveModule(null); setInitialFilter("ALL"); setCommandCenterOpen(false); }
  function selectModule(id) { setActiveModule(id); setCommandCenterOpen(false); setInitialFilter("ALL"); }
  function navigateTo(id, filter = "ALL") { setInitialFilter(filter); setActiveModule(id); setCommandCenterOpen(false); }

  return (
    <main className={`app ${selectedModule ? "app--workspace" : ""} ${preferences.reducedMotion ? "app--reduced-motion" : ""}`} style={{ "--accent": palette.accent, "--accent-rgb": palette.rgb, "--app-bg": palette.background }}>
      <Canvas camera={{ position: [0, 1.4, 15], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false }}>
        <Scene palette={palette} moduleId={activeModule} active={Boolean(selectedModule || commandCenterOpen)} reducedMotion={preferences.reducedMotion}/>
        <EffectComposer><Bloom intensity={1.35} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur/></EffectComposer>
      </Canvas>

      <header className="topbar"><div className="brand"><div className="brand-mark">F</div><div><div className="brand-name">FRAUD DETECTION</div><div className="brand-subtitle">FINANCIAL THREAT INTELLIGENCE</div></div></div><div className="topbar-right"><div className="system-status"><span className="status-dot"/>{selectedModule ? `${selectedModule.title.toUpperCase()} ENVIRONMENT` : "SYSTEM ONLINE"}</div>{selectedModule && <button className="back-button" onClick={returnToModules}><span>←</span> ALL MODULES</button>}{commandCenterOpen && <button className="back-button" onClick={returnToLanding}>CLOSE <span>×</span></button>}</div></header>

      {!commandCenterOpen && !selectedModule && <section className="hero"><div className="hero-label">REAL-TIME FINANCIAL PROTECTION</div><h1>FRAUD<br/><span>DETECTION</span></h1><p>Transaction intelligence designed to surface suspicious activity before it becomes a financial threat.</p><button className="launch-button" onClick={() => setCommandCenterOpen(true)}>OPEN COMMAND CENTER <span>↗</span></button></section>}

      {commandCenterOpen && !selectedModule && <section className="command-panel"><div className="panel-kicker">FRAUD-X / COMMAND CENTER</div><h1>Choose your <span>operation.</span></h1><p className="panel-description">Each module opens a dedicated intelligence environment. The visual core changes colour to match the selected operation.</p><div className="module-grid">{MODULES.map((item) => <button key={item.id} className="module-card" onClick={() => selectModule(item.id)}><span className="module-icon">{item.icon}</span><span className="module-copy"><span className="module-index">MODULE {item.number} · {item.category}</span><strong>{item.title}</strong><span>{item.short}</span></span><span className="module-arrow">↗</span></button>)}</div><div className="coming-soon-note"><span className="coming-soon-line"/> SELECT A MODULE TO TRANSFORM THE VISUAL CORE</div></section>}

      {selectedModule && <section className={`workspace-panel ${preferences.compactTables ? "workspace-compact" : ""} ${preferences.demoLabels ? "" : "hide-demo-labels"}`} key={selectedModule.id}><ModuleContent module={selectedModule} initialFilter={initialFilter} preferences={preferences} setPreferences={setPreferences} onNavigate={navigateTo}/></section>}

      <div className="scene-caption" aria-hidden="true"><span>FRAUD-X / VISUAL CORE</span><span>{selectedModule ? `${selectedModule.number} · ${selectedModule.category}` : "AMETHYST ENERGY STATE"}</span></div>
    </main>
  );
}

useGLTF.preload("/models/royal-amethyst-core.glb");
useGLTF.preload("/models/aquamarine-starry-night.glb");
useGLTF.preload("/models/sapphire-aegis-threat-overview.glb");
export default App;
