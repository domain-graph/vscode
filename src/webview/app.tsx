import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DomainGraph, SaveState, SaveStateRepository } from 'domain-graph';
import {
  IntrospectionQuery,
  GraphQLSchema,
  buildSchema,
  introspectionFromSchema,
} from 'graphql';

import { Message } from '../message-types';
import { WebviewRepository } from './webview-respository';
import { getInitialState } from './initial-state';

export class NullRepository implements SaveStateRepository {
  has(id: string): Promise<boolean> {
    return Promise.resolve(false);
  }
  get(id: string): Promise<SaveState> {
    return Promise.resolve({
      canvas: {
        scale: 1,
        x: 0,
        y: 0,
      },
      graph: {
        visibleNodes: {},
      },
    });
  }
  set(id: string, state: SaveState): Promise<void> {
    return Promise.resolve();
  }
  delete(id: string): Promise<void> {
    return Promise.resolve();
  }
}

const vscode = acquireVsCodeApi<Record<string, SaveState>>();
const repository = new WebviewRepository(vscode);

export const App: React.FC<{}> = () => {
  const [introspection, setIntrospection] = useState<IntrospectionQuery | null>(
    null,
  );

  useEffect(() => {
    const initialState = getInitialState();
    if (initialState?.documentText) {
      const { introspection: query } = parse(initialState.documentText);
      if (query) {
        setIntrospection(query);
      }
    }
  }, []);

  const handleMessage = useCallback((message: Message) => {
    switch (message.type) {
      case 'update':
        // if text is valid gql, then parse as introspection query
        const { introspection: query, errors } = parse(message.text);
        if (query) {
          setIntrospection(query);
        }
        break;
    }
  }, []);
  useMessageListener(handleMessage);

  const randomNumber = useMemo(() => Math.random(), []);
  return (
    <>
      Hello from React!
      <h1>Random number: {randomNumber}</h1>
      {!!introspection && (
        <DomainGraph
          graphId="default"
          introspection={introspection}
          repository={repository}
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

type ParseError = {
  message: string;
};

function parse(str: string): {
  introspection: IntrospectionQuery | null;
  errors: readonly ParseError[];
} {
  const errors: ParseError[] = [];
  let json: any = null;

  try {
    json = JSON.parse(str);
  } catch {
    // Parse as SDL

    let schema: GraphQLSchema | null = null;

    try {
      schema = buildSchema(str);
    } catch (firstEx) {
      try {
        schema = buildSchema(str + federationSchema);
      } catch (secondEx) {
        console.error(firstEx);
        console.error(secondEx);
        return {
          introspection: null,
          errors: [
            {
              message: 'Not a valid schema',
            },
          ],
        };
      }
    }

    const introspection = introspectionFromSchema(schema);

    return {
      introspection,
      errors: [],
    };
  }

  if (typeof json.__schema === 'object') {
    for (const prop of [
      'queryType',
      'mutationType',
      'subscriptionType',
      'types',
      'directives',
    ]) {
      if (typeof json.__schema[prop] === undefined) {
        errors.push({
          message: `Missing property "__schema.${prop}" in introspection`,
        });
      }
    }
  } else {
    errors.push({ message: 'Missing property "__schema" in introspection' });
  }

  if (errors.length) {
    return {
      introspection: null,
      errors,
    };
  } else {
    return {
      introspection: json,
      errors,
    };
  }
}

// see: https://www.apollographql.com/docs/federation/federation-spec/
const federationSchema = `
scalar _FieldSet
directive @external on FIELD_DEFINITION
directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
directive @extends on OBJECT | INTERFACE
`;
