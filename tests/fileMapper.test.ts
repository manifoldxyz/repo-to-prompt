import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { generateFileMap } from '../src/fileMapper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to create test directory structure
function createTestDirectory(): string {
  const testDir = path.join(__dirname, 'test-dir');
  
  // Clean up if exists
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  
  // Create test directory structure
  fs.mkdirSync(testDir);
  fs.mkdirSync(path.join(testDir, 'folder1'));
  fs.mkdirSync(path.join(testDir, 'folder2'));
  fs.mkdirSync(path.join(testDir, 'node_modules'));
  
  // Create test files with content
  fs.writeFileSync(path.join(testDir, 'root.txt'), 'root content');
  fs.writeFileSync(path.join(testDir, 'folder1', 'file1.txt'), 'file1 content');
  fs.writeFileSync(path.join(testDir, 'folder2', 'file2.txt'), 'file2 content');
  fs.writeFileSync(path.join(testDir, '.env'), 'secret=123');
  fs.writeFileSync(path.join(testDir, 'node_modules', 'package.json'), '{}');
  
  return testDir;
}

describe('File Mapper Tests', () => {
  let testDir: string;
  
  beforeEach(() => {
    testDir = createTestDirectory();
  });
  
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    // Clean up markdown output file if it exists
    const mdFile = path.join(__dirname, 'test-output.md');
    if (fs.existsSync(mdFile)) {
      fs.unlinkSync(mdFile);
    }
  });

  test('should generate correct file map structure', () => {
    const result = generateFileMap(testDir);
    
    // Check if file map contains correct structure
    expect(result.fileMap).toContain('test-dir');
    expect(result.fileMap).toContain('folder1');
    expect(result.fileMap).toContain('folder2');
    expect(result.fileMap).toContain('root.txt');
    expect(result.fileMap).toContain('file1.txt');
    expect(result.fileMap).toContain('file2.txt');
  });

  test('should include file contents', () => {
    const result = generateFileMap(testDir);
    
    // Check if file contents are correct
    expect(result.fileContents).toContain('root content');
    expect(result.fileContents).toContain('file1 content');
    expect(result.fileContents).toContain('file2 content');
  });

  test('should handle empty directory', () => {
    const emptyDir = path.join(__dirname, 'empty-dir');
    if (fs.existsSync(emptyDir)) {
      fs.rmSync(emptyDir, { recursive: true });
    }
    fs.mkdirSync(emptyDir);
    
    const result = generateFileMap(emptyDir);
    expect(result.fileMap).toContain('empty-dir');
    expect(result.fileContents).toBe('');
    
    fs.rmSync(emptyDir, { recursive: true });
  });

  test('should handle non-existent directory', () => {
    expect(() => {
      generateFileMap('/non/existent/path');
    }).toThrow();
  });

  test('should handle files with special characters', () => {
    const specialFile = path.join(testDir, 'special!@#$.txt');
    fs.writeFileSync(specialFile, 'special content');
    
    const result = generateFileMap(testDir);
    expect(result.fileMap).toContain('special!@#$.txt');
    expect(result.fileContents).toContain('special content');
  });

  test('should write output to markdown file', () => {
    const outputPath = path.join(__dirname, 'test-output.md');
    generateFileMap(testDir, { outputPath });
    
    // Check if markdown file was created
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Read the markdown file
    const mdContent = fs.readFileSync(outputPath, 'utf8');
    
    // Check if markdown content is correct
    expect(mdContent).toContain('# Directory Structure for test-dir');
    expect(mdContent).toContain('```\n');
    expect(mdContent).toContain('test-dir');
    expect(mdContent).toContain('# File Contents');
    expect(mdContent).toContain('root content');
    expect(mdContent).toContain('file1 content');
    expect(mdContent).toContain('file2 content');
  });

  test('should ignore specified files and directories', () => {
    const result = generateFileMap(testDir, {
      ignorePatterns: ['node_modules', '.env', '*.txt']
    });
    
    // Check that ignored files/directories are not in the output
    expect(result.fileMap).not.toContain('node_modules');
    expect(result.fileMap).not.toContain('.env');
    expect(result.fileMap).not.toContain('root.txt');
    expect(result.fileMap).not.toContain('file1.txt');
    expect(result.fileMap).not.toContain('file2.txt');
    
    expect(result.fileContents).not.toContain('secret=123');
    expect(result.fileContents).not.toContain('root content');
    expect(result.fileContents).not.toContain('file1 content');
    expect(result.fileContents).not.toContain('file2 content');
  });

  test('should handle glob patterns correctly', () => {
    const result = generateFileMap(testDir, {
      ignorePatterns: ['*.txt', 'node_*']
    });
    
    // Should not contain .txt files and node_modules
    expect(result.fileMap).not.toContain('.txt');
    expect(result.fileMap).not.toContain('node_modules');
    
    // Should still contain other files
    expect(result.fileMap).toContain('.env');
  });
}); 