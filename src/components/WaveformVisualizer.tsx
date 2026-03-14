'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode;
  /** Color of the waveform line */
  color?: string;
  /** Background fill color (use 'transparent' for none) */
  backgroundColor?: string;
  height?: number;
}

/**
 * Real-time waveform visualizer using Web Audio API AnalyserNode.
 * Renders a time-domain oscilloscope-style waveform.
 */
export function WaveformVisualizer({
  analyserNode,
  color = '#D4623A',
  backgroundColor = 'transparent',
  height = 72,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      const { width, height: h } = canvas;

      ctx.clearRect(0, 0, width, h);

      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, h);
      }

      // Draw outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(width, h / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className="w-full"
      style={{ height }}
    />
  );
}
