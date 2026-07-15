import { BookOpen, Crown, Play, Users } from 'lucide-react';

export const pageLinks = [
  {
    description: 'Create a Game and invite your friends to play.',
    descriptionKey: 'pages.links.createGame.description',
    icon: Play,
    label: 'Create a Game',
    labelKey: 'pages.links.createGame.label',
    path: '/classic/create-game',
  },
  {
    description: 'View and enter the rooms.',
    descriptionKey: 'pages.links.rooms.description',
    icon: Users,
    label: 'Rooms',
    labelKey: 'pages.links.rooms.label',
    path: '/classic/rooms',
  },
  {
    description: 'Player ranking.',
    descriptionKey: 'pages.links.leaderboard.description',
    icon: Crown,
    label: 'Leaderboard',
    labelKey: 'pages.links.leaderboard.label',
    path: '/classic/leaderboard',
  },
  {
    description: 'Rules and game guide.',
    descriptionKey: 'pages.links.howToPlay.description',
    icon: BookOpen,
    label: 'How To Play',
    labelKey: 'pages.links.howToPlay.label',
    path: '/classic/how-to-play',
  },
  {
    description: 'Project repository for Oh Hell Game v2',
    descriptionKey: 'pages.links.github.description',
    externalUrl: 'https://github.com/dannielzanoni/ohhell-game-v2',
    label: 'Github',
    labelKey: 'pages.links.github.label',
    path: '/classic/github',
    primeIcon: 'pi pi-github',
  },
];
