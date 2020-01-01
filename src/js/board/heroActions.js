export function rotateModel(object, clockwise) {
  let rotation = clockwise ? -Math.PI / 2 : Math.PI / 2;
  object.rotateY(rotation);
}

export function moveForward(object) {
  object.translateZ(1);
}

export function moveBackward(object) {
  object.translateZ(-1);
}
