

/**
 * SharedFiltersVOManager
 */
export default class SharedFiltersVOManager {

    public static getInstance(): SharedFiltersVOManager {
        if (!SharedFiltersVOManager.instance) {
            SharedFiltersVOManager.instance = new SharedFiltersVOManager();
        }

        return SharedFiltersVOManager.instance;
    }

    private static instance: SharedFiltersVOManager = null;
}