"use client";

import { useRef, useState } from "react";
import { Button } from "./ui";

export function SignaturePad({
  onSave,
  pending,
}: {
  onSave: (dataUrl: string) => void;
  pending?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = pointerPosition(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPosition(event);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        className="touch-none rounded-lg border border-border bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" onClick={clear} disabled={pending}>
          Limpar
        </Button>
        <Button
          type="button"
          disabled={!hasDrawn || pending}
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            onSave(canvas.toDataURL("image/png"));
          }}
        >
          {pending ? "Salvando…" : "Confirmar assinatura"}
        </Button>
      </div>
    </div>
  );
}
