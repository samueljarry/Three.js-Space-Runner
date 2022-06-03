import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "lil-gui";
import { PointLightHelper } from "three";
import gsap from "gsap";

// Constantes globales

const ufoSpawnX = 5;
const ufoDestroyX = -20;
const ufoSpawnInterval = 10;

// Variables

let gameover = null
let mixer = null;
let ufo = null;
let ufoHitbox = null;
let cosmonautMixer = null;
let cosmonautMesh = null;
let cosmonautAction = null;
let cosmonaut1 = null
let ufoSpawnDelai = 0

// Fonctions

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Base
 */

// Debug
const gui = new dat.GUI();
gui.hide();

// Textures
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/cubemap/px.png",
  "/textures/cubemap/nx.png",
  "/textures/cubemap/py.png",
  "/textures/cubemap/ny.png",
  "/textures/cubemap/pz.png",
  "/textures/cubemap/nz.png",
]);

environmentMapTexture.minFilter = THREE.NearestFilter;
environmentMapTexture.magFilter = THREE.NearestFilter;

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = environmentMapTexture;

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 8),
  new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0,
    roughness: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/* 
  Ufos 3D models
 */
const ufoGroup = new THREE.Group()
scene.add(ufoGroup)

gltfLoader.load("/models/Ufo/scene.gltf", (gltf) => {
  ufo = gltf.scene;
  mixer = new THREE.AnimationMixer(ufo);
  const action = mixer.clipAction(gltf.animations[0]);

  ufo.position.x = 5

  scene.add(ufo)
  action.play();

  ufo.scale.set(0.15, 0.15, 0.15);
  ufo.position.y = 0.5;


});

/* 
    Cosmonaut 3D model
 */

gltfLoader.load("/models/astronaut/cosmonaut4.gltf", (cosmonaut) => {
  cosmonaut1 = cosmonaut
  cosmonautMesh = cosmonaut.scene;
  cosmonautMixer = new THREE.AnimationMixer(cosmonautMesh);
  cosmonautAction = cosmonautMixer.clipAction(cosmonaut.animations[8]);

  // Position
  cosmonautMesh.position.x = -2;
  cosmonautMesh.rotation.y = 1.5;
  console.log(cosmonautMesh.position.y)

  // Shadows
  cosmonaut.receiveShadow = true;
  cosmonaut.castShadow = true;

  // Debug
  const player = gui.addFolder("Cosmonaut");
  player.close()

  player.add(cosmonautMesh.position, "x").min(-5).max(5).step(0.01);

  player.add(cosmonautMesh.position, "y").min(-5).max(5).step(0.01);

  player.add(cosmonautMesh.position, "z").min(-5).max(5).step(0.01);

  player
    .add(cosmonautMesh.rotation, "y")
    .min(-5)
    .max(5)
    .step(0.01)
    .name("rotate x");

  // Saut
  document.addEventListener("keydown", (event) => {
    if(cosmonautMesh.position.y == 0){
      
    if (event.code === "ArrowUp" || event.code === "Space") {
      
      if(gameover == null){  
      //  Montée Astronaute
      gsap.to(cosmonautMesh.position, {
        duration: 0.6,
        ease: "Power2.easeOut",
        y: 1,
      });

      // Descente Astro
      gsap.to(cosmonautMesh.position, {
        duration: 0.6,
        ease: "Power1.easeInOut",
        delay: 0.4,
        y: 0,
      });

      cosmonautAction.stop();
      cosmonautAction = cosmonautMixer.clipAction(cosmonaut.animations[6]);
      cosmonautAction.play();

      // Fin animation
      setTimeout(() => {
        cosmonautAction.stop();
        cosmonautAction = cosmonautMixer.clipAction(cosmonaut.animations[8]);
        cosmonautAction.play();
      }, 720);
    }
    }
    }});

  

  // Height and scene
  cosmonautMesh.scale.set(0.37, 0.37, 0.37);
  scene.add(cosmonautMesh);
  cosmonautAction.play();
});

/* 
    Hitbox Astronaute
*/
const cosHitbox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
);
cosHitbox.visible = false;

cosHitbox.position.set(-1.884, 0.5, 0)
cosHitbox.scale.set(0.206, 0.94, 0.45)

const ch = gui.addFolder('Cosmonaut Hitbox')
ch.close()
ch.add(cosHitbox.position, "x").min(-5).max(5).step(0.001);
ch.add(cosHitbox.scale, "x").min(0).max(5).step(0.001);
ch.add(cosHitbox, "visible")

scene.add(cosHitbox);

const hitbox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
hitbox.setFromObject(cosHitbox);

// Saut
if(gameover == null)
{
document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowUp" || event.code === "Space") {
    // Montée Hitbox
    gsap.to(cosHitbox.position, {
      duration: 0.4,
      ease: "Power2.easeOut",
      y: 1.5,
    });

    // Descente Hitbox
    gsap.to(cosHitbox.position, {
      duration: 0.5,
      ease: "Power1.easeInOut",
      delay: 0.4,
      y: 0.5,
    });
  }
});
}

/* 
    UFO Hitbox
 */
ufoHitbox = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
);
ufoHitbox.visible = false

ufoHitbox.scale.x = 0.72;
ufoHitbox.scale.y = 0.2;
ufoHitbox.scale.z = 0.57;

const debugUfo = gui.addFolder("Hitbox ufo");
debugUfo.close()
debugUfo.add(ufoHitbox.scale, "x").min(-5).max(5).step(0.01);
debugUfo.add(ufoHitbox.scale, "y").min(-5).max(5).step(0.01);
debugUfo.add(ufoHitbox, "visible")
scene.add(ufoHitbox);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(0, 2, 0);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xb86200, 1);

pointLight.position.x = 4.1;
pointLight.position.y = 1.52;
pointLight.position.z = 4.35;
pointLight.intensity = 1.36;


scene.add(pointLight);

const debugPL = gui.addFolder('Point Light')
debugPL.close()

debugPL.add(pointLight.position, "x").min(-5).max(10).step(0.01).name("light x");
debugPL.add(pointLight.position, "y").min(0).max(10).step(0.01).name("light y");
debugPL.add(pointLight.position, "z").min(0).max(10).step(0.01).name("light z");
debugPL.add(pointLight, "intensity").min(0).max(10).step(0.01).name("light intensity");
debugPL.add(pointLight, "visible")
debugPL.addColor(pointLight, "color");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0.75, 5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  
  // Score 
  if(gameover == null){
  const score = Math.round(elapsedTime * 20).toLocaleString("fr-FR", {
    minimumIntegerDigits: 5,
    useGrouping: false,
  });
  document.getElementById("score").innerText = score;
  }

  /* function respawnUfo() {
    nextUfoResetTime = clock.elapsedTime + ufoSpawnInterval;
    ufo.position.x = 10;
    ufo.position.y = 0.5;
  } */

  // Animation updater
  if (mixer !== null) {
    mixer.update(deltaTime * 2.5);
  }


  if ((ufo !== null) & (ufoHitbox !== null) & (cosmonautMesh !== null) & (cosmonautAction !== null)) {
    // Mouvement Ufo
    ufo.position.x = 5 - elapsedTime * 3;
    ufoHitbox.position.x = ufo.position.x;
    ufoHitbox.position.y = ufo.position.y;
    ufoHitbox.position.z = ufo.position.z;

    // Collision
    const hitbox = new THREE.Box3().setFromObject(cosHitbox)
    const hitbox2 = new THREE.Box3().setFromObject(ufoHitbox)

    var collision = hitbox.intersectsBox(hitbox2)
    if(collision)
    {
        cosmonautAction.stop();
        cosmonautAction = cosmonautMixer.clipAction(cosmonaut1.animations[2]);
        cosmonautAction.setLoop(THREE.LoopOnce)
        cosmonautAction.clampWhenFinished = true
        
        cosmonautAction.play();
        gameover = 1
    }
  }

  if (cosmonautMixer !== null) {
    cosmonautMixer.update(deltaTime * 1.3);
  }




  /* function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Spawn new ufo.
  if (clock.elapsedTime > ufoSpawnDelai) {
    const interval = randomFloat(
      ufoSpawnIntervalMin,
      ufoSpawnIntervalMax
    );

    ufoSpawnDelai = clock.elapsedTime + interval;
    
    if(ufo !==null){
    const numUfo = randomInt(3, 5);
    for (let i = 0; i < numUfo; i++) {
      const clone = ufo.clone();
      clone.position.x = ufoSpawnX + i * 0.5;
      clone.scale.set(0.15, 0.15, 0.15);

      ufoGroup.add(clone);
      }
    }
  } */

  // Dispawn les UFO en dehors de l'écran
  while (
    ufoGroup.children.length > 0 &&
    ufoGroup.children[0].position.x < - 5 
  ) {
    ufoGroup.remove(ufoGroup.children[0]);

  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
