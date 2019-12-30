import * as THREE from 'three';

import {
  tweenActiveTileToggle
} from './tweens';

let instanceMatrix = new THREE.Matrix4();
let rotationMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 2);
let matrix = new THREE.Matrix4();

/**
 * Toggle the tile active state
 */
export function toggleTileActiveState(name, instanceId, mesh) {
  let instanceKey = instanceId.toString();

  let instanceUserData = mesh.userData[instanceKey];
  if (instanceUserData && instanceUserData.isAnimating) {
    return;
  }
  if (!instanceUserData || (instanceUserData && !instanceUserData.isActive)) {
    tweenActiveTileToggle(mesh, instanceId, true);
  } else {
    tweenActiveTileToggle(mesh, instanceId, false);
  }
}

/**
 * Rotate tile
 */
export function rotateTile(name, instanceId, mesh) {
  mesh.getMatrixAt(instanceId, instanceMatrix);
  matrix.multiplyMatrices(instanceMatrix, rotationMatrix);
  mesh.setMatrixAt(instanceId, matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

// /**
//  * Rotate selected tile
//  */
// function rotateSelectedTile(selectedTile) {

// }
