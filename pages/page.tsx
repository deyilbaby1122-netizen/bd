/*
 * Ashraf's 3D Interactive Portfolio - Main Page
 * Built with Next.js App Router and React Three Fiber
 */
import dynamic from 'next/dynamic';

const DynamicCanvas = dynamic(() => import('./components/ThreeDPortfolio'), {
  ssr: false,
  loading: () => <span>Loading...</span>
});

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <DynamicCanvas />
    </main>
  );
}