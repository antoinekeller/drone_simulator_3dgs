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

camera.up = new THREE.Vector3().fromArray([0, 0, 1]);
camera.position.set(0, -5, 5);

const viewer = new GaussianSplats3D.Viewer({
  renderer: renderer,
  selfDrivenMode: true,
  threeScene: scene,
  camera: camera,
  sphericalHarmonicsDegree: 0,
});

// viewer.addSplatScene(ply, { streamView: true }).then(() => viewer.start());
// viewer.controls.target.set(3.0, 3.0, 9, 0);

document.addEventListener("keydown", (event) => {
  if (event.key === "f") freeMode = !freeMode;
});

const loader = new GLTFLoader();
let droneModel = null;
let mixer = null;

const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const rotY = new THREE.Matrix4().makeRotationY(Math.PI);
const translation = new THREE.Matrix4().makeTranslation(0, 0, -0.85);



loader.load(glbModelPath, (gltf) => {
  droneModel = gltf.scene;
  scene.add(droneModel);
  droneModel.position.set(0, 0, 0);
  droneModel.scale.set(0.5, 0.5, 0.5);

  const initMatrix = new THREE.Matrix4()
  .multiply(translation)
  .multiply(rotX)
  .multiply(rotY);
  
  droneModel.applyMatrix4(initMatrix);

  mixer = new THREE.AnimationMixer(droneModel);
  mixer.clipAction(gltf.animations[0]).play();
});

const clock = new THREE.Clock();
var omega_yaw = 0.0;
const max_omega_yaw = 90 * Math.PI / 180; // 90 degrees per second
var vx = 0.0
var vy = 0.0
var vz = 0.0
const max_vx = 0.1; // 3m/s ?
const max_vy = 0.1; // 3m/s ?
const max_vz = 0.1; // 3m/s ?

function updateGamepad() {
  const gamepads = navigator.getGamepads();
  if (!gamepads[0] || !droneModel) return;

  const dt = 1/60.0; // 60 FPS

  const gp = gamepads[0];
  // console.log(gp);
  const leftX = gp.axes[0];
  const leftY = gp.axes[1];
  const rightX = gp.axes[2];
  const rightY = gp.axes[3];

  // const l2 = gp.buttons[6];

  // droneModel.position.x += leftX * speed;
  // var theta = droneModel.rotation.z;
  // console.log(theta);
  // droneModel.position.x += rightX * speed * Math.cos(theta) - leftY * speed * Math.sin(theta);
  // droneModel.position.y -= rightY * speed;
  const tau = 0.3;

  var omega_c = -leftX * max_omega_yaw;
  omega_yaw = Math.exp(-dt/tau) * omega_yaw + (1 - Math.exp(-dt/tau)) * omega_c;

  // console.log(leftY);
  // droneModel.rotation.z -= leftX * speed;

  const tau_v = 0.1;
  var vx_c = rightX * max_vx;
  var vy_c = -rightY * max_vy;
  var vz_c = - leftY * max_vz;
  vx = Math.exp(-dt/tau_v) * vx + (1 - Math.exp(-dt/tau_v)) * vx_c;
  vy = Math.exp(-dt/tau_v) * vy + (1 - Math.exp(-dt/tau_v)) * vy_c;
  vz = Math.exp(-dt/tau_v) * vz + (1 - Math.exp(-dt/tau_v)) * vz_c;

  const translation = new THREE.Matrix4().makeTranslation(vx, vy, vz);

  const rotZ = new THREE.Matrix4().makeRotationZ(omega_yaw * dt);

  const euler = new THREE.Euler();
  euler.setFromRotationMatrix(droneModel.matrixWorld, "XZY");
  const rotationY = euler.y;

  const t1 = new THREE.Matrix4().makeTranslation(-droneModel.position.x, -droneModel.position.y, -droneModel.position.z);
  const r1 = new THREE.Matrix4().makeRotationZ(-rotationY + Math.PI);
  const T1 = new THREE.Matrix4().multiply(r1).multiply(t1);
  const T2 = new THREE.Matrix4().copy(T1).invert();

  const displacementMatrix = new THREE.Matrix4()
    .multiply(T2)
    .multiply(translation)
    .multiply(rotZ)
    .multiply(T1);

  droneModel.applyMatrix4(displacementMatrix);
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