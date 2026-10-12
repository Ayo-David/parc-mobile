import { useQuery } from "@tanstack/react-query";

import { getOrCreateDeviceId } from "./deviceId";

/** This install's device id — the same value sent as `device_id` at login. `undefined` until loaded. */
export function useDeviceId(): string | undefined {
  const { data } = useQuery({ queryKey: ["device-id"], queryFn: getOrCreateDeviceId, staleTime: Infinity, gcTime: Infinity });
  return data;
}
