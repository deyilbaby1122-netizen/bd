/* Ashraf's 3D Interactive Portfolio - Main Page */
/* Vercel-ready: server-rendered page shell with client-only 3D canvas */

import dynamic from 'next/dynamic';

// Dynamic import WITHOUT ssr: false — Next.js will attempt SSR on the server
// but the ThreeDPortfolio component handles it gracefully with useEffect and
// only renders the canvas on the client where browser APIs are available.
const DynamicCanvas = dynamic(() => import('./components/ThreeDPortfolio'), {
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div className="text-center text-white">
      <div className="text-4xl mb-4">🚗</div>
      <p className="text-lg">Loading 3D world...</p>
    </div>
  </div>,
});

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <DynamicCanvas />
    </main>
  );
}
