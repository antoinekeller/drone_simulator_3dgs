import "./index.css";

import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";

// Add event listener to toggle the menu
document.getElementById("toggleMenu")!.addEventListener("click", () => {
  const list = document.getElementById("shortcutList");
  const button = document.getElementById("toggleMenu");

  if (list!.style.display === "block") {
    list!.style.display = "none";
    button!.textContent = "► Instructions"; // Arrow up
  } else {
    list!.style.display = "block";
    button!.textContent = "▼ Instructions"; // Arrow down
  }
});

let gs = `${document.URL.split("/").pop()?.split(".")[0]}`;

// If path is just "/" (homepage), default to "castle"
if (!gs || gs === "") {
  gs = "castle";
}

const ply = `src/assets/pointcloud_${gs}.ply`;
const glbModelPath = `src/assets/flying_drone_animation.glb`;

var inCameraMode = false;
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
scene.background = new THREE.Color(gs === "castle" ? 0x87ceeb : 0xffffff);
// scene.add(new THREE.AxesHelper(5));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.setProperty("margin", "auto");

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.2,
  500
);

camera.up = new THREE.Vector3().fromArray([0, 0, 1]);

const viewer = new GaussianSplats3D.Viewer({
  renderer: renderer,
  selfDrivenMode: true,
  threeScene: scene,
  camera: camera,
  sphericalHarmonicsDegree: 0,
  useBuiltInControls: false,
  rootElement: document.body,
});

viewer
  .addSplatScene(ply, {
    streamView: true,
    showLoadingUI: true,
    splatAlphaRemovalThreshold: 25,
  })
  .then(() => viewer.start());

const loader = new GLTFLoader();
let droneModel: THREE.Object3D = null;
let mixer: THREE.AnimationMixer = null;

const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const rotY = new THREE.Matrix4().makeRotationY(Math.PI);
const translation = new THREE.Matrix4().makeTranslation(0, 0, -0.85);
var cameraPitch = (45 * Math.PI) / 180;
var cameraPositionInDrone = new THREE.Vector3(
  0,
  -Math.cos(cameraPitch) * 0.5,
  Math.sin(cameraPitch) * 0.5
);
const droneOffsetZ = new THREE.Vector3(0, 0, 0.15);

loader.load(glbModelPath, (gltf: GLTF) => {
  droneModel = gltf.scene;
  scene.add(droneModel);
  droneModel.position.set(0, 0, -2);
  droneModel.scale.set(0.1, 0.1, 0.1);

  const initMatrix = new THREE.Matrix4()
    .multiply(translation)
    .multiply(rotX)
    .multiply(rotY);

  droneModel.applyMatrix4(initMatrix);

  const worldCameraPosition = new THREE.Vector3().addVectors(
    droneModel.position,
    cameraPositionInDrone
  );

  camera.position.set(
    worldCameraPosition.x,
    worldCameraPosition.y,
    worldCameraPosition.z
  );

  camera.lookAt(
    new THREE.Vector3().addVectors(droneModel.position, droneOffsetZ)
  );

  mixer = new THREE.AnimationMixer(droneModel);
  mixer.clipAction(gltf.animations[0]).play();
});

const clock = new THREE.Clock();
var omega_yaw = 0.0;
const max_omega_yaw = (90 * Math.PI) / 180; // 90 degrees per second
var vx = 0.0;
var vy = 0.0;
var vz = 0.0;
const max_vx = 0.1;
const max_vy = 0.1;
const max_vz = 0.1;
var roll = 0.0;
const max_roll = (15 * Math.PI) / 180;
var pitch = 0.0;
const max_pitch = (15 * Math.PI) / 180;
var omega_pitch_c = 0.0;
var omega_pitch = 0.0;
const max_omega_pitch = (30 * Math.PI) / 180;

var controls = {
  leftX: 0,
  leftY: 0,
  rightX: 0,
  rightY: 0,
  prevR2State: false, // Stores the previous state of the button
};

function clip(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function updateGamepad() {
  const gamepads = navigator.getGamepads();
  if (!gamepads[0]) return;

  const gp = gamepads[0];
  controls.leftX = gp.axes[0];
  controls.leftY = gp.axes[1];
  controls.rightX = gp.axes[2];
  controls.rightY = gp.axes[3];

  if (gp.buttons[4].pressed) omega_pitch_c = -max_omega_pitch; // L1
  else if (gp.buttons[6].pressed) omega_pitch_c = max_omega_pitch; // L2
  else omega_pitch_c = 0;

  if (gp.buttons[7].touched && !controls.prevR2State)
    inCameraMode = !inCameraMode; // R2

  controls.prevR2State = gp.buttons[7].touched;
}

function updateDynamics() {
  if (!droneModel) return;

  const dt = 1 / 60.0; // 60 FPS

  const tau_yaw = 0.2;

  var omega_c = -controls.leftX * max_omega_yaw;
  omega_yaw =
    Math.exp(-dt / tau_yaw) * omega_yaw +
    (1 - Math.exp(-dt / tau_yaw)) * omega_c;

  const tau_v = 0.2;
  var vx_c = controls.rightX * max_vx;
  var vy_c = -controls.rightY * max_vy;
  var vz_c = -controls.leftY * max_vz;
  vx = Math.exp(-dt / tau_v) * vx + (1 - Math.exp(-dt / tau_v)) * vx_c;
  vy = Math.exp(-dt / tau_v) * vy + (1 - Math.exp(-dt / tau_v)) * vy_c;
  vz = Math.exp(-dt / tau_v) * vz + (1 - Math.exp(-dt / tau_v)) * vz_c;
  var roll_c = controls.rightX * max_roll;
  roll = Math.exp(-dt / tau_v) * roll + (1 - Math.exp(-dt / tau_v)) * roll_c;
  var roll_v = ((roll_c - roll) / tau_v) * dt;
  var pitch_c = controls.rightY * max_pitch;
  pitch = Math.exp(-dt / tau_v) * pitch + (1 - Math.exp(-dt / tau_v)) * pitch_c;
  var pitch_v = ((pitch_c - pitch) / tau_v) * dt;

  const translation = new THREE.Matrix4().makeTranslation(vx, vy, vz);

  const rotX = new THREE.Matrix4().makeRotationX(pitch_v);
  const rotY = new THREE.Matrix4().makeRotationY(roll_v);
  const rotZ = new THREE.Matrix4().makeRotationZ(omega_yaw * dt);

  const euler = new THREE.Euler();
  euler.setFromRotationMatrix(droneModel.matrixWorld, "XZY");
  const rotationY = euler.y;
  const yaw = -rotationY + Math.PI;

  const t1 = new THREE.Matrix4().makeTranslation(
    -droneModel.position.x,
    -droneModel.position.y,
    -droneModel.position.z
  );
  const r1 = new THREE.Matrix4().makeRotationZ(yaw);
  const T1 = new THREE.Matrix4().multiply(r1).multiply(t1);
  const T2 = new THREE.Matrix4().copy(T1).invert();

  const displacementMatrix = new THREE.Matrix4()
    .multiply(T2)
    .multiply(translation)
    .multiply(rotZ)
    .multiply(rotY)
    .multiply(rotX)
    .multiply(T1);

  droneModel.applyMatrix4(displacementMatrix);

  omega_pitch =
    Math.exp(-dt / tau_yaw) * omega_pitch +
    (1 - Math.exp(-dt / tau_yaw)) * omega_pitch_c;
  cameraPitch = clip(cameraPitch + omega_pitch * dt, 0.32, 1.55);

  cameraPositionInDrone.y = -Math.cos(cameraPitch) * 0.5;
  cameraPositionInDrone.z = Math.sin(cameraPitch) * 0.5;

  const cameraPositionInWorld = new THREE.Vector3().copy(cameraPositionInDrone);
  cameraPositionInWorld.applyMatrix4(r1.invert());

  const worldCameraPosition = new THREE.Vector3().addVectors(
    droneModel.position,
    cameraPositionInWorld
  );

  const dronePosition = new THREE.Vector3().addVectors(
    droneModel.position,
    droneOffsetZ
  );

  if (!inCameraMode) {
    camera.position.set(
      worldCameraPosition.x,
      worldCameraPosition.y,
      worldCameraPosition.z
    );

    var lookAt = new THREE.Vector3(
      dronePosition.x,
      dronePosition.y,
      dronePosition.z + 0.1
    );

    camera.lookAt(lookAt);
  } else {
    camera.position.set(
      dronePosition.x,
      dronePosition.y,
      dronePosition.z + 0.1
    );
    var lookAt = new THREE.Vector3(
      2 * dronePosition.x - worldCameraPosition.x,
      2 * dronePosition.y - worldCameraPosition.y,
      2 * (dronePosition.z + 0.1) - worldCameraPosition.z
    );
    camera.lookAt(lookAt);
  }

  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  motorSpeed = 1.0 + 0.7 * speed;
  root.render(<MotorSound speed={motorSpeed} />);
}

// 🛠 Create a React component for the Motor Sound
const MotorSound = ({ speed }: { speed: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    audioCtxRef.current = new AudioContext();

    fetch("src/assets/quadcopter.mp3")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioCtxRef.current!.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        bufferRef.current = audioBuffer;
      })
      .catch((error) => console.error("Error loading sound:", error));
  }, []);

  const startEngine = () => {
    if (!audioCtxRef.current || !bufferRef.current) return;

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.loop = true;
    source.connect(audioCtxRef.current.destination);
    source.start();

    sourceRef.current = source;
    setIsPlaying(true);
  };

  const stopEngine = () => {
    sourceRef.current?.stop();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.playbackRate.setValueAtTime(
        speed,
        audioCtxRef.current!.currentTime
      );
    }
  }, [speed]);

  return (
    <div id="motor-sound-ui">
      {isPlaying ? (
        <button onClick={stopEngine}>🔊</button> // Stop engine when clicked
      ) : (
        <button onClick={startEngine}>🔇</button> // Start engine when clicked
      )}
    </div>
  );
};

const reactContainer = document.getElementById("mute-button");

// React Root
const root = createRoot(reactContainer);

// Drone & Three.js Setup
let motorSpeed = 1.0; // 🛠 This will be linked to the MotorSound component

function animate() {
  if (mixer) mixer.update(clock.getDelta());
  updateGamepad();
  updateDynamics();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("gamepadconnected", (event) => {
  console.log(`Gamepad connected: ${event.gamepad.id}`);
});

window.addEventListener("keydown", (event) => {
  if (event.key == "w") controls.leftY = -1;
  if (event.key == "s") controls.leftY = 1;
  if (event.key == "a") controls.leftX = -1;
  if (event.key == "d") controls.leftX = 1;

  if (event.key == "ArrowUp") controls.rightY = -1;
  if (event.key == "ArrowDown") controls.rightY = 1;
  if (event.key == "ArrowLeft") controls.rightX = -1;
  if (event.key == "ArrowRight") controls.rightX = 1;

  if (event.key == "c") inCameraMode = !inCameraMode;
  if (event.key == "r") omega_pitch_c = max_omega_pitch;
  if (event.key == "f") omega_pitch_c = -max_omega_pitch;
});

window.addEventListener("keyup", (event) => {
  if (event.key == "w" || event.key == "s") controls.leftY = 0;
  if (event.key == "a" || event.key == "d") controls.leftX = 0;
  if (event.key == "ArrowUp" || event.key == "ArrowDown") controls.rightY = 0;
  if (event.key == "ArrowLeft" || event.key == "ArrowRight")
    controls.rightX = 0;
  if (event.key == "r" || event.key == "f") omega_pitch_c = 0;
});
