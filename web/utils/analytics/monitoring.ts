/**
 * Performance Analytics & Monitoring
 * Real-time platform metrics and user behavior tracking
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
}

export interface UserAnalytics {
  sessionId: string;
  userId?: string;
  userAgent: string;
  viewport: { width: number; height: number };
  events: AnalyticsEvent[];
  performance: PerformanceMetrics;
  timestamp: number;
}

export interface AnalyticsEvent {
  type: 'page_view' | 'interaction' | 'error' | 'performance' | 'conversion';
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

export class AnalyticsService {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, any>) {
    this.trackEvent({
      type: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: page,
      metadata
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent({
      type: 'interaction',
      category,
      action,
      label,
      value
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string) {
    this.trackEvent({
      type: 'error',
      category: 'error',
      action: 'javascript_error',
      label: error.message,
      metadata: { stack: error.stack, context }
    });
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0,
      interactionDelay: 0,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
      networkLatency: navigation ? navigation.responseStart - navigation.requestStart : 0,
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * Send analytics data to server
   */
  async sendAnalytics(endpoint: string = '/api/analytics') {
    try {
      const data = {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        events: this.events,
        performance: this.getPerformanceMetrics(),
        timestamp: Date.now()
      };
      
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      this.events = [];
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  private trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>) {
    this.events.push({ ...event, timestamp: Date.now() });
    if (this.events.length > 50) this.sendAnalytics();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private initializeMonitoring() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'global_error_handler');
    });
  }

  private calculateErrorRate(): number {
    const errorEvents = this.events.filter(event => event.type === 'error');
    return this.events.length > 0 ? (errorEvents.length / this.events.length) * 100 : 0;
  }
}

/**
 * Platform Health Monitor
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private status: Map<string, { healthy: boolean; lastCheck: number; error?: string }> = new Map();

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  registerHealthCheck(name: string, check: () => Promise<boolean>) {
    this.healthChecks.set(name, check);
  }

  async runHealthChecks(): Promise<Record<string, { healthy: boolean; error?: string }>> {
    const results: Record<string, { healthy: boolean; error?: string }> = {};

    for (const [name, check] of Array.from(this.healthChecks)) {
      try {
        const healthy = await check();
        results[name] = { healthy };
        this.status.set(name, { healthy, lastCheck: Date.now() });
      } catch (error) {
        results[name] = { healthy: false, error: (error as Error).message };
        this.status.set(name, { healthy: false, lastCheck: Date.now(), error: (error as Error).message });
      }
    }

    return results;
  }

  isPlatformHealthy(): boolean {
    for (const [, data] of Array.from(this.status)) {
      if (!data.healthy) return false;
    }
    return true;
  }
}

export function createAnalyticsService(): AnalyticsService {
  return new AnalyticsService();
}