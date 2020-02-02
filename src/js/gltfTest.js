import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import {
  BufferGeometryUtils
} from 'three/examples/jsm/utils/BufferGeometryUtils'
import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'stats.js';

import '../css/index.css';

const bwUvMap = require('../textures/uv_test_bw.png');

// declare global vars
let container;
let camera;
let controls;
let renderer;
let scene;
let mesh;
let stats;

/**
 * Init our app
 */
function init() {
  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me

  container = document.querySelector('#scene-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fbcd4);

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

  camera.position.set(-20, 20, 20);
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
  const ambientLight = new THREE.HemisphereLight(
    0xddeeff, // bright sky color
    0x202020, // dim ground color
    5 // intensity
  );

  // Add directional light, position, add to scene
  const mainLight = new THREE.DirectionalLight(0xffffff, 5.0);
  mainLight.position.set(10, 10, 10);

  scene.add(ambientLight, mainLight);
}

let loader = new GLTFLoader();

// the loader will report the loading progress to this function
const onProgress = () => {};

// the loader will send any error messages to this function, and we'll log
// them to to console
const onError = errorMessage => {
  console.log(errorMessage);
};

// Reusable onLoad function
const onLoad = (gltf, position, scale) => {
  // Createt a group and add our default model to the scene
  let modelGroup = new THREE.Group();
  modelGroup.position.copy(position);

  const model = gltf.scene.children[0];
  // modelGroup.add(model);

  scene.add(modelGroup);

  // Create a static version of the model
  // Merge the buffer geometries with vertex colors to one mesh
  let geometries = [];
  let materials = [];
  let colorBufferAttrs = [];

  model.traverse(child => {
    if (child.isMesh) {
      geometries.push(child.geometry)
      materials.push(child.material)
    }
  });

  for (let count = 0; count < geometries.length; count++) {
    let geo = geometries[count];
    let mat = materials[count];
    // let color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5)
    // for (let i = 0; i < geo.faces.length; i++) {
    //   let face = geo.faces[i]
    //   face.vertexColors.push(color, color, color) // all the same in this case
    //   //face.color.set( color ); // this works, too; use one or the other
    // }
    let colorsArray = [];
    let rand1 = Math.random();
    let rand2 = Math.random();
    let rand3 = Math.random();
    for (let i = 0; i < geo.attributes.position.count; i++) {
      colorsArray.push(rand1, rand2, rand3);
    }
    let colorsTypedArray = new Float32Array(colorsArray);
    let colorBufferAttr = new THREE.BufferAttribute(colorsTypedArray, 3);
    console.log('colorBufferAtt', colorBufferAttr);
    colorBufferAttrs.push(colorBufferAttr);
    geo.addAttribute('color', colorBufferAttr);
  }

  console.log('geometries', geometries);
  let geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  let vertexColormaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    vertexColors: THREE.VertexColors // or THREE.FaceColors, if defined
  });
  let mesh = new THREE.Mesh(geometry, vertexColormaterial);

  if (scale) {
    mesh.scale.set(scale.x, scale.y, scale.x)
  }

  mesh.position.z = 4;
  modelGroup.add(mesh);
};

/**
 * Create cube mesh
 */
function createMeshes() {
  const floorPosition = new THREE.Vector3(0, 0, 0);
  const floorScale = new THREE.Vector3(100, 100, 100);
  loader.load(
    '/models/Floor_Modular.glb',
    gltf => onLoad(gltf, floorPosition, floorScale),
    onProgress,
    onError
  );

  addBat(new THREE.Vector3(3, 0, 0));
  addBat(new THREE.Vector3(6, 0, 0));
  addBat(new THREE.Vector3(8, 0, 0));
  addBat(new THREE.Vector3(10, 0, 0));
  addBat(new THREE.Vector3(12, 0, 0));
  addBat(new THREE.Vector3(14, 0, 0));
  addBat(new THREE.Vector3(16, 0, 0));
  addBat(new THREE.Vector3(18, 0, 0));
  addBat(new THREE.Vector3(20, 0, 0));
  addBat(new THREE.Vector3(22, 0, 0));
  addBat(new THREE.Vector3(24, 0, 0));
  addBat(new THREE.Vector3(26, 0, 0));
  addBat(new THREE.Vector3(28, 0, 0));

  addBat(new THREE.Vector3(3, 5, 0));
  addBat(new THREE.Vector3(6, 5, 0));
  addBat(new THREE.Vector3(8, 5, 0));
  addBat(new THREE.Vector3(10, 5, 0));
  addBat(new THREE.Vector3(12, 5, 0));
  addBat(new THREE.Vector3(14, 5, 0));
  addBat(new THREE.Vector3(16, 5, 0));
  addBat(new THREE.Vector3(18, 5, 0));
  addBat(new THREE.Vector3(20, 5, 0));
  addBat(new THREE.Vector3(22, 5, 0));
  addBat(new THREE.Vector3(24, 5, 0));
  addBat(new THREE.Vector3(26, 5, 0));
  addBat(new THREE.Vector3(28, 5, 0));

  const dragonPosition = new THREE.Vector3(6, 0, 0);
  const dragonScale = new THREE.Vector3(100, 100, 100);
  loader.load(
    '/models/Dragon.glb',
    gltf => onLoad(gltf, dragonPosition, dragonScale),
    onProgress,
    onError
  );
}

/**
 * Shortcut to add a batt
 */
function addBat(position) {
  const batScale = new THREE.Vector3(100, 100, 100);
  loader.load(
    '/models/Bat.glb',
    gltf => onLoad(gltf, position, batScale),
    onProgress,
    onError
  );
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
function update() {}

/**
 * Render the app
 */
function render() {
  // Render the SCENE!!
  renderer.render(scene, camera);
  stats.update();
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
