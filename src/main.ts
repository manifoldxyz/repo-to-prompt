import { generateFileMap } from "./fileMapper";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import fs from "fs";

// Default ignore patterns
const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  "tests",
  ".env",
  ".git",
  "dist",
  "build",
  "coverage",
  ".DS_Store",
  "*.test.ts",
  "*.spec.ts",
  ".svn",
  ".vscode",
  ".venv",
  "venv",
  "out",
  ".next",
  "package-lock.json",
  "yarn.lock",
  ".eslintignore",
  ".eslintrc.json",
  ".gitignore",
  ".prettierrc.js",
  "babel.config.js",
  "poetry.lock",
  "__pycache__",
  ".flake8",
  ".ruff_cache",
  ".mypy_cache",
];

const argv = yargs(hideBin(process.argv))
  .option("dir", {
    alias: "d",
    type: "string",
    description: "Directory to generate file map for",
    demandOption: true,
  })
  .option("output", {
    alias: "o",
    type: "string",
    description: "Output file path",
    default: "./output/output.md",
  })
  .option("ignore", {
    alias: "i",
    type: "array",
    description: "Patterns to ignore (overrides defaults)",
    default: DEFAULT_IGNORE_PATTERNS,
  })
  .option("append-ignore", {
    alias: "a",
    type: "array",
    description: "Additional patterns to ignore (adds to defaults)",
  })
  .help()
  .parseSync();

// Convert dir to absolute path if it's relative
const dirPath = path.resolve(argv.dir);

// Create output directory if it doesn't exist
const outputDir = path.dirname(argv.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Combine ignore patterns
const ignorePatterns = argv["append-ignore"]
  ? [...DEFAULT_IGNORE_PATTERNS, ...(argv["append-ignore"] as string[])]
  : (argv.ignore as string[]);

try {
  const { tokenCount, fileTokens } = generateFileMap(dirPath, {
    outputPath: argv.output,
    ignorePatterns,
  });
  const largestFilesWithTokens = Object.entries(fileTokens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  console.log(`
Successfully generated file map and token count for ${dirPath}
Output written to: ${path.resolve(argv.output)}
Approximate Total Token Count: ${tokenCount.total}
File Map Tokens: ${tokenCount.fileMapTokens}
File Contents Tokens: ${tokenCount.fileContentsTokens}
Largest Files: ${largestFilesWithTokens
    .map(([file, tokens]) => `${file}: ${tokens}`)
    .join("\n")}
`);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
