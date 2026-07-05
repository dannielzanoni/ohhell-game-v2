import { BookOpen, Crown, Play, Users } from 'lucide-react';
import { routePaths } from './routeContract.js';

export const pageLinks = [
  {
    description: 'Create a Game and invite your friends to play.',
    descriptionKey: 'pages.links.createGame.description',
    icon: Play,
    label: 'Create a Game',
    labelKey: 'pages.links.createGame.label',
    path: routePaths.createGame,
  },
  {
    description: 'View and enter the rooms.',
    descriptionKey: 'pages.links.rooms.description',
    icon: Users,
    label: 'Rooms',
    labelKey: 'pages.links.rooms.label',
    path: routePaths.rooms,
  },
  {
    description: 'Player ranking.',
    descriptionKey: 'pages.links.leaderboard.description',
    icon: Crown,
    label: 'Leaderboard',
    labelKey: 'pages.links.leaderboard.label',
    path: routePaths.leaderboard,
  },
  {
    description: 'Rules and game guide.',
    descriptionKey: 'pages.links.howToPlay.description',
    icon: BookOpen,
    label: 'How To Play',
    labelKey: 'pages.links.howToPlay.label',
    path: routePaths.howToPlay,
  },
  {
    description: 'Project repository for Oh Hell Game v2',
    descriptionKey: 'pages.links.github.description',
    externalUrl: 'https://github.com/dannielzanoni/ohhell-game-v2',
    label: 'Github',
    labelKey: 'pages.links.github.label',
    path: routePaths.github,
    primeIcon: 'pi pi-github',
  },
];
