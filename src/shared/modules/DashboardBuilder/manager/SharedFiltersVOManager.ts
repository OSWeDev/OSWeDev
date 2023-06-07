import SharedFiltersVO from "../vos/SharedFiltersVO";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * SharedFiltersVOManager
 */
export default class SharedFiltersVOManager {

    /**
     * save_shared_filters
     *  - Do save or update the given shared filters
     *
     * TODO: check if the user has access to the given shared filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @returns {Promise<boolean>}
     */
    public static async save_shared_filters(shared_filters: SharedFiltersVO): Promise<boolean> {

        const res = await ModuleDAO.getInstance().insertOrUpdateVO(shared_filters);

        return res?.id != null;
    }

    /**
     * delete_shared_filters
     *  - Do delete the given shared filters
     *
     * TODO: check if the user has access to the given shared filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @returns {Promise<boolean>}
     */
    public static async delete_shared_filters(shared_filters: SharedFiltersVO): Promise<boolean> {

        const res = await ModuleDAO.getInstance().deleteVOs([shared_filters]);

        return res?.shift()?.id != null;
    }

    public static getInstance(): SharedFiltersVOManager {
        if (!SharedFiltersVOManager.instance) {
            SharedFiltersVOManager.instance = new SharedFiltersVOManager();
        }

        return SharedFiltersVOManager.instance;
    }

    private static instance: SharedFiltersVOManager = null;
}