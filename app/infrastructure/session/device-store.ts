import { db } from "~/infrastructure/db/database";

const DEVICE_KEY = "device";

export interface DeviceCounter {
  id: number;
  name: string;
  code: string;
}

export interface DeviceMeta {
  token: string;
  counter: DeviceCounter;
  activatedAt: string;
  revokedAt: string | null;
}

export type DeviceStatus = "none" | "active" | "revoked";

export async function getDeviceMeta(): Promise<DeviceMeta | null> {
  const row = await db.meta.get(DEVICE_KEY);
  return row ? (row.value as DeviceMeta) : null;
}

export async function saveDeviceMeta(meta: DeviceMeta): Promise<void> {
  await db.meta.put({ key: DEVICE_KEY, value: meta });
}

export async function clearDeviceMeta(): Promise<void> {
  await db.meta.delete(DEVICE_KEY);
}

export async function getDeviceToken(): Promise<string | null> {
  const meta = await getDeviceMeta();
  return meta && !meta.revokedAt ? meta.token : null;
}

export async function getDeviceCounter(): Promise<DeviceCounter | null> {
  const meta = await getDeviceMeta();
  return meta?.counter ?? null;
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  const meta = await getDeviceMeta();
  if (!meta) {
    return "none";
  }
  return meta.revokedAt ? "revoked" : "active";
}

export async function hasActivatedDevice(): Promise<boolean> {
  return (await getDeviceStatus()) === "active";
}
