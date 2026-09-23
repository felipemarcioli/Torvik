import { POSE_CONNECTIONS, VIS_THRESHOLD, type Landmark } from "./biomech";
export function drawPose(
  canvas: HTMLCanvasElement,
  landmarks: Landmark[],
  width: number,
  height: number,
) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const usable = (p: Landmark | undefined): p is Landmark =>
    !!p && p.visibility >= VIS_THRESHOLD && Number.isFinite(p.x) && Number.isFinite(p.y);
  ctx.lineWidth = Math.max(2, width / 320);
  ctx.strokeStyle = "#68b5ff";
  for (const [a, b] of POSE_CONNECTIONS) {
    const p = landmarks[a],
      q = landmarks[b];
    if (!usable(p) || !usable(q)) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * width, p.y * height);
    ctx.lineTo(q.x * width, q.y * height);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffad55";
  for (const p of landmarks) {
    if (!usable(p)) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, Math.max(3, width / 260), 0, Math.PI * 2);
    ctx.fill();
  }
}
