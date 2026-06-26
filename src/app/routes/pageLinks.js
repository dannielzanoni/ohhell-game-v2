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
    description: 'Links e informacoes do repositorio.',
    primeIcon: 'pi pi-github',
  },
  {
    label: 'Settings',
    path: '/settings',
    description: 'Preferencias e configuracoes do jogo.',
    primeIcon: 'pi pi-cog',
  },
];
