import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const components = { 5121: [1, 'readUInt8', 255], 5123: [2, 'readUInt16LE', 65535],
  5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', 1] };
function glb(name) {
  const file = readFileSync(new URL(`../public/assets/models/${name}.glb`, import.meta.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(8), file.length);
  const length = file.readUInt32LE(12);
  const doc = JSON.parse(file.subarray(20, 20 + length));
  const binary = file.subarray(28 + length);
  function read(index) {
    const a = doc.accessors[index], view = doc.bufferViews[a.bufferView];
    const [bytes, method, factor] = components[a.componentType];
    const width = widths[a.type], stride = view.byteStride ?? width * bytes;
    const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
    return Array.from({ length: a.count }, (_, vertex) => Array.from({ length: width }, (_, c) =>
      binary[method](offset + vertex * stride + c * bytes) / (a.normalized ? factor : 1)));
  }
  return { doc, read, bytes: file.length };
}

for (const name of ['nyanluna', 'tsukineko', 'omsolo']) {
  test(`${name}: portable skin, geometry, colours and bounds are valid`, () => {
    const { doc, read, bytes } = glb(name);
    assert.equal(doc.meshes.length, 1);
    assert.equal(doc.meshes[0].primitives.length, 1);
    assert.equal(doc.materials.length, 1);
    assert.equal(doc.skins.length, 1);
    assert.ok(bytes < 12 * 1048576, '12 MiB per-character transfer budget');
    assert.equal(doc.images?.length ?? 0, 0, 'Appearance is self contained in vertex colours');
    const primitive = doc.meshes[0].primitives[0];
    const pos = read(primitive.attributes.POSITION);
    const normals = read(primitive.attributes.NORMAL);
    const colors = read(primitive.attributes.COLOR_0);
    const joints = read(primitive.attributes.JOINTS_0);
    const weights = read(primitive.attributes.WEIGHTS_0);
    const indices = read(primitive.indices);
    assert.ok(indices.length / 3 < 180000, '180k triangle budget');
    for (const [index] of indices) assert.ok(index >= 0 && index < pos.length);
    let colorful = 0;
    for (let i = 0; i < pos.length; i++) {
      assert.ok(pos[i].every(Number.isFinite));
      assert.ok(normals[i].every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...normals[i]) - 1) < .025);
      assert.ok(weights[i].every(v => Number.isFinite(v) && v >= 0 && v <= 1));
      assert.ok(Math.abs(weights[i].reduce((a, b) => a + b, 0) - 1) < .0001);
      assert.ok(joints[i].every(j => j >= 0 && j < doc.skins[0].joints.length));
      assert.ok(colors[i].every(v => Number.isFinite(v) && v >= 0 && v <= 1));
      colorful += Number(Math.max(...colors[i].slice(0, 3)) - Math.min(...colors[i].slice(0, 3)) > .04);
    }
    assert.ok(colorful > pos.length * .2, 'Baked materials contain the supplied character colours');
    const names = doc.nodes.map(n => n.name);
    for (const joint of ['head', 'upper_arm.L', 'upper_arm.R', 'thigh.L', 'thigh.R', 'hand.R']) assert.ok(names.includes(joint));
    for (const row of read(doc.skins[0].inverseBindMatrices)) assert.ok(row.every(Number.isFinite));
    const report = JSON.parse(readFileSync(new URL(`./fixtures/${name}-export.json`, import.meta.url)));
    assert.equal(report.unweighted_vertices, 0);
    assert.ok(report.meshes.every(m => !/FACE_FX_|SmoothLid|DANCE_GROUND/.test(m.source_mesh)));
  });
}
