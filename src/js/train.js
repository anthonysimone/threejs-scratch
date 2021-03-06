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

/**
 * Init our app
 */
function init() {
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

  camera.position.set(-5, 5, 7);
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

/**
 * Create materials
 */
function createMaterials() {
  const body = new THREE.MeshStandardMaterial({
    color: 0xff3333, // red
    flatShading: true
  });

  // put colors into linear color space
  body.color.convertSRGBToLinear();

  const detail = new THREE.MeshStandardMaterial({
    color: 0x333333, // darkgray
    flatShading: true
  });

  detail.color.convertSRGBToLinear();

  return {
    body,
    detail
  };
}

/**
 * Create geometries
 */
function createGeometries() {
  const nose = new THREE.CylinderBufferGeometry(0.75, 0.75, 3, 12);

  const cabin = new THREE.BoxBufferGeometry(2, 2.25, 1.5);

  const chimney = new THREE.CylinderBufferGeometry(0.3, 0.1, 0.5);

  const wheel = new THREE.CylinderBufferGeometry(0.4, 0.4, 1.75, 16);
  wheel.rotateX(Math.PI / 2);

  return {
    nose,
    cabin,
    chimney,
    wheel
  };
}

/**
 * Create cube mesh
 */
function createMeshes() {
  // create the train group that will hold all train pieces
  const train = new THREE.Group();
  scene.add(train);

  const materials = createMaterials();
  const geometries = createGeometries();

  const nose = new THREE.Mesh(geometries.nose, materials.body);
  nose.rotation.z = Math.PI / 2;
  nose.position.x = -1;

  const cabin = new THREE.Mesh(geometries.cabin, materials.body);
  cabin.position.set(1.5, 0.4, 0);

  const chimney = new THREE.Mesh(geometries.chimney, materials.detail);
  chimney.position.set(-2, 0.9, 0);

  const smallWheelRear = new THREE.Mesh(geometries.wheel, materials.detail);
  smallWheelRear.position.set(0, -0.5, 0);

  const smallWheelCenter = smallWheelRear.clone();
  smallWheelCenter.position.x = -1;

  const smallWheelFront = smallWheelRear.clone();
  smallWheelFront.position.x = -2;

  const bigWheel = smallWheelRear.clone();
  bigWheel.scale.set(2, 2, 1.25);
  bigWheel.position.set(1.5, -0.1, 0);

  train.add(
    nose,
    cabin,
    chimney,

    smallWheelRear,
    smallWheelCenter,
    smallWheelFront,
    bigWheel
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
