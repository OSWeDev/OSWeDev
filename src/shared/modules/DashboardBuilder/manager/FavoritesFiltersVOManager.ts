import ModuleDAO from "../../DAO/ModuleDAO";
import FavoritesFiltersVO from "../vos/FavoritesFiltersVO";


/**
 * @class FavoritesFiltersVOManager
 */
export default class FavoritesFiltersVOManager {

    /**
     * save_favorites_filters
     *  - Do save or update the given favorites filters
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @returns {Promise<boolean>}
     */
    public static async save_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<boolean> {

        const res = await ModuleDAO.getInstance().insertOrUpdateVO(favorites_filters);

        return res?.id != null;
    }

    /**
     * delete_favorites_filters
     *  - Do delete the given favorites filters
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @returns {Promise<boolean>}
     */
    public static async delete_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<boolean> {

        const res = await ModuleDAO.getInstance().deleteVOs([favorites_filters]);

        return res?.shift()?.id != null;
    }


    // istanbul ignore next: nothing to test
    public static getInstance(): FavoritesFiltersVOManager {
        if (!FavoritesFiltersVOManager.instance) {
            FavoritesFiltersVOManager.instance = new FavoritesFiltersVOManager();
        }
        return FavoritesFiltersVOManager.instance;
    }

    private static instance: FavoritesFiltersVOManager = null;
}