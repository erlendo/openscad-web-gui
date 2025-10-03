// Enkel parser for OpenSCAD scene til bruk i 3D-editoren
// Støtter cube, sphere, cylinder med standard parametre

export type ParsedObject = {
  type: 'box' | 'sphere' | 'cylinder';
  scale: number;
  position: [number, number, number];
};

const cubeRegex = /cube\s*\(\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]\s*\)/g;
const sphereRegex = /sphere\s*\(\s*r\s*=\s*([\d.]+)\s*\)/g;
const cylinderRegex = /cylinder\s*\(\s*r\s*=\s*([\d.]+),\s*h\s*=\s*([\d.]+)\s*\)/g;

export function parseOpenSCADScene(code: string): ParsedObject[] {
  const objects: ParsedObject[] = [];

  let match;
  while ((match = cubeRegex.exec(code))) {
    const scale = parseFloat(match[1]);
    objects.push({ type: 'box', scale, position: [0, 0, 0] });
  }
  while ((match = sphereRegex.exec(code))) {
    const scale = parseFloat(match[1]) / 0.7;
    objects.push({ type: 'sphere', scale, position: [0, 0, 0] });
  }
  while ((match = cylinderRegex.exec(code))) {
    const scale = parseFloat(match[1]) / 0.5;
    objects.push({ type: 'cylinder', scale, position: [0, 0, 0] });
  }
  return objects;
}
