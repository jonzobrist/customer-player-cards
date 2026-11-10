// Minimal stand-ins for the design-system hooks used by the original concept Page.
export { useState, useEffect, useRef, Fragment } from "react";
export type { ReactNode, CSSProperties } from "react";

const THEME = {
  text: { primary: "#e8eaed", secondary: "#b4b9c2", tertiary: "#9aa0aa", danger: "#ff6b6b", warning: "#ffb340", success: "#4cd18a", onPrimary: "#0d0f12" },
  fill: { dangerSubtle: "#3a1c1f", warningSubtle: "#3a2c14", accentSubtle: "#33301a", successSubtle: "#16301f", secondary: "#2a2e35", hover: "#252a31", primary: "#e8eaed" },
  bg: { base: "#121418", elevated: "#1a1d22", subtle: "#16191d" },
  border: { subtle: "#262a30", default: "#343941", strong: "#4b525c" },
  dataviz: { categorical: ["#5aa9ff", "#f2d15c", "#c49bff"], other: "#8a919c" },
  font: { mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
};
export function useGrokTheme() { return THEME; }
