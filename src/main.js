import * as THREE from "three";

import { throttle } from 'throttle-debounce';
import Stats from "three/addons/libs/stats.module.js";
import { BoxLineGeometry } from "three/addons/geometries/BoxLineGeometry.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { HTMLMesh } from "three/addons/interactive/HTMLMesh.js";
import { InteractiveGroup } from "three/addons/interactive/InteractiveGroup.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeMeshUI, { Block } from "three-mesh-ui";
import { algoGUI, updateButtons } from "./threegui";
import VRControl from "./utils/VRControl.js";
import { RRT } from "./rrt";
import { RRTStar } from "./rrtstar";

let camera, scene, renderer, loader, stats, statsMesh, raycaster, controls, dolly;

let thirdPersonCamera;
let INTERSECTED;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let room;

// BACK FACE CULLING EINFUEGEN FUER DEN HINTERGRUND
// Wuerfel auch hintergrund geben. 
// Initialize gamepad variables
let gamepad;
let gamepadAxes;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let obsticals, obsticalhitboxes ,vrControl;
let positionBeforePress = new THREE.Vector3();

let rrt;

const clock = new THREE.Clock();

init();
animate();

function init() {
  raycaster = new THREE.Raycaster();

  stats = new Stats();
  document.body.appendChild(stats.dom);

  loader = new FontLoader();

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x505050);

  thirdPersonCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.001,
    1000
  );

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  room = new THREE.LineSegments(
    new BoxLineGeometry(6, 6, 6, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: 0x808080 })
  );
  room.geometry.translate(0, 3, 0);
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  document.body.appendChild(renderer.domElement);

  //

  document.body.appendChild(VRButton.createButton(renderer));

  /* dolly = new THREE.Object3D();
  dolly.position.set(0,1.6,0);
  dolly.add ( camera)
  scene.add( dolly )

  const dummyCam = new THREE.Object3D( dolly )
  camera.add ( dummyCam );
  thirdPersonCamera.add (dummyCam); 
  // Orbit controls for no-vr
*/
  controls = new OrbitControls(thirdPersonCamera, renderer.domElement);
  
    camera.position.set(0,5,10);
  controls.target = new THREE.Vector3(0,2.5,0);

  vrControl = VRControl(renderer);

  //handle controller 1


 // dolly.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
 
 scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
  
    //select button
  vrControl.controllers[0].addEventListener("select", (event) => {
    console.log(event);
  });
  vrControl.controllers[0].addEventListener("selectstart", (event) => {
    vrControl.controllers[0].userData.selected = true;
  });
  vrControl.controllers[0].addEventListener("selectend", (event) => {
    vrControl.controllers[0].userData.selected = false;
  });

  //squezze button
  vrControl.controllers[0].addEventListener("squeezestart", (event) => {
    console.log(event);
  });

  vrControl.controllers[0].addEventListener("squeeze", (event) => {
    console.log(event);
  });
  vrControl.controllers[0].addEventListener("squeezeend", (event) => {
    console.log(event);
  });
  //else
  vrControl.controllerGrips[0].addEventListener("connected", (event) => {
    console.log(event.data.gamepad);
  });

  //handle controller 2
//  dolly.add(vrControl.controllerGrips[1], vrControl.controllers[1]);
    scene.add(vrControl.controllerGrips[1], vrControl.controllers[1]);
  //select button
  vrControl.controllers[1].addEventListener("select", (event) => {
    console.log(event);
  });
  vrControl.controllers[1].addEventListener("selectstart", (event) => {
    vrControl.controllers[1].userData.selected = true;
    console.log(vrControl.controllers[1].userData)
    let pos = new THREE.Vector3;
    pos.copy(vrControl.controllers[1].position);
   //  pos.y += dolly.position.y;
    positionBeforePress.copy(pos);

  });
  vrControl.controllers[1].addEventListener("selectend", () => {
    vrControl.controllers[1].userData.selected = false;
    let pos = new THREE.Vector3;
    pos.copy(vrControl.controllers[1].position);
   //  pos.y += dolly.position.y;
    Convert2postobox(positionBeforePress, pos);
  });
  //squezze button
  vrControl.controllers[1].addEventListener("squeezestart", (event) => {});

  vrControl.controllers[1].addEventListener("squeeze", (event) => {
    const obj = getIntersections(vrControl.controllers[1]);
    if (obj[0]!= null) {
      obsticals.remove(obj[0].object);

      obsticals.children.forEach(obje => {

        console.log(obj[0].object.userData.connection)
        console.log(obje.uuid)
      
        if(obje.uuid === obj[0].object.userData.connection){
          obsticals.remove(obje);
          } 
      })
        
  };
})

  vrControl.controllers[1].addEventListener("squeezeend", (event) => {});
  //else
  vrControl.controllerGrips[1].addEventListener("connected", (event) => {
    console.log(event.data.gamepad);
  });

  window.addEventListener("resize", onWindowResize);

  obsticalhitboxes = new THREE.Group();
  obsticals = new THREE.Group();

  const obst = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2 ,32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  obst.position.set(2,0.1,2);
  obst.updateMatrixWorld();
  obsticals.add(obst)

  const obst2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  obst2.position.set(-2, 0.45, -2);
  obst2.updateMatrixWorld();
  obsticals.add(obst2)
 
  const obst3 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }))
  obst3.position.set(-1.5,2.5,1);
  obst3.updateMatrixWorld()
  obsticals.add(obst3)

  const box = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }))
  box.position.set(0,1,0);
  box.updateMatrixWorld();
 // obsticals.add(obst)
  //obsticals.add(box)
  
   scene.add(obsticals)
  algoGUI(scene, obsticals);


  let rrtcanvas = new THREE.Group;

  const start = [-1, 2, 3];
  const goal = [-2, 2, 0];
  const maxStepSize = 0.2;
  const maxStepCount = 1000;
  const range = 6;

   rrt = new RRT(start, goal, obsticals, maxStepSize, maxStepCount, range, rrtcanvas);

  // rrt.findPath();
  
  // rrt.visualize();

  // rrt.addNodes(1000);

  const rrtstar = new RRTStar(start, goal, obsticals, maxStepSize, maxStepCount, range, rrtcanvas);


 

  console.log("1")
  
  // rrtstar.findPath();

 // rrtstar.addNodes(10)
  
  // rrtstar.visualize();

  scene.add(rrtcanvas);
 
}

function handlecontrollers(controller) {
  //console.log(controller.userData);
  if (controller.userData.selected) {
    let pos = new THREE.Vector3;
    pos.copy(vrControl.controllers[1].position);
  //  pos.y += dolly.position.y;
    Objectplacementindicator(positionBeforePress, pos);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function intersectObjects(controller) {
  if (controller.userData.targetRayMode === "screen") return;

  if (controller.userData.selected !== false) return;

  const line = controller.getObjectByName("line");

  const intersections = getIntersections(controller);
  //console.log(intersections)

  if (intersections.length > 0) {
    //console.log(intersections)
    const intersection = intersections[0];

    
    const object = intersection.object;
    //console.log(object);
    object.material.emissive.r = 1;
    intersected.push(object);
  } else {

  }
}

function getIntersections(controller) {
  controller.updateMatrixWorld();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  //console.log(tempMatrix);
  //console.log(controller);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  return raycaster.intersectObjects(obsticals.children, true);
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.r = 0;
  }
}

function Convert2postobox(startingPoint, endPoint) {

  //console.log(startingPoint, endPoint);
  startingPoint.y = endPoint.y; 

  const midpoint = new THREE.Vector3()
    .addVectors(startingPoint, endPoint)
    .multiplyScalar(0.5);
  const distance = startingPoint.distanceTo(endPoint);

  const geometries = [
    new THREE.BoxGeometry(distance, distance, distance),
    new THREE.CircleGeometry(distance, 32),
    new THREE.ConeGeometry(0.2, 0.2, 64),
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
    new THREE.IcosahedronGeometry(0.2, 8),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32),
  ];

   //const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
  const geometry = geometries[1];
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  object.position.set(midpoint.x,0,midpoint.z);
  object.rotateX(Math.PI/2)
 // console.log(object)
 object.userData.connection = tempobjectplacement.uuid;
 tempobjectplacement.userData.connection = object.uuid;

 console.log(object.userData)
 console.log(tempobjectplacement.userData)
 object.visible = false;
  obsticals.add(object)
  obsticals.add(tempobjectplacement);

}

let tempobjectplacement;
let tempobjectplacement2;

function Objectplacementindicator(startingPoint, endPoint) {
  if(tempobjectplacement || tempobjectplacement2){
    scene.remove(tempobjectplacement)
    scene.remove(tempobjectplacement2)
  }


  const flatstartpoint = new THREE.Vector3
  flatstartpoint.copy(startingPoint);
  flatstartpoint.y = endPoint.y;
  
  const midpoint = new THREE.Vector3()
    .addVectors(flatstartpoint, endPoint)
    .multiplyScalar(0.5);
  
  const distance = flatstartpoint.distanceTo(endPoint);

  const geometries = [
    new THREE.BoxGeometry(distance, distance, distance),
    new THREE.CircleGeometry(distance, 32),
    new THREE.CylinderGeometry(distance, distance, endPoint.y, 64),
  ];

  const circlegeometry = geometries[1];
  const material = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.1,
  });

  const circle = new THREE.Mesh(circlegeometry, material);
  circle.position.set(midpoint.x,endPoint.y,midpoint.z); // in case circle
  circle.rotateX(Math.PI/2) // only rotate when circle
  // tempobjectplacement = circle;
  // scene.add(tempobjectplacement)


  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(distance, distance, endPoint.y, 64), material);

  const cylidnermidpoint = startingPoint.distanceTo(endPoint);

  cylinder.position.set(midpoint.x,endPoint.y/2,midpoint.z);
  tempobjectplacement = cylinder;

  scene.add(tempobjectplacement);
  
}


const throttleFunc = throttle(
	100,
	(num) => {
		rrt.addNodes(1)
	},
	{ noLeading: false, noTrailing: false }
);


function animate() {
  renderer.setAnimationLoop(render);
}

let time = 0;
function render() {

  time += clock.getDelta();
  ThreeMeshUI.update();
  cleanIntersected();
  updateButtons(renderer, vrControl, 0);
  // updateButtons(renderer, vrControl, 1);
  intersectObjects(vrControl.controllers[0]);
  intersectObjects(vrControl.controllers[1]);
  handlecontrollers(vrControl.controllers[1]);
  // UpdateVrControl(vrControl.controllers[1])
  
   throttleFunc();

  stats.update();
  controls.update();

renderer.render(scene, thirdPersonCamera);
// ... then conditionally render the spectator view
if (renderer.xr.isPresenting){
    // Copy the XR Camera's position and rotation, but use your
    // main camera's projection matrix
   /* 
    const xrCam = renderer.xr.getCamera(camera);
    thirdPersonCamera.projectionMatrix.copy(camera.projectionMatrix);
    thirdPersonCamera.position.copy(xrCam.position);
    thirdPersonCamera.quaternion.copy(xrCam.quaternion);
    */
    // we'll restore this later
    const currentRenderTarget = renderer.getRenderTarget();

    // turn off the WebXR rendering
    renderer.xr.isPresenting = false;

    // render to the canvas on our main display
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // reset back to enable WebXR
    renderer.setRenderTarget(currentRenderTarget);
    renderer.xr.isPresenting = true;
}

 // console.log(clock.getDelta())
renderer.setScissorTest(false);
}
