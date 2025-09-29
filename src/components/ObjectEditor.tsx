
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Cylinder } from "@react-three/drei";

type ObjectType = "box" | "sphere" | "cylinder";
type SceneObject = {
  type: ObjectType;
  position: [number, number, number];
  color?: string;
};

const defaultColors: Record<ObjectType, string> = {
  box: "orange",
  sphere: "skyblue",
  cylinder: "lightgreen",
};

export default function ObjectEditor() {
  const [objects, setObjects] = useState<SceneObject[]>([
    { type: "box", position: [0, 0, 0], color: defaultColors.box },
  ]);
  const [dragged, setDragged] = useState<number | null>(null);

  function addObject(type: ObjectType) {
    setObjects((objs) => [
      ...objs,
      {
        type,
        position: [Math.random() * 2 - 1, 0, Math.random() * 2 - 1],
        color: defaultColors[type],
      },
    ]);
  }

  function handlePointerDown(idx: number) {
    setDragged(idx);
  }
  function handlePointerUp() {
    setDragged(null);
  }
  function handlePointerMove(e: any, idx: number) {
    if (dragged === idx) {
      // Flytt objektet i XZ-plan
      const [x, , z] = e.point.toArray();
      setObjects((objs) =>
        objs.map((obj, i) =>
          i === idx ? { ...obj, position: [x, 0, z] } : obj
        )
      );
    }
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => addObject("box")}>Legg til kube</button>
        <button onClick={() => addObject("sphere")}>Legg til sfære</button>
        <button onClick={() => addObject("cylinder")}>Legg til sylinder</button>
      </div>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight />
        <OrbitControls />
        {objects.map((obj, i) => {
          const commonProps = {
            position: obj.position as [number, number, number],
            onPointerDown: () => handlePointerDown(i),
            onPointerUp: handlePointerUp,
            onPointerMove: (e: any) => handlePointerMove(e, i),
            castShadow: true,
            receiveShadow: true,
            style: { cursor: dragged === i ? "grabbing" : "grab" },
          };
          if (obj.type === "box")
            return (
              <Box key={i} args={[1, 1, 1]} {...commonProps}>
                <meshStandardMaterial color={obj.color} />
              </Box>
            );
          if (obj.type === "sphere")
            return (
              <Sphere key={i} args={[0.7, 32, 32]} {...commonProps}>
                <meshStandardMaterial color={obj.color || "skyblue"} />
              </Sphere>
            );
          if (obj.type === "cylinder")
            return (
              <Cylinder key={i} args={[0.5, 0.5, 1.5, 32]} {...commonProps}>
                <meshStandardMaterial color={obj.color || "lightgreen"} />
              </Cylinder>
            );
          return null;
        })}
      </Canvas>
    </div>
  );
}
