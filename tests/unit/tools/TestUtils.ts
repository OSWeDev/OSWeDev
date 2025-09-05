/**
 * Utility to apply clean test setup across all unit tests
 * This suppresses verbose logs and warnings that make test output noisy
 */

// Store original console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Store original ConsoleHandler methods (we'll override these after import)
let originalConsoleHandlerWarn: any = null;
let originalConsoleHandlerLog: any = null;

export function suppressVerboseOutput() {
    // Suppress verbose console.log messages
    console.log = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('checkAccessTo:') ||
            message.includes('LT ') || // Timestamp logs
            message.includes('[LT ') ||
            message.includes('configure_server_modules:') ||
            message.includes('DEBUG_START_SERVER')
        )) {
            return; // Suppress verbose logs
        }
        originalLog(...args);
    };

    // Suppress moment.js deprecation warnings
    console.warn = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('Deprecation warning') ||
            message.includes('checkAccessTo:')
        )) {
            return; // Suppress warnings
        }
        originalWarn(...args);
    };

    // Keep errors but filter out some noise
    console.error = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('checkAccessTo:')
        )) {
            return; // Suppress error logs that are just noise
        }
        originalError(...args);
    };
}

export function suppressConsoleHandler() {
    // This should be called after ConsoleHandler is imported
    try {
        const ConsoleHandler = require('../../../src/shared/tools/ConsoleHandler').default;
        if (ConsoleHandler) {
            if (!originalConsoleHandlerWarn) {
                originalConsoleHandlerWarn = ConsoleHandler.warn;
                originalConsoleHandlerLog = ConsoleHandler.log;
            }

            ConsoleHandler.warn = (error: string | Error, ...params: any[]): void => {
                const msg = typeof error === 'string' ? error : error.message;
                if (msg && (
                    msg.includes('checkAccessTo:') ||
                    msg.includes('Deprecation warning')
                )) {
                    return; // Suppress verbose warnings
                }
                originalConsoleHandlerWarn(error, ...params);
            };

            ConsoleHandler.log = (error: string | Error, ...params: any[]): void => {
                const msg = typeof error === 'string' ? error : error.message;
                if (msg && (
                    msg.includes('checkAccessTo:') ||
                    msg.includes('LT ') ||
                    msg.includes('[LT ')
                )) {
                    return; // Suppress verbose logs
                }
                originalConsoleHandlerLog(error, ...params);
            };
        }
    } catch (e) {
        // ConsoleHandler not available yet
    }
}

export function restoreConsoleOutput() {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    // Restore ConsoleHandler if it was overridden
    if (originalConsoleHandlerWarn) {
        try {
            const ConsoleHandler = require('../../../src/shared/tools/ConsoleHandler').default;
            if (ConsoleHandler) {
                ConsoleHandler.warn = originalConsoleHandlerWarn;
                ConsoleHandler.log = originalConsoleHandlerLog;
            }
        } catch (e) {
            // ConsoleHandler not available
        }
    }
}

// Auto-apply console suppression when imported
suppressVerboseOutput();

// Setup test environment
export function setupCleanTestEnvironment() {
    suppressVerboseOutput();
    
    // Set test mode flags
    process.env.NODE_ENV = 'test';
    process.env.IS_UNIT_TEST_MODE = 'true';
    
    // Setup ConsoleHandler suppression (to be called after imports)
    setTimeout(() => {
        suppressConsoleHandler();
    }, 0);
    
    return {
        suppressVerboseOutput,
        suppressConsoleHandler,
        restoreConsoleOutput
    };
}

export default {
    suppressVerboseOutput,
    suppressConsoleHandler,
    restoreConsoleOutput,
    setupCleanTestEnvironment
};