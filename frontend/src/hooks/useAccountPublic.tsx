// src/hooks/useAccountPublic.ts
import { useEffect, useState } from "react";
import type { AccountPublic } from "@/services/account";
import { getAccountPublic } from "@/services/account";

const cache = new Map<number, AccountPublic>();

export function useAccountPublic(id?: number | null) {
  const [data, setData] = useState<AccountPublic | null>(id ? cache.get(id) ?? null : null);
  const [loading, setLoading] = useState<boolean>(!!id && !cache.has(id));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    if (!id) return;

    async function run() {
      try {
        if (cache.has(id)) {
          setData(cache.get(id)!);
          setLoading(false);
          return;
        }
        setLoading(true);
        const acc = await getAccountPublic(id);
        cache.set(id, acc);
        if (alive) {
          setData(acc);
          setLoading(false);
        }
      } catch (e: any) {
        if (alive) {
          setError(e);
          setLoading(false);
        }
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [id]);

  return { data, loading, error };
}
