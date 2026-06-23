import { BookOpen, Crown, Play, Users } from 'lucide-react';

export const pageLinks = [
  {
    label: 'Game',
    path: '/game',
    description: 'Tela principal da partida.',
    icon: Play,
  },
  {
    label: 'Rooms',
    path: '/rooms',
    description: 'Criacao e gerenciamento de salas.',
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
