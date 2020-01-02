import * as THREE from 'three';
import * as TWEEN from 'es6-tween';
import * as Hammer from 'hammerjs';

import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';
import {
  MapControls
} from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';

import {
  tweenActiveTileToggle
} from './board/tweens';
import {
  setMouse,
  degToRad,
} from './board/helpers';
import {
  toggleTileActiveState,
  rotateTile,
  deleteTile,
  addTile,
  getTilePosition,
  getSelectedTilePosition,
  hideRollOver,
} from './board/tileActions';
import {
  rotateModel,
  moveForward,
  moveBackward,
} from './board/heroActions';
import {
  loadTileTextures
} from './board/loadTextures';

import '../css/index.css';
import {
  isIntersectionTypeAnnotation
} from '@babel/types';

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
let characterGroup;
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
let rolloverOffsetVector = new THREE.Vector3(0.5, 0.125, 0.5);
let initialTileOffsetVector = new THREE.Vector3(0.5, 0.125, 0.5);
let matrix = new THREE.Matrix4();
let selectedTile = null;
let tapTypeState = 'activate';
let creationTileType = 'first';
let wasdEnabled = false;

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

  createMeshes(false);

  loadCharacterModel();
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

  camera.position.set(0, 10, 0);
}

/**
 * Create the camera controls
 */
function createControls() {
  // Map Controls
  controls = new MapControls(camera, container);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.15;
  controls.screenSpacePanning = false;
  controls.minDistance = 4;
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
 * Load Models
 */
function loadCharacterModel() {
  const loader = new GLTFLoader();

  // Load 90s dad
  characterGroup = new THREE.Group();
  characterGroup.name = 'character_group';

  // Hide 90s dad under board (TODO: figure out if he can be loaded without being added)
  characterGroup.position.set(0.5, -5, 0.5);

  boardGroup.add(characterGroup);

  // Load 90s dad
  const dadMatrix = new THREE.Matrix4();
  dadMatrix.makeScale(0.125, 0.125, 0.125);
  dadMatrix.setPosition(0, 0, 0);
  loader.load(
    'models/90s_dad/scene.gltf',
    gltf => onModelLoad(gltf, characterGroup, dadMatrix),
    onModelProgress,
    onModelError
  );

  // Load 90s dad's sword
  const swordMatrix = new THREE.Matrix4();
  swordMatrix.makeRotationFromEuler(new THREE.Euler(degToRad(70), degToRad(15), degToRad(-80), 'XYZ'));
  swordMatrix.multiply(matrix.makeScale(0.4, 0.4, 0.4));
  swordMatrix.setPosition(0.17, 0.71, 0.175);
  loader.load(
    'models/medieval_sword/scene.gltf',
    gltf => onModelLoad(gltf, characterGroup, swordMatrix),
    onModelProgress,
    onModelError
  );
}

/**
 * Create grid
 */
function createGrid() {
  // Add grid group
  const gridGroup = new THREE.Group();

  // add roller helpers
  rollOverGeo = new THREE.BoxBufferGeometry(1, 0.25, 1);
  rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true
  });
  rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
  hideRollOver(rollOverMesh);
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
function createMeshes(withTiles) {
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

  if (withTiles) {
    // Populate all the instance meshes randomly
    let offset = (tilesNumber - 1) / 2;
    let instancedKeys = Object.keys(instancedMeshes);

    for (let x = 0; x < tilesNumber; x++) {
      for (let z = 0; z < tilesNumber; z++) {
        // set transform based on position
        transform.position.set(offset - x, 0.125, offset - z);
        transform.updateMatrix();

        // Choose the instanced mesh to add to
        let inst = Math.floor(Math.random() * numberOfInstancedMeshes);
        let key = instancedKeys[inst];

        // add the tile
        addTile(transform, instancedMeshes[key]);
      }
    }
  }

  // Add all instancedMeshes to the scene
  for (let i = 0; i < numberOfInstancedMeshes; i++) {
    let key = getInstancedMeshKeyByIndex(i);
    boardGroup.add(instancedMeshes[key].mesh);
  }

  // Create and add the selection mesh
  selectionHighlighter = new THREE.Mesh(geometries.cone, materials.tile);

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
  controls.update();

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

// Need to resize on both resize and orientation changes
window.addEventListener('resize', onWindowResize);
window.addEventListener('onorientationchange', onWindowResize);

/**
 * mousemove helper
 */
function onMouseClick(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  setMouse(mouse, event, container);

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  let intersects = raycaster.intersectObjects(boardGroup.children, true);
  const hasHitTile = intersects.length && intersects[0].object.itemType === 'tile';

  // Flag all intersections
  if (hasHitTile) {
    const name = intersects[0].object.name;
    const instanceId = intersects[0].instanceId;
    if (event.shiftKey || tapTypeState === 'delete') {
      // shift key is pressed, "delete"
      deleteTile(name, instanceId, instancedMeshes[name].mesh);
    } else if (tapTypeState === 'select') {
      selectTile(name, instanceId);
    } else if (tapTypeState === 'activate') {
      // no shift key, activate
      toggleTileActiveState(name, instanceId, instancedMeshes[name].mesh);
    }
  }

  // "unoccupied" board spaces intersections
  if (tapTypeState === 'create' && creationTileType !== null && !hasHitTile) {
    raycaster.setFromCamera(mouse, camera);

    let objectsIntersects = raycaster.intersectObjects(objects, true);

    if (objectsIntersects.length > 0) {
      let intersect = objectsIntersects[0];

      intersect.point.floor();
      intersect.point.y = 0;
      intersect.point.add(initialTileOffsetVector);
      transform.position.copy(intersect.point);
      transform.updateMatrix();

      addTileByType(creationTileType, transform);
      hideRollOver(rollOverMesh);
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
  let positionVec = getTilePosition(name, instanceId, instancedMeshes);
  const currentY = selectionHighlighter.position.y;
  selectionHighlighter.position.set(positionVec.x, currentY, positionVec.z);
  selectionHighlighter.visible = true;
}

function addModelToSelectedTile() {
  if (selectedTile) {
    let v = getSelectedTilePosition(selectedTile, instancedMeshes);
    v.y = 0.25;
    characterGroup.position.set(v.x, v.y, v.z);
  } else {
    alert('You must select a tile!');
  }
}

// function positionModel(model, position) {
//   model.position.set(position);
// }

function addTileByType(type, position) {
  if (instancedMeshes.hasOwnProperty(type)) {
    addTile(position, instancedMeshes[type]);
  } else {
    console.error(`Invalid tile type: '${type}'`);
  }
}

/**
 * onMouseMove
 */
function onDocumentMouseMove(event) {
  event.preventDefault();
  setMouse(mouse, event, container);
  raycaster.setFromCamera(mouse, camera);

  // Check if we hit a tile, if so we don't want to hide the mesh
  let boardIntersects = raycaster.intersectObjects(boardGroup.children, true);
  const hasHitTile = boardIntersects.length && boardIntersects[0].object.itemType === 'tile';
  if (hasHitTile) {
    hideRollOver(rollOverMesh);
    return;
  }

  // If we haven't hit a tile, check where in the grid we are and position rollover
  let intersects = raycaster.intersectObjects(objects, true);
  if (intersects.length > 0) {
    var intersect = intersects[0];

    rollOverMesh.position.copy(intersect.point);
    rollOverMesh.position.floor();
    rollOverMesh.position.y = 0;
    rollOverMesh.position.add(rolloverOffsetVector);
  }
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
    let {
      name,
      instanceId
    } = deconstructTileStringId(selectedTile);
    rotateTile(name, instanceId, instancedMeshes[name].mesh);
  }
  if (e.target.classList.contains('place-hero')) {
    addModelToSelectedTile();
  }
  if (e.target.classList.contains('rotate-hero-left')) {
    rotateModel(characterGroup, false);
  }
  if (e.target.classList.contains('rotate-hero-right')) {
    rotateModel(characterGroup, true);
  }
  if (e.target.classList.contains('move-hero-forward')) {
    moveForward(characterGroup);
  }
  if (e.target.classList.contains('move-hero-backward')) {
    moveBackward(characterGroup);
  }
});


// Add event to update tile selection state
const creationTypeControl = document.getElementsByClassName('creation-tile-type')[0];
const creationTypeRadios = creationTypeControl.getElementsByTagName('input');
for (let i = 0; i < creationTypeRadios.length; i++) {
  creationTypeRadios[i].addEventListener('change', e => {
    creationTileType = e.target.value;
  });
}

// Add event to update tapType state
const tapTypeRadios = document.getElementsByClassName('tool-state')[0].getElementsByTagName('input');
for (let i = 0; i < tapTypeRadios.length; i++) {
  tapTypeRadios[i].addEventListener('change', e => {
    tapTypeState = e.target.value;

    if (e.target.value !== 'select') {
      selectedTile = null;
      selectedTileLabel.textContent = '';
      selectedTileActions.classList.remove('has-selection');
      selectionHighlighter.visible = false;
    }

    if (e.target.value === 'create') {
      creationTypeControl.classList.add('enabled');
    } else {
      creationTypeControl.classList.remove('enabled');
    }
  });
}

// Add wasd events
const wasdToggle = document.getElementsByClassName('enable-wasd')[0].getElementsByTagName('input')[0];
wasdToggle.addEventListener('change', e => {
  wasdEnabled = e.target.checked;
});
document.addEventListener('keypress', e => {
  console.log('keypress', e);
  // do wasd logic if enabled
  if (wasdEnabled) {
    switch (e.key) {
      case 'w':
        moveForward(characterGroup);
        break;
      case 's':
        moveBackward(characterGroup);
        break;
      case 'a':
        rotateModel(characterGroup, false);
        break;
      case 'd':
        rotateModel(characterGroup, true);
        break;

    }
  }
});

/**
 * Use to recreate an instanced mesh with a new instanceMatrix count.
 */
function increaseInstanceCount(mesh, newCount) {
  // TODO: implement
}

// Reusable onLoad function
const onModelLoad = (gltf, modelGroup, modelMatrix) => {
  const model = gltf.scene.children[0];
  model.applyMatrix(modelMatrix);

  // let box = new THREE.BoxHelper(model, 0xffff00);

  modelGroup.add(model);
  // modelGroup.add(box);
};

// the loader will report the loading progress to this function
const onModelProgress = () => {};

// the loader will send any error messages to this function, and we'll log
// them to to console
const onModelError = errorMessage => {
  console.log(errorMessage);
};






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
