'use client';

import { lazy, Suspense } from 'react';

const SplineComponent = lazy(() =>
  import('@splinetool/react-spline/next')
);

export default function SplineWrapper({ scene }: { scene: string }) {
  return (
    <Suspense fallback={<div className="w-full h-full bg-transparent" />}>
      <SplineComponent scene={scene} />
    </Suspense>
  );
}
