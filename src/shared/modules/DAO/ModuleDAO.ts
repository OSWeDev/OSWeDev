import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import Module from '../Module';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APIDAOParamVO from './vos/APIDAOParamVO';
import APIDAOParamVOs from './vos/APIDAOParamVOs';
import ModulesManager from '../ModulesManager';

export default class ModuleDAO extends Module {

    public static ACCESS_GROUP_NAME = "DAO_ACCESS";

    public static APINAME_DELETE_VOS = "DAO_DELETE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VOS = "DAO_INSERT_OR_UPDATE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VO = "DAO_INSERT_OR_UPDATE_VO";
    public static APINAME_DB_TX_UPDATE = "APINAME_DB_TX_UPDATE";
    public static APINAME_SELECT_ALL = "SELECT_ALL";
    public static APINAME_SELECT_ONE = "SELECT_ONE";
    public static APINAME_GET_VO_BY_ID = "GET_VO_BY_ID";
    public static APINAME_GET_VOS = "GET_VOS";

    public static getInstance() {
        if (!ModuleDAO.instance) {
            ModuleDAO.instance = new ModuleDAO();
        }
        return ModuleDAO.instance;
    }

    private static instance: ModuleDAO = null;

    private constructor() {

        super("dao", "DAO");
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            ModuleDAO.APINAME_DELETE_VOS,
            null //FIXME NEED HOOK suivant data
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS,
            null //FIXME NEED HOOK suivant data
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase, any>(
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VO,
            null //FIXME NEED HOOK suivant data
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<any, any>(
            ModuleDAO.APINAME_DB_TX_UPDATE,
            null //FIXME NEED HOOK suivant data
        ));

        //FIXME API en Post car les params ne peuvent être transmis par l'url, mais
        //  on a besoin de gérer le cache comme sur un GET. A voir dans AjaxCache si on peut
        //  faire des POST avec cache.
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APIDAOParamVO<any>, any>(
            ModuleDAO.APINAME_GET_VO_BY_ID,
            null, //FIXME NEED HOOK suivant data
            APIDAOParamVO.translateGetVoByIdParams
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APIDAOParamVOs<any>, any>(
            ModuleDAO.APINAME_GET_VOS,
            null, //FIXME NEED HOOK suivant data
            APIDAOParamVOs.translateGetVosParams
        ));
        // ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APIDAOParamVOs<any>, any>(
        //     ModuleDAO.APINAME_SELECT_ALL,
        //     null, //FIXME NEED HOOK suivant data
        //     APIDAOParamVOs.translateSelectAllParams
        // ));
        // ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APIDAOParamVO<any>, any>(
        //     ModuleDAO.APINAME_SELECT_ONE,
        //     null, //FIXME NEED HOOK suivant data
        //     APIDAOParamVO.translateSelectOneParams
        // ));
    }

    public async deleteVOs(vos: IDistantVOBase[]): Promise<any[]> {
        return await ModuleAPI.getInstance().handleAPI<IDistantVOBase[], any[]>(ModuleDAO.APINAME_DELETE_VOS, vos);
    }

    public async insertOrUpdateVOs(vos: IDistantVOBase[]): Promise<any[]> {
        return await ModuleAPI.getInstance().handleAPI<IDistantVOBase[], any[]>(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, vos);
    }

    public async insertOrUpdateVO(vo: IDistantVOBase): Promise<any> {
        return await ModuleAPI.getInstance().handleAPI<IDistantVOBase, any>(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, vo);
    }

    public async db_tx_update(data: any): Promise<any> {
        return await ModuleAPI.getInstance().handleAPI<any, any>(ModuleDAO.APINAME_DB_TX_UPDATE, data);
    }

    /**
     * @param API_TYPE_ID L'API_TYPE_ID principal qui est concerné par la requête. On en déduit la table à mettre dans le FROM
     * @param forceNumerics
     * @param query La suite de la query après la requête générée (c'est à dire "SELECT t.* from [API_TYPE_ID].fullname t " + query).
     * Donc La table principale s'appelle t
     * @param queryParams Les paramètres qui sont utilisés dans la query
     * @param depends_on_api_type_ids La liste des autres API_TYPE_ID (en dehors du principal déjà cité en premier arguement) concernés
     * Par cette requête
     */
    // public async selectAll<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T[]> {
    //     return await ModuleAPI.getInstance().handleAPI<any, any>(ModuleDAO.APINAME_SELECT_ALL, API_TYPE_ID, query, queryParams, depends_on_api_type_ids);
    // }

    /**
     * @param API_TYPE_ID L'API_TYPE_ID principal qui est concerné par la requête. On en déduit la table à mettre dans le FROM
     * @param forceNumeric
     * @param query La suite de la query après la requête générée (c'est à dire "SELECT t.* from [API_TYPE_ID].fullname t " + query).
     * Donc La table principale s'appelle t
     * @param queryParams Les paramètres qui sont utilisés dans la query
     * @param depends_on_api_type_ids La liste des autres API_TYPE_ID (en dehors du principal déjà cité en premier arguement) concernés
     * Par cette requête
     */
    // public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T> {
    //     return await ModuleAPI.getInstance().handleAPI<any, any>(ModuleDAO.APINAME_SELECT_ONE, API_TYPE_ID, query, queryParams, depends_on_api_type_ids);
    // }

    public async getVoById<T extends IDistantVOBase>(API_TYPE_ID: string, id: number): Promise<T> {
        return await ModuleAPI.getInstance().handleAPI<any, any>(ModuleDAO.APINAME_GET_VO_BY_ID, API_TYPE_ID, id);
    }

    public async getVos<T extends IDistantVOBase>(API_TYPE_ID: string): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<any, any>(ModuleDAO.APINAME_GET_VOS, API_TYPE_ID);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}