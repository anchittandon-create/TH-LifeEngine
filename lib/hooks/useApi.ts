import useSWR, { SWRConfiguration } from "swr";

const jsonFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
};

export function useApi<T = any>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, jsonFetcher<T>, config);
}

export const apiFetcher = jsonFetcher;
