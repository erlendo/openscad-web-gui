

// Ryddet: kun én versjon av ObjectEditor, type-definisjoner og imports

import React, { useState } from "react";
import { useWorkspaceProvider } from "./providers/WorkspaceProvider";
import { Slider } from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Cylinder, Grid } from "@react-three/drei";

type ObjectType = "box" | "sphere" | "cylinder";
type SceneObject = {
  type: ObjectType;
  position: [number, number, number];
  scale: number;
  color?: string;
};

const defaultColors: Record<ObjectType, string> = {
  box: "blue",
  sphere: "skyblue",
  cylinder: "lightgreen",
};

export default function ObjectEditor() {
  const [objects, setObjects] = useState<SceneObject[]>([
    { type: "box", position: [0, 0, 0], scale: 1, color: defaultColors.box },
  ]);
  const [dragged, setDragged] = useState<number | null>(null);
  const { setCode } = useWorkspaceProvider();

  // Generer OpenSCAD-kode fra scene-objekter
  function generateOpenSCAD(objects: SceneObject[]): string {
    return objects.map(obj => {
      if (obj.type === "box") {
        return `cube([${(obj.scale).toFixed(2)}, ${(obj.scale).toFixed(2)}, ${(obj.scale).toFixed(2)}]);`;
      }
      if (obj.type === "sphere") {
        return `sphere(r=${(0.7 * obj.scale).toFixed(2)});`;
      }
      if (obj.type === "cylinder") {
        return `cylinder(r=${(0.5 * obj.scale).toFixed(2)}, h=${(1.5 * obj.scale).toFixed(2)});`;
      }
      return "";
    }).join("\n");
  }

  function syncToScriptEditor() {
    setCode(generateOpenSCAD(objects));
  }
  function addObject(type: ObjectType) {
    setObjects((objs) => [
      ...objs,
      {
        type,
        position: [Math.random() * 2 - 1, 0, Math.random() * 2 - 1],
        scale: 1,
        color: defaultColors[type],
      },
    ]);
  }
  function handleScaleChange(idx: number, value: number) {
    setObjects((objs) =>
      objs.map((obj, i) => (i === idx ? { ...obj, scale: value } : obj))
    );
  }

  function handlePointerDown(idx: number) {
    setDragged(idx);
  }
  function handlePointerUp() {
    setDragged(null);
  }
  function handlePointerMove(e: { point: { toArray: () => number[] } }, idx: number) {
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

  // STL-eksport
  async function exportSTL() {
    const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
    const THREE = await import('three');
    const exporter = new STLExporter();
    const scene = new THREE.Scene();
    objects.forEach((obj) => {
      let mesh;
      if (obj.type === "box") {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(obj.scale, obj.scale, obj.scale),
          new THREE.MeshStandardMaterial({ color: obj.color })
        );
      } else if (obj.type === "sphere") {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.7 * obj.scale, 32, 32),
          new THREE.MeshStandardMaterial({ color: obj.color })
        );
      } else if (obj.type === "cylinder") {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5 * obj.scale, 0.5 * obj.scale, 1.5 * obj.scale, 32),
          new THREE.MeshStandardMaterial({ color: obj.color })
        );
      }
      if (mesh) {
        mesh.position.set(...obj.position);
        scene.add(mesh);
      }
    });
    const stl = exporter.parse(scene);
    const blob = new Blob([stl], { type: 'application/sla' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.stl';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => addObject("box")}>Legg til kube</button>
        <button onClick={() => addObject("sphere")}>Legg til sfære</button>
        <button onClick={() => addObject("cylinder")}>Legg til sylinder</button>
        <button onClick={exportSTL}>Eksporter STL</button>
        <button onClick={syncToScriptEditor} style={{ marginLeft: 16 }}>Synkroniser til script-editor</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        {objects.map((obj, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <span>{obj.type} #{i + 1} størrelse:</span>
            <Slider
              value={obj.scale}
              min={0.2}
              max={3}
              step={0.01}
              onChange={(_, value) => handleScaleChange(i, value as number)}
              style={{ width: 120, display: 'inline-block', marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>{obj.scale.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight />
        <OrbitControls />
        {/* Grid i bakgrunnen */}
        <Grid infiniteGrid={true} sectionColor="#CCCCCC" />
        {objects.map((obj, i) => {
          const commonProps = {
            position: obj.position as [number, number, number],
            scale: [obj.scale, obj.scale, obj.scale] as [number, number, number],
            onPointerDown: () => handlePointerDown(i),
            onPointerUp: handlePointerUp,
            onPointerMove: (e: { point: { toArray: () => number[] } }) => handlePointerMove(e, i),
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
