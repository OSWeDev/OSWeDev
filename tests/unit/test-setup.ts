/**
 * Test setup for unit tests
 * This file provides minimal configuration and mocking to avoid loading the entire application
 */

import { applyCommonMocks, createMinimalTestEnvironment } from './tools/MockFactory';

// Global test setup function
export default async function globalSetup() {
    console.log('Setting up global test environment...');
    
    // Apply common mocks and suppressions
    applyCommonMocks();
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.IS_UNIT_TEST_MODE = 'true';
    
    console.log('Global test environment setup complete.');
}

// Utility to setup minimal test environment for individual tests
export function setupMinimalTestEnvironment() {
    // Set test mode flags
    process.env.NODE_ENV = 'test';
    
    // Apply mocks
    applyCommonMocks();
    
    return createMinimalTestEnvironment();
}

// Helper to mock module dependencies on a per-test basis
export function mockModuleDependencies() {
    return createMinimalTestEnvironment();
}