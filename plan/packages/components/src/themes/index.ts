export type { ThemeConfig } from "./types";

export { theme as aurora } from "./aurora";
export { theme as neon } from "./neon";
export { theme as sunset } from "./sunset";
export { theme as ocean } from "./ocean";
export { theme as forest } from "./forest";
export { theme as candy } from "./candy";
export { theme as midnight } from "./midnight";
export { theme as copper } from "./copper";

import { theme as aurora } from "./aurora";
import { theme as neon } from "./neon";
import { theme as sunset } from "./sunset";
import { theme as ocean } from "./ocean";
import { theme as forest } from "./forest";
import { theme as candy } from "./candy";
import { theme as midnight } from "./midnight";
import { theme as copper } from "./copper";
import type { ThemeConfig } from "./types";

/** All available themes as an array */
export const themes: ThemeConfig[] = [
  aurora,
  neon,
  sunset,
  ocean,
  forest,
  candy,
  midnight,
  copper,
];

/**
 * Look up a theme by its `name` field.
 * Returns `undefined` if no theme matches.
 */
export function getTheme(name: string): ThemeConfig | undefined {
  return themes.find((t) => t.name === name);
}
