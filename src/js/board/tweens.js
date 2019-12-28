import * as THREE from 'three';
import * as TWEEN from 'es6-tween';

/**
 * Tween to handle making a tile active or inactive.
 */
export function tweenActiveTileToggle(mesh, instanceId, isActive) {
  let instanceKey = instanceId.toString();
  let value = isActive ? 1 : -1;

  // Do not trigger if already in motion.
  if (mesh.userData[instanceKey] && mesh.userData[instanceKey].isAnimating) {
    return;
  }

  let myInstanceMatrix = new THREE.Matrix4();
  let myTweenMatrix = new THREE.Matrix4();
  let myMatrix = new THREE.Matrix4();

  // set original position
  mesh.getMatrixAt(instanceId, myInstanceMatrix);
  mesh.userData[instanceKey] = {
    elements: myInstanceMatrix.elements,
    isAnimating: true,
    isActive: false
  }

  let current = {
    z: 0
  };

  let originals = mesh.userData[instanceKey].elements,
    easing = TWEEN.Easing.Quadratic.Out,
    duration = 600;
  // check to make sure originals exist
  if (!originals) {
    console.error('Selection error: instanceKey is not defined, track original elements');
    return;
  }

  // tween property
  let tweenTranslation = new TWEEN.Tween(current)
    .to({
      z: value
    }, duration)
    .easing(easing)
    .on('update', ({
      z
    }) => {
      // use the tweened value to set the matrix for our instance
      myInstanceMatrix.fromArray(mesh.userData[instanceKey].elements);
      myTweenMatrix.makeTranslation(0, 0, current.z);
      myMatrix.multiplyMatrices(myInstanceMatrix, myTweenMatrix);
      mesh.setMatrixAt(instanceId, myMatrix);
      mesh.instanceMatrix.needsUpdate = true;
    })
    .on('complete', function () {
      mesh.userData[instanceKey].isAnimating = false;
      mesh.userData[instanceKey].isActive = isActive;
    });
  tweenTranslation.start();
  return tweenTranslation;
}
