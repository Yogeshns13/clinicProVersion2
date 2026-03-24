import { useEffect, useRef } from "react";

const css = `
  .lp-overlay {
    position: fixed;
    top: 0;
    bottom: 30px;
    right: 0;
    left: var(--lp-sidebar, 240px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    background: var(--lp-bg, #ffffff);
  }

  .lp-canvas-wrap {
    position: relative;
    width: 360px;
    height: 120px;
  }

  .lp-canvas-wrap canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

export default function LoadingPage({ bg = "#ffffff", sidebarWidth = "240px" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 360, H = 120;
    const CY = H / 2;
    const SPEED = 1.8;
    const HEART_COLOR = "#30b2b5";
    const WAVE_COLOR = "#207d9c";
    let offset = 0;
    let lastPeak = false;
    let heartScale = 1;
    let rafId;

    function ecgY(x) {
      const cycle = 280;
      const t = ((x % cycle) + cycle) % cycle;
      if (t < 60)  return 0;
      if (t < 70)  return -(t - 60) * 0.6;
      if (t < 80)  return (t - 70) * 0.6;
      if (t < 90)  return 0;
      if (t < 100) return -(t - 90) * 4.5;
      if (t < 110) return 45 - (t - 100) * 9;
      if (t < 120) return -45 + (t - 110) * 4.5;
      if (t < 140) return (t - 120) * 0.8;
      if (t < 160) return 16 - (t - 140) * 0.8;
      return 0;
    }

    function drawHeart(cx, cy, scale, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(0, -14, -12, -14, -12, -5);
      ctx.bezierCurveTo(-12, 2, 0, 10, 0, 14);
      ctx.bezierCurveTo(0, 10, 12, 2, 12, -5);
      ctx.bezierCurveTo(12, -14, 0, -14, 0, -8);
      ctx.closePath();
      ctx.fillStyle = HEART_COLOR;
      ctx.shadowColor = "rgba(48,178,181,0.5)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      offset += SPEED;

      // Draw pulse line
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = CY + ecgY(x + offset);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = WAVE_COLOR;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(32,125,156,0.3)";
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Heart rides at front of the line
      const heartX = 280;
      const heartY = CY + ecgY(heartX + offset);
      const cycle = 280;
      const t = ((heartX + offset) % cycle + cycle) % cycle;
      const onPeak = t > 90 && t < 130;
      if (onPeak && !lastPeak) heartScale = 1.45;
      lastPeak = onPeak;
      heartScale += (1 - heartScale) * 0.15;

      drawHeart(heartX, heartY, heartScale, 1);

      // Ghost trails behind heart
      for (let i = 1; i <= 3; i++) {
        const gx = heartX - i * 60;
        const gy = CY + ecgY(gx + offset);
        drawHeart(gx, gy, 0.55, 0.12 - i * 0.03);
      }

      rafId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <style>{css}</style>
      <div
        className="lp-overlay"
        style={{ "--lp-bg": bg, "--lp-sidebar": sidebarWidth }}
      >
        <div className="lp-canvas-wrap">
          <canvas ref={canvasRef} width={360} height={120} />
        </div>
      </div>
    </>
  );
}