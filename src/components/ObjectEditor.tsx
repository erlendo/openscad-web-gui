// Ryddet: kun én versjon av ObjectEditor, type-definisjoner og imports

import React, { useState } from "react";
import { parseOpenSCADScene, ParsedObject } from '../lib/parseOpenSCADScene';
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
  const [unit, setUnit] = useState<'mm' | 'cm' | 'm'>('mm');
  const [wallThickness, setWallThickness] = useState<number>(0.2);
  const [resolution, setResolution] = useState<number>(32);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { code, setCode } = useWorkspaceProvider();

  // Skala-faktor basert på valgt enhet
  function getUnitFactor() {
    if (unit === 'mm') return 1;
    if (unit === 'cm') return 10;
    if (unit === 'm') return 1000;
    return 1;
  }

  // Generer OpenSCAD-kode fra scene-objekter
  function generateOpenSCAD(objects: SceneObject[]): string {
    const factor = getUnitFactor();
    return objects.map(obj => {
      if (obj.type === "box") {
        return `difference() {
  cube([${(obj.scale * factor).toFixed(2)}, ${(obj.scale * factor).toFixed(2)}, ${(obj.scale * factor).toFixed(2)}]);
  translate([${wallThickness * factor}, ${wallThickness * factor}, ${wallThickness * factor}])
    cube([${((obj.scale - wallThickness * 2) * factor).toFixed(2)}, ${((obj.scale - wallThickness * 2) * factor).toFixed(2)}, ${((obj.scale - wallThickness * 2) * factor).toFixed(2)}]);
}`;
      }
      if (obj.type === "sphere") {
        return `difference() {
  sphere(r=${(0.7 * obj.scale * factor).toFixed(2)}, $fn=${resolution});
  sphere(r=${(0.7 * obj.scale * factor - wallThickness * factor).toFixed(2)}, $fn=${resolution});
}`;
      }
      if (obj.type === "cylinder") {
        return `difference() {
  cylinder(r=${(0.5 * obj.scale * factor).toFixed(2)}, h=${(1.5 * obj.scale * factor).toFixed(2)}, $fn=${resolution});
  cylinder(r=${(0.5 * obj.scale * factor - wallThickness * factor).toFixed(2)}, h=${(1.5 * obj.scale * factor).toFixed(2)}, $fn=${resolution});
}`;
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
        position: [0, 0, 0], // Start alltid i origo
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

  function handleSelect(idx: number) {
    setSelectedIndex(idx);
  }
  function handleSelectedScaleChange(value: number) {
    if (selectedIndex !== null) {
      setObjects((objs) =>
        objs.map((obj, i) => (i === selectedIndex ? { ...obj, scale: value } : obj))
      );
    }
  }
  function handleSelectedPositionChange(axis: 'x' | 'y' | 'z', value: number) {
    if (selectedIndex !== null) {
      setObjects((objs) =>
        objs.map((obj, i) =>
          i === selectedIndex
            ? { ...obj, position: obj.position.map((v, idx) => idx === (axis === 'x' ? 0 : axis === 'y' ? 1 : 2) ? value : v) as [number, number, number] }
            : obj
        )
      );
    }
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
    const factor = getUnitFactor();
    objects.forEach((obj) => {
      let mesh;
      if (obj.type === "box") {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(obj.scale * factor, obj.scale * factor, obj.scale * factor),
          new THREE.MeshStandardMaterial({ color: obj.color })
        );
      } else if (obj.type === "sphere") {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.7 * obj.scale * factor, 32, 32),
          new THREE.MeshStandardMaterial({ color: obj.color })
        );
      } else if (obj.type === "cylinder") {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5 * obj.scale * factor, 0.5 * obj.scale * factor, 1.5 * obj.scale * factor, 32),
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

  // Sync fra script-editor til 3D-editor
  React.useEffect(() => {
    if (code) {
      const parsed = parseOpenSCADScene(code);
      if (parsed.length) {
        setObjects(parsed.map(obj => ({
          type: obj.type,
          scale: obj.scale,
          position: obj.position,
          color: defaultColors[obj.type],
        })));
      }
    }
  }, [code]);

  return (
    <div style={{ width: "100%", height: 400 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 8 }}>Enhet:</label>
        <select value={unit} onChange={e => setUnit(e.target.value as 'mm' | 'cm' | 'm')}>
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="m">m</option>
        </select>
        <label style={{ marginLeft: 16, marginRight: 8 }}>Veggtykkelse:</label>
        <input type="number" min={0.01} step={0.01} value={wallThickness} onChange={e => setWallThickness(Number(e.target.value))} style={{ width: 60 }} />
        <span style={{ marginLeft: 4 }}>{unit}</span>
        <label style={{ marginLeft: 16, marginRight: 8 }}>Oppløsning:</label>
        <input type="number" min={4} max={128} step={1} value={resolution} onChange={e => setResolution(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={() => addObject("box")}>Legg til kube</button>
        <button onClick={() => addObject("sphere")}>Legg til sfære</button>
        <button onClick={() => addObject("cylinder")}>Legg til sylinder</button>
        <button onClick={exportSTL}>Eksporter STL</button>
        <button onClick={syncToScriptEditor} style={{ marginLeft: 16 }}>Synkroniser til script-editor</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        {objects.map((obj, i) => (
          <div key={i} style={{ marginBottom: 4, background: selectedIndex === i ? '#e0f7fa' : undefined }}>
            <span>{obj.type} #{i + 1} størrelse ({unit}):</span>
            <Slider
              value={obj.scale}
              min={0.2}
              max={3}
              step={0.01}
              onChange={(_, value) => handleScaleChange(i, value as number)}
              style={{ width: 120, display: 'inline-block', marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>{(obj.scale * getUnitFactor()).toFixed(2)} {unit}</span>
            <button style={{ marginLeft: 8 }} onClick={() => handleSelect(i)}>{selectedIndex === i ? 'Valgt' : 'Velg'}</button>
          </div>
        ))}
      </div>
      {selectedIndex !== null && (
        <div style={{ marginBottom: 8, padding: 8, background: '#f1f8e9', borderRadius: 4 }}>
          <b>Juster valgt objekt:</b>
          <div style={{ marginTop: 4 }}>
            <label>Størrelse:</label>
            <input type="number" min={0.2} max={3} step={0.01} value={objects[selectedIndex].scale} onChange={e => handleSelectedScaleChange(Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
          </div>
          <div style={{ marginTop: 4 }}>
            <label>Posisjon X:</label>
            <input type="number" step={0.01} value={objects[selectedIndex].position[0]} onChange={e => handleSelectedPositionChange('x', Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
            <label style={{ marginLeft: 8 }}>Y:</label>
            <input type="number" step={0.01} value={objects[selectedIndex].position[1]} onChange={e => handleSelectedPositionChange('y', Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
            <label style={{ marginLeft: 8 }}>Z:</label>
            <input type="number" step={0.01} value={objects[selectedIndex].position[2]} onChange={e => handleSelectedPositionChange('z', Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
          </div>
        </div>
      )}
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
          const materialProps = { color: obj.color, opacity: 0.5, transparent: true };
          if (obj.type === "box")
            return (
              <Box key={i} args={[1, 1, 1]} {...commonProps}>
                <meshStandardMaterial {...materialProps} />
              </Box>
            );
          if (obj.type === "sphere")
            return (
              <Sphere key={i} args={[0.7, 32, 32]} {...commonProps}>
                <meshStandardMaterial {...materialProps} />
              </Sphere>
            );
          if (obj.type === "cylinder")
            return (
              <Cylinder key={i} args={[0.5, 0.5, 1.5, 32]} {...commonProps}>
                <meshStandardMaterial {...materialProps} />
              </Cylinder>
            );
          return null;
        })}
      </Canvas>
    </div>
  );
}
