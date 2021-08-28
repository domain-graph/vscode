import { SaveState } from 'domain-graph';

export type Message = DocumentUpdateMessage | SaveStateMessage;

export type DocumentUpdateMessage = {
  type: 'update';
  documentUri: string;
  text: string;
  state: SaveState | null;
};

export type SaveStateMessage = {
  type: 'save-state';
  state: SaveState;
};
