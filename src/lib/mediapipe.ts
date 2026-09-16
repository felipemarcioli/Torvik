const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";

let loader: Promise<any> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script error")));
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.crossOrigin = "anonymous";
    el.async = true;
    el.onload = () => {
      el.dataset.loaded = "true";
      resolve();
    };
    el.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(el);
  });
}

/** Loads the MediaPipe Pose solution from the CDN and returns a configured instance. */
export async function createPose(): Promise<any> {
  if (!loader) {
    loader = loadScript(`${POSE_CDN}/pose.js`).catch((err) => {
      loader = null;
      throw err;
    });
  }
  await loader;
  const PoseCtor = (window as any).Pose;
  if (!PoseCtor) throw new Error("MediaPipe Pose indisponível neste navegador.");
  const pose = new PoseCtor({ locateFile: (file: string) => `${POSE_CDN}/${file}` });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  return pose;
}
