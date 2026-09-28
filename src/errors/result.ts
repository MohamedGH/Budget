export interface ResultOk<T> {
  readonly ok: true;
  readonly value: T;
}

export interface ResultErr<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = Error> = ResultOk<T> | ResultErr<E>;

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },

  err<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is ResultOk<T> {
    return result.ok === true;
  },

  isErr<T, E>(result: Result<T, E>): result is ResultErr<E> {
    return result.ok === false;
  },

  map<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
    if (result.ok) {
      return { ok: true, value: fn(result.value) };
    }
    return { ok: false, error: (result as ResultErr<E>).error };
  },

  mapErr<T, E, F>(result: Result<T, E>, fn: (err: E) => F): Result<T, F> {
    if (result.ok) {
      return { ok: true, value: (result as ResultOk<T>).value };
    }
    return { ok: false, error: fn((result as ResultErr<E>).error) };
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  },

  fromTry<T>(fn: () => T): Result<T, Error> {
    try {
      return { ok: true, value: fn() };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
    }
  },

  async fromAsyncTry<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const val = await fn();
      return { ok: true, value: val };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
    }
  },
};
