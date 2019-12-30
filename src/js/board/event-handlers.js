import {
  tweenActiveTileToggle
} from './tweens';
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
