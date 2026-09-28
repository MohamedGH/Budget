import { Result } from './result';

export interface AppError {
  id: string;
  timestamp: string;
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'fatal';
}

type ErrorListener = (error: AppError) => void;

class ErrorManager {
  private errors: AppError[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private maxStoredErrors = 50;

  public report(
    errorOrMessage: Error | string,
    severity: AppError['severity'] = 'error',
    context?: Record<string, unknown>
  ): AppError {
    const message = typeof errorOrMessage === 'string' ? errorOrMessage : errorOrMessage.message;
    const appError: AppError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      message,
      code: errorOrMessage instanceof Error ? errorOrMessage.name : 'GENERIC_ERROR',
      context,
      severity,
    };

    this.errors.unshift(appError);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.pop();
    }

    // Notify all active listeners
    this.listeners.forEach(fn => {
      try {
        fn(appError);
      } catch (listenerErr) {
        console.error('Error in error listener:', listenerErr);
      }
    });

    console.warn(`[ErrorManager:${severity.toUpperCase()}] ${message}`, context || '');
    return appError;
  }

  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getErrors(): readonly AppError[] {
    return this.errors;
  }

  public clear(): void {
    this.errors = [];
  }

  public safeParse<T>(jsonString: string, fallback: T): T {
    const res = Result.fromTry(() => JSON.parse(jsonString));
    if (Result.isOk(res)) {
      return res.value as T;
    }
    this.report(`JSON parse error: ${res.error.message}`, 'warning', { jsonString: jsonString.slice(0, 100) });
    return fallback;
  }
}

export const errorManager = new ErrorManager();
