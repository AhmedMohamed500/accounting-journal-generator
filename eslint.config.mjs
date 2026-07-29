import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "react-hooks/incompatible-library": "off",
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  globalIgnores([".next/**", ".open-next/**", "dist/**", "out/**", "node_modules/**", "next-env.d.ts"]),
]);
