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

/**
 * Create cube mesh
 */
function createMeshes() {
  // geometry
  let geometry = new THREE.Geometry();

  for (let count = 0; count < 10; count++) {
    let geo = new THREE.BoxGeometry(5, 5, 5);
    geo.translate(THREE.Math.randFloat(-5, 5), THREE.Math.randFloat(-5, 5), THREE.Math.randFloat(-5, 5));
    let color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
    for (let i = 0; i < geo.faces.length; i++) {
      let face = geo.faces[i];
      face.vertexColors.push(color, color, color); // all the same in this case
      //face.color.set( color ); // this works, too; use one or the other
    }
    geometry.merge(geo);
  }

  // material
  let material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    vertexColors: THREE.VertexColors // or THREE.FaceColors, if defined
  });

  let mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);
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
