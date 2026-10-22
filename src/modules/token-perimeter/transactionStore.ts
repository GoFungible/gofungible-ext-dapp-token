import { PerimeterTransaction } from './types';

const transactions: PerimeterTransaction[] = [];
const listeners = new Set<(transactions: PerimeterTransaction[]) => void>();

function notify(): void {
  const snapshot = [...transactions];
  listeners.forEach(listener => listener(snapshot));
}

export function addTransaction(transaction: PerimeterTransaction): void {
  transactions.push(transaction);
  notify();
}

export function getTransactions(): PerimeterTransaction[] {
  return [...transactions];
}

export function subscribeTransactions(
  listener: (transactions: PerimeterTransaction[]) => void
): () => void {
  listeners.add(listener);
  listener([...transactions]);
  return () => {
    listeners.delete(listener);
  };
}
