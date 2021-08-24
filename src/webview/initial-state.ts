export type InitialState = {
  documentText: string | null;
};

declare global {
  // eslint-disable-next-line no-shadow
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    $INITIAL_STATE: string | undefined;
  }
}

export function getInitialState(): InitialState {
  console.log('calling getInitialState');
  let documentText: string | null = null;

  console.log('window.$INITIAL_STATE', window.$INITIAL_STATE);
  if (typeof window.$INITIAL_STATE === 'string') {
    try {
      const state = JSON.parse(decodeURIComponent(window.$INITIAL_STATE));
      documentText =
        typeof state?.documentText === 'string' ? state.documentText : null;
    } catch (ex) {
      console.error(ex);
    }
  }
  return { documentText };
}
