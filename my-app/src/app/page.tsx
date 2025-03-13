import dynamic from 'next/dynamic';

const DynamicGameClient = dynamic(
  () => import('../components/GameClient'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <div className="min-h-screen">
      <DynamicGameClient />
    </div>
  );
}
