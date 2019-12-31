import * as THREE from 'three';

import {
  tweenActiveTileToggle
} from './tweens';

let instanceMatrix = new THREE.Matrix4();
let rotationMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 2);
let hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
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

/**
 * Delete tile
 */
export function deleteTile(name, instanceId, mesh) {
  mesh.getMatrixAt(instanceId, instanceMatrix);
  matrix.multiplyMatrices(instanceMatrix, hideMatrix);
  mesh.setMatrixAt(instanceId, matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Add tile
 */
export function addTile(position, instancedMesh) {
  // Set this index's position
  console.log('adding to this instance', instancedMesh);
  instancedMesh.mesh.setMatrixAt(instancedMesh.count, position.matrix);
  instancedMesh.mesh.instanceMatrix.needsUpdate = true;

  // Increment our counter and the instanced mesh counter
  instancedMesh.mesh.count++;
  instancedMesh.count++;
  console.log('after', instancedMesh);

}

// /**
//  * Rotate selected tile
//  */
// function rotateSelectedTile(selectedTile) {

// }
