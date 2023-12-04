let frameCount = 0;
const detectionInterval = 5; // Run face detection every 5 frames

let happyValue;
let faceapi;
let detections = [];
// let happyValue;

let video;

function setup() {
  canvas = createCanvas(480, 360);
  canvas.id("canvas2");
  
  video = createCapture(VIDEO);
  video.id("video");
  video.size(width, height);
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
      console.log("Happy Value:", happyValue); // Log happyValue at intervals


////////////////////////////////// - galaxychanging
      galaxy.updateStarVisibility(happyValue);



    } else {
      console.log("No valid detections found.");
    }
  }

  // Increment the frame counter
  frameCount++;

  // Always call faceapi.detect again for continuous detection
  faceapi.detect(gotFaces);
  
}

