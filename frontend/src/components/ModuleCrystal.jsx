
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";

// All future crystal models will be registered here.
const CRYSTALS = {
  analysis: {
    url: "/models/aquamarine-starry-night.glb",
    root: "AQUAMARINE_CRYSTAL_ROOT",
    scale: 0.89,
    position: [1.8, 0.05, 0],
    crystalSpeed: 0.22,
    orbitSpeeds: [0.19, -0.15, 0.12],
    hide: ["Core_Energy_Ring_01", "Core_Energy_Ring_02"],
  },

  overview: {
    url: "/models/sapphire-aegis-threat-overview.glb",
    root: "SAPPHIRE_CRYSTAL_ROOT",
    scale: 0.91,
    position: [1.8, 0.05, 0],
    crystalSpeed: 0.16,
    orbitSpeeds: [0.17, -0.12, 0.09],
    hide: [],
  },
};

const ORBIT_NAMES = [
  "Precision_Orbit_Inner",
  "Precision_Orbit_Middle",
  "Precision_Orbit_Outer",
];

const yAxis = new Vector3(0, 1, 0);

export default function ModuleCrystal({
  moduleId,
  reducedMotion = false,
}) {
  const config = CRYSTALS[moduleId];
  const { scene: sourceScene } = useGLTF(config.url);

  const {
    assetScene,
    crystalRoot,
    baseY,
    baseRotation,
    orbitControllers,
  } = useMemo(() => {
    const assetScene = sourceScene.clone(true);
    const orbitControllers = [];

    assetScene.traverse((object) => {
      const name = object.name.replace(/\.\d{3}$/, "");

      // Stars are already provided by the website.
      if (
        name.startsWith("Starfield_") ||
        config.hide.includes(name)
      ) {
        object.visible = false;
      }

      const orbitIndex = ORBIT_NAMES.indexOf(name);

      if (orbitIndex !== -1) {
        orbitControllers.push({
          object,
          speed: config.orbitSpeeds[orbitIndex],
          original: object.quaternion.clone(),
          spin: new Quaternion(),
        });
      }
    });

    const crystalRoot = assetScene.getObjectByName(
      config.root
    );

    return {
      assetScene,
      crystalRoot,
      baseY: crystalRoot?.position.y ?? 0,
      baseRotation: crystalRoot?.rotation.y ?? 0,
      orbitControllers,
    };
  }, [sourceScene, config]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (crystalRoot) {
      crystalRoot.rotation.y =
        baseRotation +
        (reducedMotion ? 0 : t * config.crystalSpeed);

      crystalRoot.position.y =
        baseY +
        (reducedMotion ? 0 : Math.sin(t * 0.85) * 0.095);
    }

    orbitControllers.forEach(
      ({ object, speed, original, spin }) => {
        if (reducedMotion) {
          object.quaternion.copy(original);
        } else {
          spin.setFromAxisAngle(yAxis, t * speed);
          object.quaternion.copy(spin).multiply(original);
        }
      }
    );
  });

  return (
    <group
      position={config.position}
      scale={config.scale}
    >
      <primitive object={assetScene} />
    </group>
  );
}
