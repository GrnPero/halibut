// Halibut: helpers for reading raw terminal input.

const ESC = "\u001b";

// CSI and SS3 escape sequences (ESC [ … or ESC O …): arrow keys, Delete,
// Home/End and their modified forms.
const ESCAPE_SEQUENCE = new RegExp(`${ESC}[[O][0-9;]*[~A-Za-z]`, "g");

// Control characters a hidden prompt handles itself: Enter, Ctrl+C, Backspace.
const HANDLED_CONTROLS = new Set(["\r", "\n", "\u0003", "\b", "\u007f"]);

// Below this code point are the C0 control characters (Tab, Ctrl+D, ESC, …).
const FIRST_PRINTABLE = 0x20;

/**
 * Removes keystrokes that type nothing visible from a chunk of raw-mode
 * input: escape sequences and control characters, except the ones a hidden
 * prompt handles (Enter, Ctrl+C, Backspace).
 *
 * @param chunk - Raw input as read from stdin in raw mode.
 * @returns The chunk with only printable characters and the handled controls.
 */
export function stripControlInput(chunk: string): string {
  return [...chunk.replace(ESCAPE_SEQUENCE, "")]
    .filter(
      (char) =>
        HANDLED_CONTROLS.has(char) ||
        (char.codePointAt(0) ?? 0) >= FIRST_PRINTABLE,
    )
    .join("");
}
