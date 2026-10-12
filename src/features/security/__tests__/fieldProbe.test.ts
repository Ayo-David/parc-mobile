import { describeDevice, describeSession, isCurrentEntry } from "../fieldProbe";

const THIS_DEVICE = "6f1c2b0a-1111-4222-8333-444455556666";
const OTHER_DEVICE = "0a0b0c0d-1111-4222-8333-444455556666";

describe("security field mapping (live GET /v1/security shape)", () => {
  it("recognises this install's device and its sessions so they can't be revoked", () => {
    expect(isCurrentEntry({ id: THIS_DEVICE, status: "ACTIVE" }, THIS_DEVICE)).toBe(true);
    expect(isCurrentEntry({ id: "s-1", device_id: THIS_DEVICE.toUpperCase() }, THIS_DEVICE)).toBe(true);
    expect(isCurrentEntry({ id: OTHER_DEVICE }, THIS_DEVICE)).toBe(false);
    expect(isCurrentEntry({ id: "s-2", device_id: OTHER_DEVICE }, THIS_DEVICE)).toBe(false);
  });

  it("treats everything as current until the device id is known", () => {
    expect(isCurrentEntry({ id: OTHER_DEVICE }, undefined)).toBe(true);
  });

  it("never falls back to showing a raw id as a device label", () => {
    expect(describeDevice({ id: OTHER_DEVICE, device_name: null, platform: null, is_trusted: false, last_seen_at: null })).toEqual({ title: "Unnamed device", subtitle: null });
    expect(describeDevice({ id: OTHER_DEVICE, device_name: null, platform: "IOS", is_trusted: true, last_seen_at: null })).toEqual({ title: "iPhone", subtitle: "Trusted device" });
  });

  it("labels sessions by sign-in method", () => {
    expect(describeSession({ id: "s-1", authentication_methods: ["LOGIN_PASSCODE"], last_activity_at: null, expires_at: null }).title).toBe("Passcode sign-in");
  });
});
