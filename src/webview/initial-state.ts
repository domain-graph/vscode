import { SaveState } from 'domain-graph';

export type InitialState = {
  documentText: string | null;
  state: SaveState | null;
};

declare global {
  // eslint-disable-next-line no-shadow
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    $INITIAL_STATE: string | undefined;
  }
}

export function getInitialState(): InitialState {
  let documentText: string | null = null;
  let saveState: SaveState | null = null;

  if (typeof window.$INITIAL_STATE === 'string') {
    try {
      const state = JSON.parse(decodeURIComponent(window.$INITIAL_STATE));
      documentText =
        typeof state?.documentText === 'string' ? state.documentText : null;
      saveState = state?.state || null;
    } catch (ex) {
      console.error(ex);
    }
  }
  return { documentText, state: saveState };
}
