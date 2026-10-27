// Local development runs Next. The managed preview's strictPort flag selects
// the same UI's static demo entry, which is also the private hosted demo.
import { spawn } from "node:child_process";
const args = process.argv.slice(2);
const at = args.indexOf("--port");
const port = at >= 0 ? args[at + 1] : "3000";
const preview = args.includes("--strictPort");
const child = spawn(
  process.execPath,
  preview
    ? [
        "node_modules/vite/bin/vite.js",
        "--config",
        "vite.preview.config.ts",
        "--host",
        "0.0.0.0",
        "--port",
        port,
        "--strictPort",
      ]
    : [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "0.0.0.0",
        "--port",
        port,
      ],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
