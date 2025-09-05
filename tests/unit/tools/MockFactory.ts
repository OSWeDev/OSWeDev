/**
 * Mock factory for creating lightweight mocks of heavy OSWeDev modules
 * This helps avoid loading the entire application for unit tests
 */

// Mock for ServerAPIController
export const createMockServerAPIController = () => ({
    getInstance: () => ({
        get_shared_api_handler: () => async () => {
            throw new Error("Mock API - implement specific mock if needed");
        }
    })
});

// Mock for APIControllerWrapper
export const createMockAPIControllerWrapper = () => ({
    API_CONTROLLER: createMockServerAPIController()
});

// Mock for ModuleDAO
export const createMockModuleDAO = () => ({
    getInstance: () => ({
        // Add mock methods as needed
    })
});

// Mock for AccessPolicyServerController
export const createMockAccessPolicyServerController = () => ({
    role_anonymous: { id: 1, translatable_name: 'role_anonymous', parent_role_id: null },
    role_logged: { id: 2, translatable_name: 'role_logged', parent_role_id: 1 },
    checkAccessTo: () => Promise.resolve(false) // Default deny
});

// Mock for ConsoleHandler to reduce verbosity
export const createMockConsoleHandler = () => ({
    init: () => {},
    log: (message: string) => {
        // Optionally log in test mode
        if (process.env.DEBUG_TESTS) {
            console.log(`[TEST] ${message}`);
        }
    },
    error: (error: any) => {
        console.error(`[TEST ERROR]`, error);
    }
});

// Mock for ConfigurationService
export const createMockConfigurationService = () => ({
    IS_UNIT_TEST_MODE: true,
    node_configuration: {
        DEBUG_START_SERVER: false
    },
    setEnvParams: () => {}
});

// Mock for VarsTypesManager and other heavy managers
export const createMockVOsTypesManager = () => ({
    moduleTables_by_voType: {},
    getInstance: () => ({})
});

/**
 * Setup function to apply all common mocks
 * Call this at the beginning of tests that need to avoid heavy imports
 */
export function applyCommonMocks() {
    // Suppress moment.js deprecation warnings
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && message.includes('Deprecation warning')) {
            return; // Suppress moment.js warnings
        }
        originalWarn(...args);
    };

    // Suppress verbose access policy logs
    const originalLog = console.log;
    console.log = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('checkAccessTo:') ||
            message.includes('LT ') // Timestamp logs
        )) {
            return; // Suppress verbose logs
        }
        originalLog(...args);
    };
}

/**
 * Restore original console methods after tests
 */
export function restoreConsole() {
    // Could store and restore original methods if needed
}

/**
 * Create a minimal test environment with essential mocks
 */
export function createMinimalTestEnvironment() {
    applyCommonMocks();
    
    return {
        mockServerAPI: createMockServerAPIController(),
        mockAPIWrapper: createMockAPIControllerWrapper(),
        mockDAO: createMockModuleDAO(),
        mockAccessPolicy: createMockAccessPolicyServerController(),
        mockConsole: createMockConsoleHandler(),
        mockConfig: createMockConfigurationService(),
        mockVOsTypes: createMockVOsTypesManager()
    };
}

export default {
    createMockServerAPIController,
    createMockAPIControllerWrapper,
    createMockModuleDAO,
    createMockAccessPolicyServerController,
    createMockConsoleHandler,
    createMockConfigurationService,
    createMockVOsTypesManager,
    applyCommonMocks,
    restoreConsole,
    createMinimalTestEnvironment
};