import { describe, expect, it } from "vitest";
import { validPng } from "./share-preview";

function pngHeader(width: number, height: number) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("share preview validation", () => {
  it("accepts only PNG files with the exact expected dimensions", () => {
    expect(validPng(pngHeader(1200, 630), 1200, 630)).toBe(true);
    expect(validPng(pngHeader(1080, 1350), 1200, 630)).toBe(false);
    expect(validPng(new Uint8Array(33), 1200, 630)).toBe(false);
  });
});
