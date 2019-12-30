import * as THREE from 'three';

const stoneFloorPng = require('../../textures/stone-floor-texture.png');
const wallPng = require('../../textures/wall-texture.png');
const waterPng = require('../../textures/water-texture.png');
const pitPng = require('../../textures/pit-texture.png');
const doorwayPng = require('../../textures/doorway-texture.png');

/**
 * Load all of our tile textures and return an array of them.
 */
export function loadTileTextures() {
  const textures = [];
  const stoneTexture = new THREE.TextureLoader().load(stoneFloorPng);
  stoneTexture.encoding = THREE.sRGBEncoding;
  stoneTexture.anisotropy = 16;
  stoneTexture.magFilter = THREE.NearestFilter;
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.repeat.set(2, 2);
  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: stoneTexture
  });
  textures.push(stoneMaterial);

  const wallTexture = new THREE.TextureLoader().load(wallPng);
  wallTexture.encoding = THREE.sRGBEncoding;
  wallTexture.anisotropy = 16;
  wallTexture.magFilter = THREE.NearestFilter;
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture
  });
  textures.push(wallMaterial);

  const doorwayTexture = new THREE.TextureLoader().load(doorwayPng);
  doorwayTexture.encoding = THREE.sRGBEncoding;
  doorwayTexture.anisotropy = 16;
  doorwayTexture.magFilter = THREE.NearestFilter;
  doorwayTexture.wrapS = THREE.RepeatWrapping;
  doorwayTexture.wrapT = THREE.RepeatWrapping;
  const doorwayMaterial = new THREE.MeshStandardMaterial({
    map: doorwayTexture
  });
  textures.push(doorwayMaterial);

  const waterTexture = new THREE.TextureLoader().load(waterPng);
  waterTexture.encoding = THREE.sRGBEncoding;
  waterTexture.anisotropy = 16;
  waterTexture.magFilter = THREE.NearestFilter;
  waterTexture.wrapS = THREE.RepeatWrapping;
  waterTexture.wrapT = THREE.RepeatWrapping;
  const waterMaterial = new THREE.MeshStandardMaterial({
    map: waterTexture
  });
  textures.push(waterMaterial);

  const pitTexture = new THREE.TextureLoader().load(pitPng);
  pitTexture.encoding = THREE.sRGBEncoding;
  pitTexture.anisotropy = 16;
  pitTexture.magFilter = THREE.NearestFilter;
  pitTexture.wrapS = THREE.RepeatWrapping;
  pitTexture.wrapT = THREE.RepeatWrapping;
  const pitMaterial = new THREE.MeshStandardMaterial({
    map: pitTexture
  });
  textures.push(pitMaterial);

  return textures;
}
