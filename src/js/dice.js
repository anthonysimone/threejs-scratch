import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';

import '../css/index.css';

const bwUvMap = require('../textures/uv_test_bw.png');

// declare global vars
let container;
let camera;
let controls;
let renderer;
let scene;
let mesh;
let group = new THREE.Group;

const up = new THREE.Vector3(0, 1, 0);
const meshes = [];

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();

const material = new THREE.MeshStandardMaterial({
  roughness: .4,
  metalness: .2,
  color: 0xffd320,
  wireframe: !true,
}); //  side: THREE.DoubleSide });
const rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const m = new THREE.Matrix4();

const r = .04;

let currentGeometries = [];

// helpers
function meshOpen(x0, y0, z0) {
  currentGeometries = [];
}

function cylinder(x1, y1, z1, x2, y2, z2) {
  a.set(x1, y1, z1);
  b.set(x2, y2, z2);
  const d = a.distanceTo(b);
  const g = new THREE.BufferGeometry().fromGeometry(new THREE.CylinderGeometry(r, r, d, 36, 1, true));
  g.applyMatrix(rot);
  m.identity().lookAt(a, b, up);
  g.applyMatrix(m);
  c.copy(b).sub(a).multiplyScalar(.5).add(a);
  m.identity().makeTranslation(c.x, c.y, c.z);
  g.applyMatrix(m);
  currentGeometries.push(g);
}

function meshClose(x0, y0, z0) {
  const count = currentGeometries.reduce((ac, v) => {
    return ac + v.attributes.position.count;
  }, 0);
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  let offset = 0;
  currentGeometries.forEach((g) => {
    geometry.merge(g, offset);
    offset += g.attributes.position.count;
  });
  m.identity().makeTranslation(x0, y0, z0);
  geometry.applyMatrix(m);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function node(x, y, z) {
  const g = new THREE.BufferGeometry().fromGeometry(new THREE.IcosahedronGeometry(r, 2));
  m.identity().makeTranslation(x, y, z);
  g.applyMatrix(m);
  currentGeometries.push(g);
}

function triangle(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  const g = new THREE.BufferGeometry();
  a.set(x1, y1, z1);
  b.set(x2, y2, z2);
  c.set(x3, y3, z3);
  const u = b.clone().sub(a);
  const v = c.clone().sub(a);
  const n = u.cross(v).normalize();
  const normalData = Float32Array.from([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z]);
  const data = Float32Array.from([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
  g.addAttribute('position', new THREE.BufferAttribute(data, 3));
  g.addAttribute('normal', new THREE.BufferAttribute(normalData, 3));
  currentGeometries.push(g);
}

function plane(coords) {
  c.set(0, 0, 0);
  for (let i = 0; i < coords.length; i += 3) {
    c.x += coords[i];
    c.y += coords[i + 1];
    c.z += coords[i + 2];
  }
  c.multiplyScalar(1 / (coords.length / 3));
  const d = c.clone().normalize().multiplyScalar(r);
  //d.set(0, 0, 0);
  c.add(d);
  //node(c.x, c.y, c.z);

  for (let i = 0; i < coords.length; i += 3) {
    a.x = coords[i] + d.x;
    a.y = coords[i + 1] + d.y;
    a.z = coords[i + 2] + d.z;
    b.x = coords[(i + 3) % coords.length] + d.x;
    b.y = coords[(i + 4) % coords.length] + d.y;
    b.z = coords[(i + 5) % coords.length] + d.z;
    triangle(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
}

/**
 * Init our app
 */
function init() {
  container = document.querySelector('#scene-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.add(group);

  createCamera();
  createControls();
  createLights();
  createMeshes();
  createRenderer();

  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

/**
 * Create the camera
 */
function createCamera() {
  const fov = 35; // Field of view
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.1; // the near clipping plane
  const far = 100; // the far clipping plane

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(0, 6, 6);
  camera.lookAt(group.position);
}

/**
 * Create the camera controls
 */
function createControls() {
  controls = new OrbitControls(camera, container);
}

/**
 * Create lights
 */
function createLights() {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x808080, .5);
  const light = new THREE.HemisphereLight(
    0x776e88, // bright sky color
    0xffffff, // dim ground color
    0.5 // intensity
  );

  // Add directional light, position, add to scene
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
  mainLight.position.set(-2, 2, 2);
  mainLight.castShadow = true;
  mainLight.shadow.camera.near = .1;
  mainLight.shadow.camera.far = 6;
  mainLight.shadow.bias = 0.0001;
  mainLight.shadow.radius = 1;

  const secondaryLight = new THREE.DirectionalLight(0xffffff, 1);
  secondaryLight.position.set(0, 3, -6);
  secondaryLight.castShadow = true;
  secondaryLight.shadow.camera.near = .1;
  secondaryLight.shadow.camera.far = 5;
  secondaryLight.shadow.bias = 0.0001;
  scene.add(secondaryLight);
  // var helper = new THREE.CameraHelper(secondaryLight.shadow.camera);
  // scene.add(helper);

  scene.add(ambientLight, light, mainLight, secondaryLight);
}

/**
 * Create cube mesh
 */
function createMeshes() {
  // cube
  meshOpen();

  const cubeVertices = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1].map((v) => v - .5);

  function cubeCoords(i) {
    const x = cubeVertices[i * 3];
    const y = cubeVertices[i * 3 + 1];
    const z = cubeVertices[i * 3 + 2];
    return [x, y, z];
  }

  cylinder(...cubeCoords(0), ...cubeCoords(1));
  cylinder(...cubeCoords(1), ...cubeCoords(2));
  cylinder(...cubeCoords(2), ...cubeCoords(3));
  cylinder(...cubeCoords(3), ...cubeCoords(0));

  cylinder(...cubeCoords(4), ...cubeCoords(5));
  cylinder(...cubeCoords(5), ...cubeCoords(6));
  cylinder(...cubeCoords(6), ...cubeCoords(7));
  cylinder(...cubeCoords(7), ...cubeCoords(4));

  cylinder(...cubeCoords(0), ...cubeCoords(4));
  cylinder(...cubeCoords(1), ...cubeCoords(5));
  cylinder(...cubeCoords(2), ...cubeCoords(6));
  cylinder(...cubeCoords(3), ...cubeCoords(7));

  node(...cubeCoords(0));
  node(...cubeCoords(1));
  node(...cubeCoords(2));
  node(...cubeCoords(3));

  node(...cubeCoords(4));
  node(...cubeCoords(5));
  node(...cubeCoords(6));
  node(...cubeCoords(7));

  plane([...cubeCoords(0), ...cubeCoords(1), ...cubeCoords(2), ...cubeCoords(3)]);
  plane([...cubeCoords(7), ...cubeCoords(6), ...cubeCoords(5), ...cubeCoords(4)]);
  plane([...cubeCoords(4), ...cubeCoords(5), ...cubeCoords(1), ...cubeCoords(0)]);
  plane([...cubeCoords(5), ...cubeCoords(6), ...cubeCoords(2), ...cubeCoords(1)]);
  plane([...cubeCoords(6), ...cubeCoords(7), ...cubeCoords(3), ...cubeCoords(2)]);
  plane([...cubeCoords(7), ...cubeCoords(4), ...cubeCoords(0), ...cubeCoords(3)]);

  const cube = meshClose(0, 0, 0);
  cube.position.x = -1.5;
  group.add(cube);
}

/**
 * Create renderer
 */
function createRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);

  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;

  renderer.physicallyCorrectLights = true;

  // Add the canvas element
  container.appendChild(renderer.domElement);
}

/**
 * Perform app updates, this will be called once per frame
 */
function update() {

}

/**
 * Render the app
 */
function render() {
  // Render the SCENE!!
  renderer.render(scene, camera);
}

/**
 * resize canvas helper
 */
function onWindowResize() {
  // set aspect ratio to match the new browser window aspect ratio
  camera.aspect = container.clientWidth / container.clientHeight;

  // update the camera's frustum
  camera.updateProjectionMatrix();

  // update the size of the renderer AND canvas
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize', onWindowResize);

// Set everything up
init();
