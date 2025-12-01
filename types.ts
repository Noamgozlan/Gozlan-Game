
export enum Category {
  MOVIES = 'Movies',
  TV_SHOWS = 'TV Shows',
  TV_ACTORS = 'TV Show Actors',
  FOOTBALL_PLAYERS = 'Football Players',
}

export type Language = 'en' | 'he';

export interface Player {
  id: number;
  name: string;
  isImpostor: boolean;
}

export enum GamePhase {
  SETUP = 'SETUP',
  FETCHING = 'FETCHING',
  TURN_REVEAL = 'TURN_REVEAL',
  DISCUSSION = 'DISCUSSION',
  RESULTS = 'RESULTS',
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  category: Category;
  secretWord: string;
  currentPlayerIndex: number;
  impostorIndex: number;
  roundCount: number;
}
