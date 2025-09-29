import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Cylinder } from "@react-three/drei";


// Enkel scene-state: array av objekter
const initialObjects = [
  { type: "box", position: [0, 0, 0], color: "orange" },
];

export default function ObjectEditor() {
  const objects = initialObjects; // TODO: Gjør dynamisk med useState
  // const sceneRef = useRef<THREE.Scene>(null); // Ikke i bruk foreløpig

  // TODO: Legg til knapper for å legge til objekter og STL-eksport

  return (
    <div style={{ width: "100%", height: 400 }}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
  <ambientLight />
        <OrbitControls />
        {objects.map((obj, i) => {
          if (obj.type === "box")
            return <Box key={i} position={obj.position as [number, number, number]} args={[1, 1, 1]} castShadow receiveShadow>
              <meshStandardMaterial color={obj.color} />
            </Box>;
          if (obj.type === "sphere")
            return <Sphere key={i} position={obj.position as [number, number, number]} args={[0.7, 32, 32]} castShadow receiveShadow>
              <meshStandardMaterial color={obj.color || "skyblue"} />
            </Sphere>;
          if (obj.type === "cylinder")
            return <Cylinder key={i} position={obj.position as [number, number, number]} args={[0.5, 0.5, 1.5, 32]} castShadow receiveShadow>
              <meshStandardMaterial color={obj.color || "lightgreen"} />
            </Cylinder>;
          return null;
        })}
      </Canvas>
    </div>
  );
}
