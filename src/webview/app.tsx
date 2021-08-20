import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Message } from '../message-types';

export const App: React.FC<{}> = () => {
  const [text, setText] = useState<string>();
  const handleMessage = useCallback((message: Message) => {
    switch (message.type) {
      case 'update':
        // if text is valid gql, then parse as introspection query
        setText(message.text);
        break;
    }
  }, []);
  useMessageListener(handleMessage);

  const randomNumber = useMemo(() => Math.random(), []);
  return (
    <>
      Hello from React!
      <h1>Random number: {randomNumber}</h1>
      {text}
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
