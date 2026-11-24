import { describe, expect, test } from "vitest";

import { stripControlInput } from "@/lib/terminal";

describe("stripControlInput", () => {
  test.each([
    ["left arrow", "ab\u001b[Dc"],
    ["right arrow", "ab\u001b[Cc"],
    ["SS3 up arrow", "ab\u001bOAc"],
    ["Delete", "ab\u001b[3~c"],
    ["Home with modifier", "ab\u001b[1;5Hc"],
    ["Tab", "ab\tc"],
    ["Ctrl+D", "ab\u0004c"],
  ])("drops %s", (_key, chunk) => {
    expect(stripControlInput(chunk)).toBe("abc");
  });

  test.each([
    ["Enter (CR)", "\r"],
    ["Enter (LF)", "\n"],
    ["Ctrl+C", "\u0003"],
    ["Backspace (DEL)", "\u007f"],
    ["Backspace (BS)", "\b"],
  ])("keeps %s for the prompt to handle", (_key, char) => {
    expect(stripControlInput(`a${char}`)).toBe(`a${char}`);
  });

  test("keeps letters, digits, symbols, spaces and Unicode", () => {
    const typed = "Ñandú corre 9! ~[O]";

    expect(stripControlInput(typed)).toBe(typed);
  });
});
