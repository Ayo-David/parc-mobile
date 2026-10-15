import { randomUUID } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "parc.device_id";

/**
 * A stable per-install device identifier, generated once and persisted in
 * SecureStore. No first-party device-identifier API was specified as
 * required, so this is a client-generated UUID rather than a hardware ID
 * (which is also the more privacy-conscious choice).
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}
