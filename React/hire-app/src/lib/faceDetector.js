// Face detection with MediaPipe Tasks, loaded from a CDN at runtime so it doesn't bloat the bundle.
const VERSION = "1.0.1";
const BUNDLE = process.env.REACT_APP_MEDIAPIPE_BUNDLE || `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`;
const WASM = process.env.REACT_APP_MEDIAPIPE_WASM || `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL =
  process.env.REACT_APP_FACE_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise = null;

export function loadFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await import(/* webpackIgnore: true */ BUNDLE);
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
      return vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.6,
      });
    })().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
}

/** Number of faces in the current video frame, or null if it can't be determined. */
export function countFaces(detector, video) {
  if (!detector || !video || video.readyState < 2 || !video.videoWidth) return null;
  try {
    return detector.detectForVideo(video, performance.now()).detections.length;
  } catch {
    return null;
  }
}
