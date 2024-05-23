import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";

let scene, camera, renderer, controls, effect;
let selectedObject = null;

init();
animate();

function init() {
  // Set up scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdddddd);

  // Set up camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Set up orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Set up outline effect
  effect = new OutlineEffect(renderer, { defaultThickness: 0.005 });

  // Load GLB model
  const loader = new GLTFLoader();
  loader.load("./public/BatteryPack_50.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: child.material.color,
          vertexColors: false,
        });
      }
    });
  });

  // Set up lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Add event listener for mouse clicks
  window.addEventListener("click", onClick, false);

  // Handle window resize
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycaster to find intersected objects
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    if (selectedObject) {
      selectedObject.material.color.set(selectedObject.userData.originalColor);
    }

    selectedObject = intersects[0].object;
    selectedObject.userData.originalColor =
      selectedObject.material.color.clone();
    selectedObject.material.color.set(0xff0000); // Highlight color

    // Update the outline effect
    effect.selectedObjects = [selectedObject];

    // Log the number of vertices of the selected submesh
    const numVertices = intersectedObject.geometry.attributes.position.count;
    console.log(`Number of vertices: ${numVertices}`);
  } else {
    if (selectedObject) {
      selectedObject.material.color.set(selectedObject.userData.originalColor);
      selectedObject = null;
    }

    // Clear the outline effect
    effect.selectedObjects = [];
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  effect.render(scene, camera);
}
