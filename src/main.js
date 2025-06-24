import './style.css';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@mediapipe/hands';

document.querySelector('#app').innerHTML = `
  <h1>Let's play!</h1>
  <div id="player" style="position: relative;">
    <video id="video-element" autoplay playsinline style="position: absolute; top: 0; left: 0;"></video>
    <canvas id="canvas" style="position: absolute; top: 0; left: 0;"></canvas>
  </div>
  <div id="bot"></div>
`;

const video = document.getElementById('video-element');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// getting webcam video and matching canvas with it
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve();
    };
  });
}

// loading model and starting detecting
async function loadHandDetector() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;

  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'lite',
    maxHands: 1
  };

  const detector = await handPoseDetection.createDetector(model, detectorConfig);

  const detect = async () => {
    const hands = await detector.estimateHands(video);
    drawKeypoints(hands);
    requestAnimationFrame(detect);
  };

  detect();
}

// drawing keypoints
const drawKeypoints = (hands) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hands.forEach((hand) => {
    const landmarks = hand.keypoints;

    //hand gesture logic
    //rock -> all fingers pip.y > tip.y (false, false false, false)
    //paper -> all fingers pip.y < tip.y (true, true, true, true)
    //scissors -> index and middle fingers pip.y < tip.y, ring and pinky fingers pip.y > tip.y (true, true, false, false)
    hands.forEach((hand) => {
      const landmarks = hand.keypoints;
    
      const extendedFingers = {
        index: landmarks[8].y < landmarks[6].y,
        middle: landmarks[12].y < landmarks[10].y,
        ring: landmarks[16].y < landmarks[14].y,
        pinky: landmarks[20].y < landmarks[18].y,
      };

      function detectGesture(extendedFingers) {
        const { index, middle, ring, pinky } = extendedFingers;
      
        if (!index && !middle && !ring && !pinky) {
          return 'rock';
        }
      
        if (index && middle && ring && pinky) {
          return 'paper';
        }
      
        if (index && middle && !ring && !pinky) {
          return 'scissors';
        }
      
        // if func doesn't match any known gesture
        return 'unknown';
      }
  
      const gesture = detectGesture(extendedFingers);
    });

    // draw keypoints
    landmarks.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'lime';
      ctx.fill();
    });

    //draw lines
    const fingers = {
      thumb: [0, 1, 2, 3, 4],
      index: [0, 5, 6, 7, 8],
      middle: [0, 9, 10, 11, 12],
      ring: [0, 13, 14, 15, 16],
      pinky: [0, 17, 18, 19, 20]
    };

    Object.values(fingers).forEach((points) => {
      for (let i = 0; i < points.length - 1; i++) {
        const from = landmarks[points[i]];
        const to = landmarks[points[i + 1]];

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });
};

// initializing
setupCamera().then(loadHandDetector);



