# Drone simulator

[\[ONLINE DEMO\]](https://www.antoinekeller.tech/)

[\[YOUTUBE VIDEO\]](https://youtu.be/Q0kTwmlhLAA)

This project is a Vite+React project that simulates a drone in a 3D Gaussian Splatting scene.
The project is based on the [Three.js-based implemetation of a renderer of 3D GS](https://github.com/mkkellogg/GaussianSplats3D) by [mkkellogg](https://github.com/mkkellogg).

It embeds a drone model taken from [Sketchfab](https://sketchfab.com/3d-models/flying-drone-2ecfb55304a043a2a86353f70cc1cf92) and can be controllable with the keyboard or with a gamepad controller (e.g. PS4 controller). The position mode is used, but FPV modes (angle, accro...) are not supported yet.

I made the 3D Gaussian Splatting scenes with a DJI drone, performed photogrammetry with [COLMAP](https://colmap.github.io/), rectified vertically and rescaled it manually, then trained it for 30k iterations with the official [gaussian-splatting repo](https://github.com/graphdeco-inria/gaussian-splatting).

<p>
  <em>Castle</em></br>
  <img src="./src/assets/demo_castle.png" alt="Demo - Castle" style="width:100%; max-width:100%;" />
</p>

<p>
  <em>Stupa</em></br>
  <img src="./src/assets/demo_stupa.png" alt="Demo - Stupa" style="width:100%; max-width:100%;" />
</p>

## Installation

```
npm i
```

```
npm run dev
```

This will start a local server at `http://localhost:5173/`

## Drone model

I downloaded model from sketchab (flying drone animation). There was somme issue with the `KHR_materials_pbrSpecularGlossiness`. I had to :

```
npm install --global @gltf-transform/cli

gltf-transform metalrough flying_drone_animation.glb out.glb
```
