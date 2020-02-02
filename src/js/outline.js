import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';

import {
  EffectComposer
} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {
  RenderPass
} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {
  OutlinePass
} from 'three/examples/jsm/postprocessing/OutlinePass.js';
import Stats from 'stats.js';

import '../css/index.css';

const bwUvMap = require('../textures/uv_test_bw.png');

// declare global vars
let stats;
let container;
let camera;
let controls;
let renderer;
let composer;
let outlinePass;
let scene;
let mesh;
let selectedObjects = [];
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
const checkerMap = require('../textures/checkerboard.jpg');

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
  createEffectsComposer();

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
  // make a board
  let boardSize = 40;
  const boardGeo = new THREE.PlaneBufferGeometry(boardSize, boardSize);

  const textureLoader = new THREE.TextureLoader();
  const boardTexture = textureLoader.load(checkerMap);
  boardTexture.repeat.set(boardSize / 4, boardSize / 4);
  boardTexture.encoding = THREE.sRGBEncoding;
  boardTexture.anisotropy = 16;
  boardTexture.wrapS = THREE.RepeatWrapping;
  boardTexture.wrapT = THREE.RepeatWrapping;
  boardTexture.magFilter = THREE.NearestFilter;

  const boardMaterial = new THREE.MeshStandardMaterial({
    map: boardTexture,
    side: THREE.DoubleSide
  });

  const board = new THREE.Mesh(boardGeo, boardMaterial);
  board.rotation.x = Math.PI * -0.5;
  board.position.y = -0.01;
  board.name = 'board';
  scene.add(board);

  // Add some objects
  let material = new THREE.MeshNormalMaterial();

  let sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 16);
  let sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.set(-6, 5, 0);
  scene.add(sphere);

  let cubeGeometry = new THREE.BoxBufferGeometry(4, 4, 4);
  let cube = new THREE.Mesh(cubeGeometry, material);
  cube.position.set(7, 2, 0);
  scene.add(cube);

  let cube2 = new THREE.Mesh(cubeGeometry, material);
  cube2.position.set(11, 2, 0);
  scene.add(cube2);

  let cube3 = new THREE.Mesh(cubeGeometry, material);
  cube3.position.set(3, 2, 0);
  scene.add(cube3);

  let instanceCubeGeo = new THREE.BoxBufferGeometry(4, 4, 4);
  let instanceCubeMat = new THREE.MeshNormalMaterial();
  let instancedCubes = new THREE.InstancedMesh(instanceCubeGeo, instanceCubeMat, 4);
  scene.add(instancedCubes);
  instancedCubes.position.set(0, 2, 6);
  instancedCubes.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0, 0));
  instancedCubes.setMatrixAt(1, new THREE.Matrix4().makeTranslation(4, 0, 0));
  instancedCubes.setMatrixAt(2, new THREE.Matrix4().makeTranslation(0, 0, 4));
  instancedCubes.setMatrixAt(3, new THREE.Matrix4().makeTranslation(4, 0, 4));
  instancedCubes.instanceMatrix.needsUpdate = true;
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
 * Create effects composer
 */
function createEffectsComposer() {
  composer = new EffectComposer(renderer);

  let renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
  // settings
  outlinePass.edgeStrength = 3.0;
  outlinePass.edgeGlow = 0.0;
  outlinePass.edgeThickness = 1.0;
  outlinePass.pulsePeriod = 0;
  outlinePass.rotate = false;
  outlinePass.usePatternTexture = false;
  outlinePass.visibleEdgeColor.set('#ffffff');
  outlinePass.hiddenEdgeColor.set('#190a05');
  composer.addPass(outlinePass);
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
  composer.render();
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
  composer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * handle outlining on interaction
 */
function onTouchMove(event) {
  let x, y;

  if (event.changedTouches) {
    x = event.changedTouches[0].pageX;
    y = event.changedTouches[0].pageY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;

  checkIntersection();
}

/**
 * Add selected object to the outline pass
 */
function addSelectedObject(object) {
  selectedObjects = [];
  selectedObjects.push(object);
}

/**
 * Handle raycasting for outline pass
 */
function checkIntersection() {
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects([scene], true);

  if (intersects.length > 0 && intersects[0].object.name !== 'board') {
    console.log('intersects', intersects);
    let selectedObject = intersects[0].object;
    addSelectedObject(selectedObject);
    outlinePass.selectedObjects = selectedObjects;
  } else {
    outlinePass.selectedObjects = [];
  }
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('mousemove', onTouchMove);
window.addEventListener('touchmove', onTouchMove);

// Set everything up
init();
