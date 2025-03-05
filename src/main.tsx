import "./index.css";

import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // Import GLTFLoader

const ply = `src/assets/point_cloud.ply`;
const glbModelPath = `src/assets/flying_drone_animation.glb`; // Path to your .glb model

var freeMode = false;

const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Ambient light
scene.add(ambientLight);
scene.background = new THREE.Color(0xffffff); // Set the background color to white

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

viewer.controls.target.set(3.0, 3.0, 9, 0);

document.addEventListener("keydown", function (event) {
  if (event.key == "f") {
    freeMode = !freeMode;
  }
});

// Load and add the .glb model to the scene
const loader = new GLTFLoader();
let droneModel: THREE.Object3D | null = null;
let mixer: THREE.AnimationMixer | null = null; // Declare the AnimationMixer

loader.load(glbModelPath, (gltf) => {
  droneModel = gltf.scene;
  scene.add(droneModel); // Add the loaded model to the scene

  // Optionally adjust model's position, scale, or rotation if necessary
  droneModel.position.set(0, 1, 0); // Position the drone above the ground
  droneModel.scale.set(0.5, 0.5, 0.5); // Scale the model if needed
  droneModel.rotation.set(0, Math.PI / 2, 0); // Rotate the model to the correct orientation
  
  // Create an AnimationMixer to control the animations
  mixer = new THREE.AnimationMixer(droneModel);
  
  mixer.clipAction(gltf.animations[0]).play();
});

// Animation function to update the mixer and play the animation
function animate() {
  if (mixer) {
    // Update the animation mixer
    const delta = clock.getDelta(); // Get time delta to keep animations smooth
    mixer.update(delta);
  }

  renderer.render(scene, camera);
}

const clock = new THREE.Clock(); // Clock to manage the time between frames
renderer.setAnimationLoop(animate);
