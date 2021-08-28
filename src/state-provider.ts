import type { SaveState } from 'domain-graph';
import type TypedEmitter from 'typed-emitter';
import type { Memento } from 'vscode';

import EventEmitter from 'events';
import * as uuid from 'uuid';

export interface StoreEvents {
  state: (state: SaveState) => void;
}

const store = new EventEmitter() as TypedEmitter<{
  state: (documentUri: string, nonce: string, state: SaveState) => void;
}>;

export interface IStateProvider extends TypedEmitter<StoreEvents> {
  set(state: SaveState): void;
  get(documentUri: string): SaveState | undefined;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export class StateProvider extends EventEmitter implements IStateProvider {
  private constructor(
    private readonly documentUri: string,
    private readonly localStorage: Memento,
  ) {
    super();

    this.handleEvent = (
      incommingDocumentId: string,
      incommingNonce: string,
      state: SaveState,
    ) => {
      if (
        incommingDocumentId === this.documentUri &&
        incommingNonce !== this.nonce
      ) {
        this.emit('state', state);
      }
    };

    store.addListener('state', this.handleEvent);
  }

  private _isEmitting = true;

  public pause() {
    this._isEmitting = false;
  }

  public resume() {
    this._isEmitting = true;
  }

  private readonly handleEvent: (
    documentUri: string,
    nonce: string,
    state: SaveState,
  ) => void;

  private readonly nonce: string = uuid.v4();

  public set(state: SaveState) {
    if (this._isEmitting) {
      store.emit('state', this.documentUri, this.nonce, state);
      this.localStorage.update(this.key(this.documentUri), state);
    }
  }

  public get(documentUri: string) {
    return this.localStorage.get<SaveState>(this.key(documentUri));
  }

  private key(documentUri: string): string {
    return `save-state.${documentUri}`;
  }

  public static create(documentUri: string, localStorage: Memento) {
    return new StateProvider(documentUri, localStorage) as IStateProvider;
  }

  public destroy() {
    store.removeListener('state', this.handleEvent);
  }
}
