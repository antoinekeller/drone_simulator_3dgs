import "./index.css";

import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";

const ply = `src/assets/point_cloud.ply`;

var freeMode = false;

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.setProperty("margin", "auto");

const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

camera.up = new THREE.Vector3().fromArray([0, -1, 0]);
camera.position.set(2.6, 0, -1);

const viewer = new GaussianSplats3D.Viewer({
  renderer: renderer,
  selfDrivenMode: true, // If 'selfDrivenMode' is true, the viewer manages its own update/animation loop via requestAnimationFrame()
  threeScene: scene,
  camera: camera,
  sphericalHarmonicsDegree: 0,
});

viewer
  .addSplatScene(ply, {
    streamView: true,
  })
  .then(() => {
    viewer.start();
  });


viewer.controls.target.set(3.0, 3.0, 9,0);

document.addEventListener("keydown", function (event) {
  if (event.key == "f") {
    freeMode = !freeMode;
  }
});

function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
