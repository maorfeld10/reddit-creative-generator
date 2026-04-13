import { useEffect, useState, type ReactNode } from 'react';
import { hasApiKey, subscribeApiKey } from '../lib/api-key';
import ApiKeySetup from './ApiKeySetup';

interface Props {
  children: ReactNode;
}

export default function ApiKeyGate({ children }: Props) {
  const [ready, setReady] = useState<boolean>(() => hasApiKey());

  useEffect(() => {
    return subscribeApiKey(() => setReady(hasApiKey()));
  }, []);

  if (!ready) {
    return <ApiKeySetup onSaved={() => setReady(true)} />;
  }
  return <>{children}</>;
}
