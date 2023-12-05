import * as THREE from 'three'

// Data and visualization
import { CompositionShader} from './shaders/CompositionShader.js'
import { BASE_LAYER, BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER } from "./config/renderConfig.js";

// Rendering
// import { MapControls } from 'three/addons/controls/OrbitControls.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Galaxy } from './objects/galaxy.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// import { happyValue } from './face.js';

let canvas,renderer, camera, scene, orbit, baseComposer, bloomComposer, overlayComposer


let frameCount = 0;
const detectionInterval = 5; // Run face detection every 5 frames

let happyValue, neutralValue, sadValue;
let faceapi;
let detections = [];
// let happyValue;

///////////////////////////////////////- face.js
let myp5

function setup() {
    let sketch = function(p){
    p.setup = function(){
    let canvas2 = p.createCanvas(480, 360);
    canvas2.id("canvas2");
  
  let video = p.createCapture(p.VIDEO);
  video.id("video");
  video.size(p.width, p.height);
  video.hide()

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5
  };

  faceapi = ml5.faceApi(video, faceOptions, faceReady);
}

function faceReady() {
  faceapi.detect(gotFaces);
}

//draw faces
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }

  // // Call faceapi.detect again if needed
  // faceapi.detect(gotFaces);

  // Only process results at the specified interval
  if (frameCount % detectionInterval === 0) {
    if (result && result.length > 0 && result[0].expressions) {
      detections = result;
      happyValue = detections[0].expressions.happy;
      sadValue = detections[0].expressions.sad;
      neutralValue = detections[0].expressions.neutral;
      console.log("Happy Value:", happyValue,"Neutral Value:", neutralValue,"Sad Value:", sadValue); // Log happyValue at intervals


////////////////////////////////// - galaxychanging
      galaxy.updateStarVisibility(happyValue,sadValue,neutralValue);
      galaxy.updateStarColor(happyValue,sadValue,neutralValue,2000);
      
    } else {
      console.log("No valid detections found.");
    }
  }
  // Increment the frame counter
  frameCount++;
  // Always call faceapi.detect again for continuous detection
  faceapi.detect(gotFaces);
  
}
    }
    myp5=new p5(sketch)
}


//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------

function initThree() {

    // grab canvas
    canvas = document.querySelector('#canvas');
    
    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);

    // camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 5000000 );
    camera.position.set(0, 500, 500);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);


    // map orbit
    orbit = new OrbitControls(camera, canvas)
    orbit.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    orbit.dampingFactor = 0.05;
    orbit.screenSpacePanning = true;
    orbit.minDistance = 1;
    orbit.maxDistance = 1000;
    orbit.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)
    orbit.autoRotate = true;
    orbit.autoRotateSpeed = 0.5
    
    setup()

    initRenderPipeline()

}

function initRenderPipeline() {

    // Assign Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        logarithmicDepthBuffer: true,
    })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    // General-use rendering pass for chaining
    const renderScene = new RenderPass( scene, camera )

    // Rendering pass for bloom
    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 )
    bloomPass.threshold = BLOOM_PARAMS.bloomThreshold
    bloomPass.strength = BLOOM_PARAMS.bloomStrength
    bloomPass.radius = BLOOM_PARAMS.bloomRadius

    // bloom composer
    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    // overlay composer
    overlayComposer = new EffectComposer(renderer)
    overlayComposer.renderToScreen = false
    overlayComposer.addPass(renderScene)

    // Shader pass to combine base layer, bloom, and overlay layers
    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial( {
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture },
                overlayTexture: { value: overlayComposer.renderTarget2.texture }
            },
            vertexShader: CompositionShader.vertex,
            fragmentShader: CompositionShader.fragment,
            defines: {}
        } ), 'baseTexture'
    );
    finalPass.needsSwap = true;

    // base layer composer
    baseComposer = new EffectComposer( renderer )
    baseComposer.addPass( renderScene )
    baseComposer.addPass(finalPass)
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
}

///text function
// function drawText(text, x, y, ctx) {
//   ctx.font = '20px Arial';
//   ctx.fillStyle = 'white';
//   ctx.textAlign = 'center';
//   ctx.fillText(text, x, y);
// }

async function render() {

    orbit.update()
    
    
    // console.log(happyValue)
    // fix buffer size
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    // fix aspect ratio
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();




//could be modified!!!
    galaxy.updateScale(camera)
    // galaxy.increaseStarsOverTime(2000,10000)


    // Run each pass of the render pipeline
    renderPipeline()
    requestAnimationFrame(render)
    TWEEN.update();

    // const ctx = renderer.getContext();

    // Draw text
    // drawText('Use your mouse to navigate', window.innerWidth / 2, 30, ctx);
}

function renderPipeline() {

    // Render bloom
    camera.layers.set(BLOOM_LAYER)
    bloomComposer.render()

    // Render overlays
    camera.layers.set(OVERLAY_LAYER)
    overlayComposer.render()

    // Render normal
    camera.layers.set(BASE_LAYER)
    baseComposer.render()

}

initThree()
let axes = new THREE.AxesHelper(5.0)
scene.add(axes)

let galaxy = new Galaxy(scene)
requestAnimationFrame(render)