import "./index.css";

import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const ply = `src/assets/point_cloud.ply`;
const glbModelPath = `src/assets/flying_drone_animation.glb`;

var freeMode = false;
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
scene.background = new THREE.Color(0xffffff);
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

camera.up = new THREE.Vector3().fromArray([0, 1, 0]);
camera.position.set(2.6, 0, -1);

const viewer = new GaussianSplats3D.Viewer({
  renderer: renderer,
  selfDrivenMode: true,
  threeScene: scene,
  camera: camera,
  sphericalHarmonicsDegree: 0,
});

viewer.addSplatScene(ply, { streamView: true }).then(() => viewer.start());
viewer.controls.target.set(3.0, 3.0, 9, 0);

document.addEventListener("keydown", (event) => {
  if (event.key === "f") freeMode = !freeMode;
});

const loader = new GLTFLoader();
let droneModel = null;
let mixer = null;

loader.load(glbModelPath, (gltf) => {
  droneModel = gltf.scene;
  scene.add(droneModel);
  droneModel.position.set(0, 1, 0);
  droneModel.scale.set(0.5, 0.5, 0.5);
  droneModel.rotation.set(0, Math.PI / 2, 0);

  mixer = new THREE.AnimationMixer(droneModel);
  mixer.clipAction(gltf.animations[0]).play();
});

const clock = new THREE.Clock();

function updateGamepad() {
  const gamepads = navigator.getGamepads();
  if (!gamepads[0] || !droneModel) return;

  const gp = gamepads[0];
  const leftX = gp.axes[0];
  const leftY = gp.axes[1];
  const rightX = gp.axes[2];
  const rightY = gp.axes[3];

  const speed = 0.05;
  // droneModel.position.x += leftX * speed;
  var theta = droneModel.rotation.y;
  droneModel.position.x += - rightX * speed * Math.cos(theta) - rightY * speed * Math.sin(theta);
  droneModel.position.y -= leftY * speed;
  droneModel.position.z += - rightY * speed * Math.cos(theta) + rightX * speed * Math.sin(theta);
  droneModel.rotation.y -= leftX * speed;
}

function animate() {
  if (mixer) mixer.update(clock.getDelta());
  updateGamepad();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("gamepadconnected", (event) => {
  console.log(`Gamepad connected: ${event.gamepad.id}`);
});