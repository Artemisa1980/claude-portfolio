import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

export interface GameProps {
  onExit: () => void;
}

/** Maps game ids from data.ts to lazy-loaded game components.
 *  A cabinet may only have ready:true if its id has an entry here. */
export const GAME_REGISTRY: Record<string, LazyExoticComponent<ComponentType<GameProps>>> = {
  'pac-toe': lazy(() => import('../components/PacToe')),
};
