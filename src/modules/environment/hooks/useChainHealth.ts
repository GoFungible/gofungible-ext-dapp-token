import { useCallback, useEffect, useState } from 'react';
import { probeChain, type ChainHealth } from '../../../core/chainHealth';

interface UseChainHealthReturn {
  health: ChainHealth | null;
  isChecking: boolean;
  check: () => void;
}

export function useChainHealth(rpcUrl: string | undefined): UseChainHealthReturn {
  const [health, setHealth] = useState<ChainHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    if (!rpcUrl) {
      setHealth(null);
      return;
    }
    setIsChecking(true);
    try {
      const result = await probeChain(rpcUrl);
      setHealth(result);
    } finally {
      setIsChecking(false);
    }
  }, [rpcUrl]);

  useEffect(() => {
    void check();
  }, [check]);

  return { health, isChecking, check: () => { void check(); } };
}
