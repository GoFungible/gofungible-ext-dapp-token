import { useCallback, useEffect, useState } from 'react';
import { probeChain, type ChainHealth } from '../../chains/chainHealth';

interface UseChainHealthReturn {
  health: ChainHealth | null;
  isChecking: boolean;
  check: () => void;
}

export function useChainHealth(
  rpcUrl: string | undefined,
  expectedChainId?: number
): UseChainHealthReturn {
  const [health, setHealth] = useState<ChainHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    if (!rpcUrl) {
      setHealth(null);
      return;
    }
    setIsChecking(true);
    try {
      const result = await probeChain(rpcUrl, expectedChainId);
      setHealth(result);
    } finally {
      setIsChecking(false);
    }
  }, [rpcUrl, expectedChainId]);

  useEffect(() => {
    void check();
  }, [check]);

  return { health, isChecking, check: () => { void check(); } };
}
