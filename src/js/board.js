import * as THREE from 'three';
import * as TWEEN from 'es6-tween';
import OrbitControls from 'orbit-controls-es6';
import {
  MapControls
} from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';

import {
  tweenActiveTileToggle
} from './board/tweens';

import '../css/index.css';

const bwUvMap = require('../textures/uv_test_bw.png');
const checkerMap = require('../textures/checkerboard.jpg');

// declare global vars
let container;
let camera;
let controls;
let renderer;
let scene;
let mesh;
let instancedMesh;
const tilesNumber = 30;
const checkerboardSize = tilesNumber % 4 === 0 ? tilesNumber : tilesNumber + 4 - (tilesNumber % 4);
let instancedMeshes = {
  first: {},
  second: {},
  third: {},
  fourth: {},
  fifth: {},
  sixth: {},
  seventh: {},
  eighth: {},
  ninth: {},
  tenth: {},
};
let numberOfInstancedMeshes = Object.keys(instancedMeshes).length;
let stats;
let backgroundColor = new THREE.Color(0x8fbcd4);

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let transform = new THREE.Object3D();
let instanceMatrix = new THREE.Matrix4();
let tweenMatrix = new THREE.Matrix4();
let selectionMatrix = new THREE.Matrix4().makeTranslation(0, 0, 1);
let unselectionMatrix = new THREE.Matrix4().makeTranslation(0, 0, -1);
let matrix = new THREE.Matrix4();
let selectedTile = null;

function getInstancedMeshKeyByIndex(index) {
  return Object.keys(instancedMeshes)[index];
}

/**
 * Init our app
 */
function init() {
  stats = new Stats(); // <-- remove me
  document.body.appendChild(stats.dom); // <-- remove me

  container = document.querySelector('#scene-container');

  scene = new THREE.Scene();
  scene.background = backgroundColor;

  // add fog
  // scene.fog = new THREE.Fog(backgroundColor, 30, 40);

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
  const fov = 70; // Field of view
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.1; // the near clipping plane
  const far = 60; // the far clipping plane

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(0, 20, 0);
}

/**
 * Create the camera controls
 */
function createControls() {
  // Map Controls
  controls = new MapControls(camera, container);
  //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
  controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 5;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI / 2.2;
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
  // tile material
  const tile = new THREE.MeshStandardMaterial({
    color: 0xff3333, // red
    flatShading: true
  });
  tile.color.convertSRGBToLinear();

  const tiles = [];
  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    let tileColor = new THREE.MeshStandardMaterial({
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      flatShading: true
    });
    tiles.push();
  }

  // checker material
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(checkerMap);
  texture.repeat.set(checkerboardSize / 4, checkerboardSize / 4);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 16;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;

  const board = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  return {
    tile,
    tiles,
    board
  };
}

/**
 * Create geometries
 */
function createGeometries() {
  const tile = new THREE.BoxBufferGeometry(1, 1, 0.25);
  const tiles = [];
  const flatTile = new THREE.PlaneBufferGeometry(1, 1);
  const board = new THREE.PlaneBufferGeometry(checkerboardSize, checkerboardSize);

  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    tiles.push(new THREE.BoxBufferGeometry(1, 1, 0.25));
  }

  return {
    tile,
    tiles,
    flatTile,
    board
  };
}

/**
 * Create cube mesh
 */
function createMeshes() {
  // create the train group that will hold all train pieces
  const board = new THREE.Group();
  board.rotation.x = Math.PI * -0.5;

  scene.add(board);

  const materials = createMaterials();
  const geometries = createGeometries();

  // Add checkerboard
  const checkerboard = new THREE.Mesh(geometries.board, materials.board);
  board.add(checkerboard);

  /** Create Tiles Instanced - Start */
  let count = tilesNumber * tilesNumber;
  instancedMesh = new THREE.InstancedMesh(geometries.tile, materials.tiles[0], count);

  // Create all instanced meshes
  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    let key = getInstancedMeshKeyByIndex(i);
    instancedMeshes[key] = {
      mesh: new THREE.InstancedMesh(geometries.tiles[i], materials.tiles[i], count),
      count: 0
    };
    instancedMeshes[key].mesh.count = 0;
    instancedMeshes[key].mesh.frustumCulled = false;
    instancedMeshes[key].mesh.name = key;
    instancedMeshes[key].mesh.itemType = 'tile';
  }

  // Populate all the instance meshes randomly
  let offset = (tilesNumber - 1) / 2;
  let instancedKeys = Object.keys(instancedMeshes);

  for (let x = 0; x < tilesNumber; x++) {
    for (let y = 0; y < tilesNumber; y++) {
      // set transform based on position
      transform.position.set(offset - x, offset - y, 0.126);
      transform.updateMatrix();

      // Choose the instanced mesh to add to
      let inst = Math.floor(Math.random() * numberOfInstancedMeshes);
      let key = instancedKeys[inst];
      let i = instancedMeshes[key].count;

      // Set this index's position
      instancedMeshes[key].mesh.setMatrixAt(i, transform.matrix);

      // Increment our counter and the instanced mesh counter
      instancedMeshes[key].mesh.count++;
      instancedMeshes[key].count++;
    }
  }

  // Add all instancedMeshes to the scene
  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    let key = getInstancedMeshKeyByIndex(i);
    board.add(instancedMeshes[key].mesh);
  }
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
  TWEEN.update();
}

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

/**
 * mousemove helper
 */
function onMouseClick(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  let intersects = raycaster.intersectObjects(scene.children, true);

  // Flag all intersections
  if (intersects.length && intersects[0].object.itemType === 'tile') {
    let name = intersects[0].object.name;
    let instanceId = intersects[0].instanceId;
    let instanceKey = instanceId.toString();
    selectedTile = `${name}-${instanceId}`;

    // instancedMeshes[name].mesh.getMatrixAt(instanceId, instanceMatrix);
    // matrix.multiplyMatrices(instanceMatrix, selectionMatrix);
    // instancedMeshes[name].mesh.setMatrixAt(instanceId, matrix);
    // instancedMeshes[name].mesh.instanceMatrix.needsUpdate = true;
    let instanceUserData = instancedMeshes[name].mesh.userData[instanceKey];
    if (instanceUserData && instanceUserData.isAnimating) {
      return;
    }
    if (!instanceUserData || (instanceUserData && !instanceUserData.isActive)) {
      tweenActiveTileToggle(instancedMeshes[name].mesh, instanceId, true);
    } else {
      tweenActiveTileToggle(instancedMeshes[name].mesh, instanceId, false);
    }
  }
}
window.addEventListener('click', onMouseClick);


// Set everything up
init();
