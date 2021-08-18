import React, { useMemo } from 'react';

export const App: React.FC<{}> = () => {
  const randomNumber = useMemo(() => Math.random(), []);
  return (
    <>
      Hello from React!
      <h1>Random number: {randomNumber}</h1>
    </>
  );
};
