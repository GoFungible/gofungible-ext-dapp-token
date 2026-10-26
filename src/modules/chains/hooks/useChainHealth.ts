import { useCallback, useEffect, useState } from 'react';
import { useChainStore } from '../ChainStore';
import { probeChain, type ChainHealth } from '../chainHealth';

interface UseChainHealthReturn {
  health: ChainHealth | null;
  isChecking: boolean;
  check: () => void;
}

export function useChainHealth(): UseChainHealthReturn {
  const { selectedChain, selectedChainId } = useChainStore();
  const [health, setHealth] = useState<ChainHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const rpcUrl = selectedChain?.rpcUrl;
  const expectedChainId = selectedChain?.id;

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
  }, [check, selectedChainId]);

  return { health, isChecking, check: () => { void check(); } };
}