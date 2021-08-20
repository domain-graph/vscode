export type Message = DocumentUpdateMessage;

export type DocumentUpdateMessage = {
  type: 'update';
  text: string;
};
