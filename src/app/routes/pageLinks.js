import { BookOpen, Code2, Crown, Menu, Play, Users } from 'lucide-react';

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
    label: 'View Rooms',
    path: '/view-rooms',
    description: 'Lista de salas disponiveis.',
    icon: Menu,
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
    icon: Code2,
  },
];
