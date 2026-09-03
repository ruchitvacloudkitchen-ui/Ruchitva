import { useCallback, useEffect, useState } from 'react';
import { ApiError, callOwner } from './api';

/** Small fetch-once-and-reload hook; enough for six owner screens. */
export function useOwnerData<T>(action: string, payload: object = {}) {
  const key = JSON.stringify(payload);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await callOwner<T>(action, JSON.parse(key) as object));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load.');
    } finally {
      setLoading(false);
    }
  }, [action, key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
