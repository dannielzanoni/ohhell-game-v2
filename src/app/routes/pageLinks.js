import { BookOpen, Crown, Play, Users } from 'lucide-react';

export const pageLinks = [
  {
    label: 'Create a Game',
    path: '/create-game',
    description: 'Create a Game and invite your friends to play.',
    icon: Play,
  },
  {
    label: 'Rooms',
    path: '/rooms',
    description: 'View and enter the rooms.',
    icon: Users,
  },
  {
    label: 'Leaderboard',
    path: '/leaderboard',
    description: 'Ranking dos jogadores.',
    icon: Crown,
  },
  {
    label: 'How To Play',
    path: '/how-to-play',
    description: 'Regras e guia do jogo.',
    icon: BookOpen,
  },
  {
    label: 'Github',
    path: '/github',
    description: 'Repositório do projeto Oh Hell Game v2',
    externalUrl: 'https://github.com/dannielzanoni/ohhell-game-v2',
    primeIcon: 'pi pi-github',
  },
];
