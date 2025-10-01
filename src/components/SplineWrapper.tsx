'use client';

import { useEffect, useRef, useState } from 'react';

export default function SplineWrapper({ scene }: { scene: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let splineApp: any;

    const loadSpline = async () => {
      try {
        // Dynamically import Spline
        const { Application } = await import('@splinetool/runtime');

        if (canvasRef.current) {
          splineApp = new Application(canvasRef.current);
          await splineApp.load(scene);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Spline:', error);
      }
    };

    loadSpline();

    return () => {
      if (splineApp) {
        splineApp.dispose();
      }
    };
  }, [scene]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white/50">Loading...</div>
        </div>
      )}
    </>
  );
}
