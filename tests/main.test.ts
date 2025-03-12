import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Mock process.exit to prevent tests from actually exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process.exit called with code: ${code}`);
});

// Mock console.log and console.error
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Create a helper function to create test directory structure
function createTestDirectory(): string {
  const testDir = path.join(__dirname, 'test-cli-dir');
  
  // Clean up if exists
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  
  // Create test directory structure
  fs.mkdirSync(testDir);
  fs.mkdirSync(path.join(testDir, 'src'));
  fs.writeFileSync(path.join(testDir, 'src', 'test.txt'), 'test content');
  
  return testDir;
}

describe('CLI Tests', () => {
  let testDir: string;
  let originalArgv: string[];
  
  beforeEach(() => {
    testDir = createTestDirectory();
    originalArgv = process.argv;
    // Clear mock calls
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockExit.mockClear();
    
    // Clear module cache
    vi.resetModules();
  });
  
  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv;
    
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    // Clean up output directory if it exists
    const outputDir = path.join(PROJECT_ROOT, 'output');
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true });
    }
  });

  test('should generate file map with default options', async () => {
    // Set up process.argv
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      testDir
    ];

    // Import main (this will execute the CLI code)
    await import('../src/main');

    // Check if output directory was created
    const outputDir = path.join(PROJECT_ROOT, 'output');
    expect(fs.existsSync(outputDir)).toBe(true);

    // Check if output file was created
    const outputFile = path.join(outputDir, 'output.md');
    expect(fs.existsSync(outputFile)).toBe(true);

    // Check file contents
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('test-cli-dir');
    expect(content).toContain('src');
    expect(content).toContain('test.txt');
    expect(content).toContain('test content');

    // Check console output
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Successfully generated file map')
    );
  });

  test('should generate file map with custom output path', async () => {
    const customOutput = path.resolve(testDir, 'custom-output.md');
    
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      testDir,
      '--output',
      customOutput
    ];

    await import('../src/main');

    expect(fs.existsSync(customOutput)).toBe(true);
    const content = fs.readFileSync(customOutput, 'utf8');
    expect(content).toContain('test-cli-dir');
  });

  test('should handle custom ignore patterns', async () => {
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      testDir,
      '--ignore',
      '*.txt'
    ];

    await import('../src/main');

    const outputFile = path.join(PROJECT_ROOT, 'output', 'output.md');
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).not.toContain('test.txt');
  });

  test('should handle append-ignore option', async () => {
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      testDir,
      '--append-ignore',
      '*.txt'
    ];

    await import('../src/main');

    const outputFile = path.join(PROJECT_ROOT, 'output', 'output.md');
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).not.toContain('test.txt');
    // Should still have default ignores
    expect(content).not.toContain('node_modules');
  });

  test('should fail when directory does not exist', async () => {
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      '/non/existent/path'
    ];

    let error: Error | undefined;
    try {
      await import('../src/main');
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toContain('Process.exit called with code: 1');
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      expect.stringContaining('Directory not found')
    );
  });

  test('should fail when no directory is specified', async () => {
    process.argv = [
      'node',
      'main.ts'
    ];

    let error: Error | undefined;
    try {
      await import('../src/main');
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toContain('Process.exit called with code:');
  });

  test('should handle invalid ignore patterns gracefully', async () => {
    process.argv = [
      'node',
      'main.ts',
      '--dir',
      testDir,
      '--ignore',
      '[invalid-regex'
    ];

    await import('../src/main');

    // Should still generate output
    const outputFile = path.join(PROJECT_ROOT, 'output', 'output.md');
    expect(fs.existsSync(outputFile)).toBe(true);
  });
}); 