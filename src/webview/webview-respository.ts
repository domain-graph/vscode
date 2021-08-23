import { SaveState, SaveStateRepository } from 'domain-graph';
import { WebviewApi } from 'vscode-webview';

export class WebviewRepository implements SaveStateRepository {
  constructor(private readonly vscode: WebviewApi<Record<string, SaveState>>) {}

  async has(id: string): Promise<boolean> {
    // const { getState } = this.vscode;
    // return !!getState()?.[id];

    return true;
  }

  async get(id: string): Promise<SaveState> {
    const { getState } = this.vscode;

    const state = getState()?.[id];

    console.log({ state });

    return (
      state || {
        canvas: {
          scale: 1,
          x: 0,
          y: 0,
        },
        graph: {
          visibleNodes: {},
        },
      }
    );
  }

  async set(id: string, state: SaveState): Promise<void> {
    const { getState, setState } = this.vscode;
    console.log({ state });
    setState({ ...getState(), [id]: state });
  }

  async delete(id: string): Promise<void> {
    const { getState, setState } = this.vscode;
    const prevState = getState();
    if (prevState) {
      const { [id]: _, ...newState } = prevState;
      setState(newState);
    }
  }
}
