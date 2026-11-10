// Renders index.html headlessly with Chrome/Chromium and saves screenshots to ../docs/img/.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const chrome = process.env.CHROME_BIN || "google-chrome";
const url = "file://" + resolve("index.html");
const shots = [
  { file: "../docs/img/mockups-hero.png", size: "1280,1240", scale: "1" },
  { file: "../docs/img/mockups-full.png", size: "1280,4460", scale: "1" },
];
for (const s of shots) {
  execFileSync(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--force-prefers-reduced-motion", `--force-device-scale-factor=${s.scale}`,
    `--window-size=${s.size}`, "--virtual-time-budget=3000",
    `--screenshot=${resolve(s.file)}`, url,
  ], { stdio: "inherit" });
}
