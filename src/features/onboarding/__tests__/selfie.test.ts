import { clearDraftSelfie, getDraftSelfie, pickSelfiePictureSize, setDraftSelfie } from "../liveness/selfie";

describe("pickSelfiePictureSize", () => {
  it("picks the smallest size that is still large enough for a face match", () => {
    expect(pickSelfiePictureSize(["4032x3024", "640x480", "1280x720", "320x240", "1920x1080"])).toBe("640x480");
  });

  it("ignores platform presets and sizes that are too small", () => {
    expect(pickSelfiePictureSize(["Photo", "High", "352x288", "1280x720"])).toBe("1280x720");
  });

  it("leaves the camera default when nothing qualifies", () => {
    expect(pickSelfiePictureSize(["Photo", "Low", "320x240"])).toBeUndefined();
    expect(pickSelfiePictureSize([])).toBeUndefined();
  });
});

describe("selfie draft", () => {
  it("holds the selfie in memory until cleared", () => {
    setDraftSelfie("base64-selfie");
    expect(getDraftSelfie()).toBe("base64-selfie");
    clearDraftSelfie();
    expect(getDraftSelfie()).toBeNull();
  });
});
