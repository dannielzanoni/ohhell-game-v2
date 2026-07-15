import { useParams } from 'react-router-dom';
import { lazyNamed } from '@/shared/lib/lazyNamed.js';

const HellHandHomePage = lazyNamed(() => import('./pages/HellHandHomePage.jsx'), 'HellHandHome');
const CreateHellHandGamePage = lazyNamed(
  () => import('./pages/CreateHellHandGamePage.jsx'),
  'HellHandGame',
);
const HellHandGamePage = lazyNamed(
  () => import('./pages/HellHandGamePage.jsx'),
  'HellHandGamePage',
);
const HellHandRoomsPage = lazyNamed(
  () => import('./pages/HellHandRoomsPage.jsx'),
  'HellHandRooms',
);
const HellHandHowToPlayPage = lazyNamed(
  () => import('./pages/HellHandHowToPlayPage.jsx'),
  'HellHandHowToPlay',
);
const MercenariesPage = lazyNamed(
  () => import('./mercenaries/MercenariesPage.jsx'),
  'Mercenaries',
);
const MercenaryProfilePage = lazyNamed(
  () => import('./mercenaries/MercenaryProfilePage.jsx'),
  'CharacterProfile',
);

function MercenaryProfileRoute() {
  const { mercenaryId } = useParams();

  return <MercenaryProfilePage characterId={mercenaryId} />;
}

export const hellHandRouteChildren = [
  { index: true, element: <HellHandHomePage /> },
  { path: 'create-game', element: <CreateHellHandGamePage /> },
  { path: 'game/:lobbyId', element: <HellHandGamePage /> },
  { path: 'rooms', element: <HellHandRoomsPage /> },
  { path: 'how-to-play', element: <HellHandHowToPlayPage /> },
  { path: 'mercenaries', element: <MercenariesPage /> },
  { path: 'mercenaries/:mercenaryId', element: <MercenaryProfileRoute /> },
];
