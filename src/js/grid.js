import * as THREE from 'three';
import * as TWEEN from 'es6-tween';
import * as Hammer from 'hammerjs';
import OrbitControls from 'orbit-controls-es6';
import {
  MapControls
} from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';

import {
  tweenActiveTileToggle
} from './board/tweens';
import {
  toggleTileActiveState,
  rotateTile
} from './board/event-handlers';
import {
  loadTileTextures
} from './board/loadTextures';

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
let geometries;
let materials;
let selectionHighlighter;
let boardGroup;
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

// rollover
let rollOverGeo, rollOverMaterial, rollOverMesh;
let objects = [];

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let transform = new THREE.Object3D();
let instanceMatrix = new THREE.Matrix4();
let tweenMatrix = new THREE.Matrix4();
let hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
let selectionMatrix = new THREE.Matrix4().makeTranslation(0, 0, 1);
let unselectionMatrix = new THREE.Matrix4().makeTranslation(0, 0, -1);
let rolloverOffsetVector = new THREE.Vector3(0.5, 0.5, 0.5);
let matrix = new THREE.Matrix4();
let selectedTile = null;
let tapTypeState = 'activate';

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

  createGrid();

  materials = createMaterials();
  geometries = createGeometries();

  createMeshes();
  createRenderer();

  renderer.setAnimationLoop((time) => {
    update(time);
    render();
  });
}

/**
 * Create the camera
 */
function createCamera() {
  const fov = 60; // Field of view
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
    0xffffff, // bright sky color
    0x222222, // dim ground color
    1 // intensity
  );

  // Add directional light, position, add to scene
  const mainLight = new THREE.DirectionalLight(0xffffff, 4.0);
  mainLight.position.set(10, 10, 10);

  scene.add(ambientLight, mainLight);
  // scene.add(mainLight);
}

/**
 * Create grid
 */
function createGrid() {
  // Add grid group
  const gridGroup = new THREE.Group();

  // add roller helpers
  rollOverGeo = new THREE.BoxBufferGeometry(1, 1, 0.25);
  rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true
  });
  rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
  // rollOverMesh.rotation.x = Math.PI * -0.5;
  gridGroup.add(rollOverMesh);

  // add grid
  let gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x666666);
  // gridHelper.colorGrid = 0x666666;
  gridGroup.add(gridHelper);

  let planeGeometry = new THREE.PlaneBufferGeometry(100, 100);
  planeGeometry.rotateX(Math.PI * -0.5);
  let plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({
    visible: false
  }));
  gridGroup.add(plane);

  scene.add(gridGroup);

  objects.push(plane);
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

  // Load tile textures and fillers
  const tiles = loadTileTextures();

  for (let i = 0; i < numberOfInstancedMeshes - 5; i++) {
    let tileColor = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      flatShading: true
    });
    tiles.push(tileColor);
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
  const tile = new THREE.BoxBufferGeometry(1, 0.25, 1);
  const flatTile = new THREE.PlaneBufferGeometry(1, 1);
  const board = new THREE.PlaneBufferGeometry(checkerboardSize, checkerboardSize);
  const cone = new THREE.ConeBufferGeometry(0.3, 1, 8);

  const tiles = [];
  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    tiles.push(new THREE.BoxBufferGeometry(1, 0.25, 1));
  }

  return {
    tile,
    tiles,
    flatTile,
    board,
    cone
  };
}

/**
 * Create cube mesh
 */
function createMeshes() {
  // create the train group that will hold all train pieces
  boardGroup = new THREE.Group();

  scene.add(boardGroup);

  // Add checkerboard
  const checkerboard = new THREE.Mesh(geometries.board, materials.board);
  checkerboard.rotation.x = Math.PI * -0.5;
  boardGroup.add(checkerboard);

  /** Create Tiles Instanced - Start */
  let count = tilesNumber * tilesNumber;

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
    for (let z = 0; z < tilesNumber; z++) {
      // set transform based on position
      transform.position.set(offset - x, 0.126, offset - z);
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
    boardGroup.add(instancedMeshes[key].mesh);
  }

  // Create and add the selection mesh
  // const pointersCount = 2;
  // let selectionHighlighter = new THREE.InstancedMesh(geometries.cone, materials.tile, pointersCount);
  selectionHighlighter = new THREE.Mesh(geometries.cone, materials.tile);

  // for (let i = 0; i < pointersCount; i++) {
  //   transform.position.set(0, -2, 0);
  //   transform.rotation.set(Math.PI * 0.7, 2 * Math.PI * (i / pointersCount), 0);
  //   transform.updateMatrix();
  //   selectionHighlighter.setMatrixAt(i, transform.matrix);
  // }

  selectionHighlighter.position.set(0, 0.85, 0);
  selectionHighlighter.rotation.set(Math.PI, 0, 0);
  selectionHighlighter.visible = false;

  boardGroup.add(selectionHighlighter);
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
function update(time) {
  TWEEN.update();

  if (selectionHighlighter.visible) {
    selectionHighlighter.rotateY(0.02);

    selectionHighlighter.position.y = 0.85 + Math.sin(time / 200) * 0.1;
  }
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
 * Reset all tiles
 */
export function resetAllTiles() {
  let instancedMeshNamnes = Object.keys(instancedMeshes);
  instancedMeshNamnes.forEach(name => {
    let instanceKeys = Object.keys(instancedMeshes[name].mesh.userData);
    instanceKeys.forEach(instanceId => {
      if (instancedMeshes[name].mesh.userData[instanceId].isActive) {
        tweenActiveTileToggle(instancedMeshes[name].mesh, instanceId, false);
      }
    })
  });
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

  console.log("click", mouse);


  //   mouse.x = +(event.targetTouches[0].pageX / window.innerWidth) * 2 +-1;

  // mouse.y = -(event.targetTouches[0].pageY / window.innerHeight) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  let intersects = raycaster.intersectObjects(boardGroup.children, true);
  console.log(intersects);

  // Flag all intersections
  if (intersects.length && intersects[0].object.itemType === 'tile') {
    const name = intersects[0].object.name;
    const instanceId = intersects[0].instanceId;
    if (event.shiftKey || tapTypeState === 'delete') {
      // shift key is pressed, "delete"
      instancedMeshes[name].mesh.getMatrixAt(instanceId, instanceMatrix);
      matrix.multiplyMatrices(instanceMatrix, hideMatrix);
      instancedMeshes[name].mesh.setMatrixAt(instanceId, matrix);
      instancedMeshes[name].mesh.instanceMatrix.needsUpdate = true;
    } else if (tapTypeState === 'select') {
      selectTile(name, instanceId);
    } else if (tapTypeState === 'activate') {
      // no shift key, activate
      toggleTileActiveState(name, instanceId, instancedMeshes[name].mesh);
    }
  }
}

const selectedTileLabel = document.getElementsByClassName('selected-tile-label')[0];
const selectedTileActions = document.getElementsByClassName('selected-tile-actions')[0];

function selectTile(name, instanceId) {
  // set selected tile
  selectedTile = `${name}-${instanceId}`;

  // set selectedTile name in dom
  selectedTileLabel.textContent = selectedTile;
  selectedTileActions.classList.add('has-selection');

  // get position of selected tile and assign marker to that position
  instancedMeshes[name].mesh.getMatrixAt(instanceId, instanceMatrix);
  let vec = new THREE.Vector3();
  vec.setFromMatrixPosition(instanceMatrix);
  const currentY = selectionHighlighter.position.y;
  selectionHighlighter.position.set(vec.x, currentY, vec.z);
  selectionHighlighter.visible = true;
}

/**
 * onMouseMove
 */
function onDocumentMouseMove(event) {
  event.preventDefault();

  mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    var intersect = intersects[0];

    rollOverMesh.position.copy(intersect.point);
    rollOverMesh.position.floor();
    rollOverMesh.position.y = 0;
    rollOverMesh.position.add(rolloverOffsetVector);
    // rollOverMesh.position.y = 0.125;
    // rollOverMesh.position.divideScalar(1).floor().multiplyScalar(1).addScalar(0.5);
  }

  // render();
}

// Set everything up
init();

// Add hammertime
let hammerContainer = new Hammer.Manager(container);
let Tap = new Hammer.Tap();
hammerContainer.add(Tap);
hammerContainer.on('tap', (e) => {
  onMouseClick(e.srcEvent);
});
document.addEventListener('mousemove', onDocumentMouseMove, false);

// Reset button event
const resetButton = document.getElementsByClassName('reset-button')[0];
resetButton.addEventListener('click', e => {
  resetAllTiles();
});

const uiElements = document.getElementsByClassName('ui-elements')[0];
uiElements.addEventListener('click', e => {
  if (e.target.classList.contains('rotate-tile')) {
    let selectedTileParts = selectedTile.split('-');
    rotateTile(selectedTileParts[0], selectedTileParts[1], instancedMeshes[selectedTileParts[0]].mesh);
  }
});

// Add event to update tapType state
const tapTypeRadios = document.getElementsByClassName('tap-state')[0].getElementsByTagName('input');
for (let i = 0; i < tapTypeRadios.length; i++) {
  tapTypeRadios[i].addEventListener('change', e => {
    tapTypeState = e.target.value;

    if (e.target.value !== 'select') {
      selectedTile = null;
      selectedTileLabel.textContent = '';
      selectedTileActions.classList.remove('has-selection');
      selectionHighlighter.visible = false;
    }
  });
}







// Add fullscreen behavior
const fullscreenButton = document.getElementsByClassName('go-fullscreen')[0];
const body = document.body;
fullscreenButton.addEventListener('click', e => {
  goFullscreen(body);
})

function goFullscreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    contaeleminer.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen();
  }
}
