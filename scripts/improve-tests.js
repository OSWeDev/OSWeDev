#!/usr/bin/env node

/**
 * Script to automatically improve all unit test files with cleaner output
 * This adds the TestUtils import to suppress verbose logging
 */

const fs = require('fs');
const path = require('path');

function findUnitTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findUnitTestFiles(fullPath));
        } else if (entry.name.endsWith('.unit.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function improveTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already improved
    if (content.includes('TestUtils') || content.includes('suppressVerboseOutput')) {
        console.log(`Skipping ${filePath} - already improved`);
        return false;
    }
    
    // Find the first import line
    const lines = content.split('\n');
    let firstImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') && !lines[i].includes('playwright-test-coverage')) {
            firstImportIndex = i;
            break;
        }
    }
    
    if (firstImportIndex === -1) {
        console.log(`Skipping ${filePath} - no imports found`);
        return false;
    }
    
    // Calculate relative path to TestUtils
    const testDir = path.dirname(filePath);
    const testUtilsPath = path.resolve(testDir, '../tools/TestUtils');
    let relativePath = path.relative(testDir, testUtilsPath).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    
    // Add the import and setup at the beginning
    const setupLines = [
        '',
        '// Setup clean test environment',
        `import { setupCleanTestEnvironment, suppressConsoleHandler } from '${relativePath}';`,
        'setupCleanTestEnvironment();',
        ''
    ];
    
    // Insert the setup after the first import
    lines.splice(firstImportIndex, 0, ...setupLines);
    
    // Look for APIControllerWrapper setup and add suppressConsoleHandler after it
    let apiWrapperIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('APIControllerWrapper.API_CONTROLLER')) {
            apiWrapperIndex = i;
            break;
        }
    }
    
    if (apiWrapperIndex !== -1) {
        lines.splice(apiWrapperIndex + 1, 0, '', '// Apply ConsoleHandler suppression after imports', 'suppressConsoleHandler();');
    }
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`Improved ${filePath}`);
    return true;
}

function main() {
    const testsDir = path.join(__dirname, '../tests/unit');
    const testFiles = findUnitTestFiles(testsDir);
    
    console.log(`Found ${testFiles.length} unit test files`);
    
    let improvedCount = 0;
    for (const file of testFiles) {
        if (improveTestFile(file)) {
            improvedCount++;
        }
    }
    
    console.log(`Improved ${improvedCount} test files`);
}

if (require.main === module) {
    main();
}

module.exports = { improveTestFile, findUnitTestFiles };