import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DomainGraph,
  getIntrospection,
  Icons,
  ParseError,
  SaveState,
  SaveStateRepository,
} from 'domain-graph';
import { IntrospectionQuery } from 'graphql';

import { Message, SaveStateMessage } from '../message-types';
import { getInitialState } from './initial-state';

export class NullRepository implements SaveStateRepository {
  has(id: string): Promise<boolean> {
    return Promise.resolve(false);
  }
  get(id: string): Promise<SaveState | null> {
    return Promise.resolve(null);
  }
  set(id: string, state: SaveState): Promise<void> {
    return Promise.resolve();
  }
  delete(id: string): Promise<void> {
    return Promise.resolve();
  }
}

const vscode = acquireVsCodeApi<Record<string, SaveState>>();
const repository = new NullRepository(); // new WebviewRepository(vscode); // TODO: put this back.

export const App: React.FC<{}> = () => {
  const [documentUri, setDocumentUri] = useState<string>('default');
  const [introspection, setIntrospection] = useState<IntrospectionQuery | null>(
    null,
  );
  const [parseErrors, setParseErrors] = useState<readonly ParseError[]>([]);
  const [saveState, setSaveState] = useState<SaveState | undefined>();

  useEffect(() => {
    const initialState = getInitialState();
    if (initialState?.documentText) {
      const { introspection: query, errors } = getIntrospection(
        initialState.documentText,
      );
      if (query) {
        setIntrospection(query);
      }
      setParseErrors(errors);
    }

    if (initialState?.state) {
      setSaveState(initialState?.state);
    }
  }, []);

  const handleMessage = useCallback((message: Message) => {
    switch (message.type) {
      case 'update':
        setDocumentUri(message.documentUri);
        const { introspection: query, errors } = getIntrospection(message.text);
        if (query) {
          setIntrospection(query);
        }
        setParseErrors(errors);

        setSaveState(message.state || undefined);
        break;
      case 'save-state': {
        const { state } = message;
        setSaveState(state);
        break;
      }
    }
  }, []);
  useMessageListener(handleMessage);

  const handleSaveState = useCallback(
    (graphId: string, state: SaveState) => {
      if (graphId === documentUri) {
        const message: SaveStateMessage = {
          type: 'save-state',
          state,
        };
        vscode.postMessage(message);
      }
    },
    [documentUri],
  );

  return (
    <>
      {!!parseErrors.length && !introspection && (
        <div className="c-parse-errors">
          <h1>
            <Icons.AlertTriangle size={72} strokeWidth={5} />
          </h1>
          <h2>Cannot parse "{documentUri}"</h2>
          <ul>
            {parseErrors.map((parseError, i) => (
              <li key={`parse-error.${i}`}>{parseError.message}</li>
            ))}
          </ul>
        </div>
      )}
      {!!introspection && (
        <DomainGraph
          graphId={documentUri}
          introspection={introspection}
          repository={repository}
          saveState={saveState}
          onSaveState={handleSaveState}
        ></DomainGraph>
      )}
    </>
  );
};

export function useMessageListener(handler: (message: Message) => void) {
  const savedHandler = useRef<(message: Message) => void>();
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<Message>) =>
      savedHandler.current?.(event.data);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
}
