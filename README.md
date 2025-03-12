# Manifold Repo to Prompt

A utility for generating file maps and contents for directories. This tool helps in creating structured representations of directory contents, which can be useful to feed into an AI system

## Features

- Generate detailed file maps of directories
- TypeScript support
- Comprehensive test coverage
- Easy-to-use API

## Installation

```bash
npm install
```

## Usage

To build the project:
```bash
npm run build
```

To run the main script:
# Basic usage with just directory
npm run start -- --dir /path/to/directory

# Specify custom output path
npm run start -- --dir /path/to/directory --output ./custom-output.md

# Override default ignore patterns
npm run start -- --dir /path/to/directory --ignore node_modules dist .git

# Add additional ignore patterns while keeping defaults
npm run start -- --dir /path/to/directory --append-ignore custom-folder "*.log"

### File Mapping API

The main functionality is provided through the `generateFileMap` function. Here's how to use it:

```typescript
import { generateFileMap } from './fileMapper';

// Basic usage - just specify the directory
const result = generateFileMap('./path/to/your/directory');

// Advanced usage with options
const result = generateFileMap('./path/to/your/directory', {
  outputPath: './output.md',  // Save results to a markdown file
  ignorePatterns: [
    'node_modules',          // Ignore node_modules directory
    '*.log',                // Ignore all log files
    '.git',                 // Ignore git directory
    '*.tmp'                 // Ignore temporary files
  ]
});

// The result object contains:
console.log(result.fileMap);        // String representation of directory structure
console.log(result.fileContents);   // Contents of all files
console.log(result.tokenCount);     // Token count statistics
```

#### Options

- `outputPath` (optional): Path where the results should be saved as a markdown file. The markdown file will include:
  - Directory structure
  - File contents
  - Token count statistics

- `ignorePatterns` (optional): Array of patterns to ignore. Supports:
  - Exact matches (e.g., 'node_modules')
  - Glob patterns (e.g., '*.log')

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

- `fileMapper.ts` - Core functionality for mapping files and directories
- `fileMapper.test.ts` - Test suite for the file mapper
- `main.ts` - Entry point script
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest test runner configuration

## Dependencies

- TypeScript
- Node.js
- tsx (for running TypeScript files)
- Vitest (for testing)

## License

MIT 