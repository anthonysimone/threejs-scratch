/**
 * Set mouse
 */
export function setMouse(mouse, event, element) {
  mouse.set((event.offsetX / element.clientWidth) * 2 - 1, -(event.offsetY / element.clientHeight) * 2 + 1);
}
