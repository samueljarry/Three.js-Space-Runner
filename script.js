import "./style.css";
import "./test.js"
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "lil-gui";
import gsap from "gsap";

if(document.readyState === 'complete')
{
  console.log('pret')
}

// Variables / Constantes globales

let gameover = false
let mixer = null;
let ufo = null;
let ufoHitbox = null;
let cosmonautMixer = null;
let cosmonautMesh = null;
let cosmonautAction = null
let action = null
let cosmonaut1 = null


const replay = document.getElementById('replay')
const restart = document.getElementById('restart')
const gui = new dat.GUI();

restart.addEventListener('click', () => {
  location.reload()
})

/**
 * Base
 */

// Debug

gui.hide();

// Textures

const textureLoader = new THREE.TextureLoader()

const background = textureLoader.load('/textures/cubemap/nz.jpg');
const moonTexture = textureLoader.load('/textures/moonTexture.jpg')

background.minFilter = THREE.NearestFilter;
background.magFilter = THREE.NearestFilter;

moonTexture.minFilter = THREE.NearestFilter;
moonTexture.magFilter = THREE.NearestFilter;

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/* 
  * Background
 */

const bg = new THREE.Mesh(
  new THREE.PlaneGeometry,
  new THREE.MeshStandardMaterial({map: background})
)

bg.position.y = 0,904
bg.position.z = -10
bg.scale.set(30, 30, 30)

const bgDebug = gui.addFolder('Background')
bgDebug.add(bg.position, 'x').min(-10).max(10).step(0.001)
bgDebug.add(bg.position, 'y').min(-10).max(10).step(0.001)
bgDebug.add(bg.position, 'z').min(-10).max(10).step(0.001)
bgDebug.add(bg.scale, 'x').min(-10).max(50).step(0.001)
bgDebug.add(bg.scale, 'y').min(-10).max(50).step(0.001)
bgDebug.add(bg.scale, 'z').min(-10).max(50).step(0.001)

scene.add(bg)

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
/* scene.add(floor); */

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 9,
    metalness: 0.5
  })
)

moon.position.set(-2, -0.77, 0)

const moonDebug = gui.addFolder('Moon')
moonDebug.add(moon.position, 'x').min(-5).max(5).step(0.001)
moonDebug.add(moon.position, 'y').min(-5).max(5).step(0.001)
moonDebug.add(moon.position, 'z').min(-5).max(5).step(0.001)

scene.add(moon)

/* 
  Load 3D model
*/

var roadStripArray = []
function objectRoadStrip() {
  if(!gameover){
   gltfLoader.load("/models/Ufo/scene.gltf", (gltf) => {
       ufo = gltf.scene;
       mixer = new THREE.AnimationMixer(ufo);
       action = mixer.clipAction(gltf.animations[0]);
       action.play()
         ufo.position.set(5, 0.5, 0)
         ufo.scale.set(0.15,0.15,0.15)
         ufo.receiveShadow = true;
         scene.add(ufo);
         roadStripArray.push(ufo);
       }
     );
     ufoHitbox = new THREE.Mesh(
       new THREE.BoxGeometry(1, 1, 1),
       new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
     );
     ufoHitbox.visible = false
     
     ufoHitbox.scale.x = 0.72;
     ufoHitbox.scale.y = 0.2;
     ufoHitbox.scale.z = 0.57;
     scene.add(ufoHitbox)
}
}


/* 
    Cosmonaut 3D model
 */

gltfLoader.load("/models/astronaut/cosmonaut1.gltf", (cosmonaut) => {
  cosmonaut1 = cosmonaut
  cosmonautMesh = cosmonaut.scene;
  cosmonautMixer = new THREE.AnimationMixer(cosmonautMesh);
  cosmonautAction = cosmonautMixer.clipAction(cosmonaut.animations[8]);

  // Position
  cosmonautMesh.position.x = -2;
  cosmonautMesh.rotation.y = 1.5;

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
      
      if(!gameover){  
      //  Montée Astronaute
      gsap.to(cosmonautMesh.position, {
        duration: 0.2,
        ease: "Power2.easeOut",
        y: 1,
      })

      // Descente Astro
      gsap.to(cosmonautMesh.position, {
        duration: 0.3,
        ease: "Power0.easeIn",
        delay: 0.21 ,
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
cosHitbox.visible = false

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
if(!gameover)
{
  document.addEventListener("keydown", (event) => {
    if(cosHitbox.position.y == 0.5)
    {
      if (event.code === "ArrowUp" || event.code === "Space") {
          // Montée Hitbox
          gsap.to(cosHitbox.position, {
            duration: 0.2,
            ease: "Power2.easeOut",
            y: 1.5,
          });

          // Descente Hitbox
          gsap.to(cosHitbox.position, {
            duration: 0.3,
            ease: "Power1.easeInOut",
            delay: 0.2,
            y: 0.5,
          });
      }
   }
  });
  }

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

var clock = new THREE.Clock();
var time = 0;
var direction = new THREE.Vector3(-1, 0, 0);
var speed = 7; // units a second - 2 seconds
objectRoadStrip()


document.addEventListener("DOMContentLoaded", () => {
    
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - time;
  time = elapsedTime;
  if(!gameover){
    // Score
    let score = Math.round(elapsedTime * 20).toLocaleString("fr-FR", {
      minimumIntegerDigits: 5,
      useGrouping: false,
    });
    document.getElementById("score").innerText = score;

    roadStripArray.forEach(function(ufo){
      ufo.position.addScaledVector(direction, speed * deltaTime);
      ufoHitbox.position.set(ufo.position.x, ufo.position.y, ufo.position.z) 
      if (ufo.position.x <= -5) {
          ufoHitbox.position.x = ufo.position.x
          ufo.position.x = (Math.random() * 2 + 5);
          if(speed <= 20)
          {
            speed += 0.09
          }
      }
  });
  }

    if(gameover) {
      scene.remove(ufoHitbox)
    }


  if ((ufo !== null) & (ufoHitbox !== null) & (cosmonautMesh !== null) & (cosmonautAction !== null) & (action !== null) ) {
    
  
    // Collision
    const hitbox = new THREE.Box3().setFromObject(cosHitbox)
    const hitbox2 = new THREE.Box3().setFromObject(ufoHitbox)

    var collision = hitbox.intersectsBox(hitbox2)
    if(collision)
    {
        gameover = true
        replay.style.display = "flex"
        gsap.to('#replay', {
          duration: 2,
          ease: "Power2.easeOut",
          y: '117.5%',
        });
    }
  }

  if (mixer !== null) {
    mixer.update(deltaTime);
    
     }

  if (cosmonautMixer !== null) {
    cosmonautMixer.update(deltaTime * 1.3);
     if(gameover)
     {
      cosmonautAction.setLoop(THREE.LoopOnce)
      cosmonautAction = cosmonautMixer.clipAction(cosmonaut1.animations[2]);
      cosmonautAction.setLoop(THREE.LoopOnce)
      cosmonautAction.clampWhenFinished = true
      cosmonautAction.play();
      
     }
  }

  // Animation lune qui tourne
  
  moon.rotation.x = elapsedTime / 10
  moon.rotation.y = elapsedTime / 12
  moon.rotation.z = elapsedTime / 2

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
});