import fs from "fs";
import path from "path";

/**
 * Options for generating a file map
 */
export interface FileMapOptions {
  /** Path to write the output markdown file */
  outputPath?: string;
  /** Patterns of files/folders to ignore */
  ignorePatterns?: string[];
}

/**
 * Result of the file mapping operation
 */
export interface FileMapResult {
  /** Tree structure representation of the directory */
  fileMap: string;
  /** Contents of all files in the directory */
  fileContents: string;
  /** Token counts for individual files */
  fileTokens: Record<string, number>;
  /** Approximate token count of the output */
  tokenCount: {
    /** Total token count */
    total: number;
    /** Token count for file map */
    fileMapTokens: number;
    /** Token count for file contents */
    fileContentsTokens: number;
  };
}

/**
 * Estimate the number of tokens in a text string
 * This is a simple approximation - real token count depends on the specific tokenizer used by AI models
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Split by whitespace and punctuation
  // This is a simple approximation - actual tokenization is more complex
  const tokens = text
    .split(/\s+|([.,!?;:'"(){}\[\]<>\/\\=+-])/g)
    .filter((token) => token && token.trim() !== "");

  // Count code blocks and technical content differently
  // Code typically has more tokens per word due to symbols, variable names, etc.
  let inCodeBlock = false;
  let codeBlockContent = "";
  let normalContent = "";

  const lines = text.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
    } else if (inCodeBlock) {
      codeBlockContent += line + "\n";
    } else {
      normalContent += line + "\n";
    }
  }

  // Adjust for the fact that code tends to have more tokens
  // than regular text due to specialized symbols and identifiers
  const normalTokenEstimate = normalContent
    .split(/\s+|([.,!?;:'"(){}\[\]<>\/\\=+-])/g)
    .filter((token) => token && token.trim() !== "").length;

  const codeTokenEstimate = codeBlockContent
    .split(/\s+|([.,!?;:'"(){}\[\]<>\/\\=+-])/g)
    .filter((token) => token && token.trim() !== "").length;

  // Add a small multiplier for code tokens as they tend to be more granular
  return normalTokenEstimate + Math.ceil(codeTokenEstimate * 1.2);
}

/**
 * Check if a path matches any of the ignore patterns
 * @param {string} itemPath - Path to check
 * @param {string[]} ignorePatterns - Patterns to ignore
 * @returns {boolean} True if path should be ignored
 */
function shouldIgnore(itemPath: string, ignorePatterns: string[]): boolean {
  const itemName = path.basename(itemPath);
  return ignorePatterns.some((pattern) => {
    // Handle exact matches
    if (pattern === itemName) return true;

    // Handle glob patterns
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
      return new RegExp(`^${regexPattern}$`).test(itemName);
    }

    return false;
  });
}

/**
 * Generate a file map and contents for a directory
 * @param {string} dirPath - Path to the directory
 * @param {FileMapOptions} options - Options for file mapping
 * @returns {FileMapResult} Object containing file map and contents
 */
export function generateFileMap(
  dirPath: string,
  options: FileMapOptions = {}
): FileMapResult {
  const { outputPath, ignorePatterns = [] } = options;

  // Check if directory exists
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  let fileMap = "";
  let fileContents = "";
  const fileTokens: Record<string, number> = {};

  function processDirectory(currentPath: string, indent: string = "") {
    const items = fs.readdirSync(currentPath);

    items.forEach((item, index) => {
      const fullPath = path.join(currentPath, item);

      // Skip if item matches ignore patterns
      if (shouldIgnore(fullPath, ignorePatterns)) {
        return;
      }

      const isLast = index === items.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      const stats = fs.statSync(fullPath);

      fileMap += indent + prefix + item + "\n";

      if (stats.isDirectory()) {
        processDirectory(fullPath, indent + (isLast ? "    " : "│   "));
      } else {
        const content = fs.readFileSync(fullPath, "utf8");
        const relativePath = path.relative(dirPath, fullPath);
        fileContents += `File: ${relativePath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
        fileTokens[relativePath] = estimateTokenCount(content);
      }
    });
  }

  const dirName = path.basename(dirPath);
  fileMap = dirName + "\n";
  processDirectory(dirPath);

  // Calculate token counts
  const fileMapTokens = estimateTokenCount(fileMap);
  const fileContentsTokens = estimateTokenCount(fileContents);
  const totalTokens = fileMapTokens + fileContentsTokens;

  // Write to markdown file if outputPath is provided
  if (outputPath) {
    const mdContent = `# Directory Structure for ${dirName}\n\n\`\`\`\n${fileMap}\`\`\`\n\n# File Contents\n\n${fileContents}`;
    fs.writeFileSync(outputPath, mdContent);
  }

  return {
    fileMap,
    fileContents,
    fileTokens,
    tokenCount: {
      total: totalTokens,
      fileMapTokens,
      fileContentsTokens,
    },
  };
}

// Remove console.log and export directly
export default generateFileMap;
