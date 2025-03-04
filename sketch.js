
let videoPlayer;
let hands;
let camera;
let lastSpeed = 1;
const speedFilter = 0.2;

function setup() {
    createCanvas(windowWidth, windowHeight);
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            console.log("摄像头权限已授予");
        })
        .catch((err) => {
            console.error("摄像头访问被拒绝：", err);
        });
    videoPlayer = createVideo('assets/Lettuce.mp4', () => {
        videoPlayer.size(width, height);
        videoPlayer.loop();
        videoPlayer.hide();
    });

    initHandTracking();
}

function draw() {
    background(0);
    if (videoPlayer) {
        image(videoPlayer, 0, 0, width, height);
    }
    console.log(hands);
}

function initHandTracking() {

    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });


    camera = createCapture(VIDEO);
    camera.size(320, 240);
    camera.hide();

    hands.onResults((results) => processHandData(results));

    setInterval(() => {
        if (camera.loadedmetadata) {
            hands.send({ image: camera.elt });
        }
    }, 100);
}

function processHandData(results) {
    if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) return;

    const landmarks = results.multiHandLandmarks[0];

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];

    const spread = dist(
        thumbTip.x * camera.width,
        thumbTip.y * camera.height,
        pinkyTip.x * camera.width,
        pinkyTip.y * camera.height
    );

    const palmSize = dist(
        wrist.x * camera.width,
        wrist.y * camera.height,
        landmarks[9].x * camera.width,
        landmarks[9].y * camera.height
    );
    console.log('palmSize:', palmSize.toFixed(1));

    const rawSpeed = map(palmSize, 20, 100, 0.1, 2, true);

    const smoothSpeed = lastSpeed * (1 - speedFilter) + rawSpeed * speedFilter;
    lastSpeed = smoothSpeed;

    if (videoPlayer) {
        videoPlayer.speed(constrain(smoothSpeed, 0.1, 2));
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (videoPlayer) {
        videoPlayer.size(width, height);
    }
}
