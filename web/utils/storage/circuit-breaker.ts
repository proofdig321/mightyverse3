/**
 * Circuit Breaker - Prevents infinite retry loops for failed CIDs
 */

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

class CircuitBreaker {
  private circuits = new Map<string, CircuitState>();
  private readonly maxFailures = 3;
  private readonly timeout = 60000; // 1 minute
  private readonly resetTimeout = 300000; // 5 minutes

  isOpen(key: string): boolean {
    const circuit = this.circuits.get(key);
    if (!circuit) return false;

    if (circuit.state === 'open') {
      if (Date.now() - circuit.lastFailure > this.resetTimeout) {
        circuit.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(key: string): void {
    this.circuits.delete(key);
  }

  recordFailure(key: string): void {
    const circuit = this.circuits.get(key) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= this.maxFailures) {
      circuit.state = 'open';
    }

    this.circuits.set(key, circuit);
  }

  getState(key: string): CircuitState | null {
    return this.circuits.get(key) || null;
  }

  reset(key: string): void {
    this.circuits.delete(key);
  }

  resetAll(): void {
    this.circuits.clear();
  }
}

export const circuitBreaker = new CircuitBreaker();