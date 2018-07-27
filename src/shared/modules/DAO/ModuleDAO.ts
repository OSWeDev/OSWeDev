import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import APIDAOParamVO from './vos/APIDAOParamVO';

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
            (params: IDistantVOBase[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS,
            (params: IDistantVOBase[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase, any>(
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VO,
            (param: IDistantVOBase) => [param._type]
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<any, any>(
            ModuleDAO.APINAME_DB_TX_UPDATE,
            (params: any) => {

                let res: string[] = [];

                if (!params) {
                    return res;
                }

                if (params.deletes) {
                    for (let i in params.deletes) {
                        let param = params.deletes[i];

                        if (res.indexOf(param._type) < 0) {
                            res.push(param._type);
                        }
                    }
                }
                if (params.updates) {
                    for (let i in params.updates) {
                        let param = params.updates[i];

                        if (res.indexOf(param._type) < 0) {
                            res.push(param._type);
                        }
                    }
                }

                return res;
            }
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<APIDAOParamVO, IDistantVOBase>(
            ModuleDAO.APINAME_GET_VO_BY_ID,
            (param: APIDAOParamVO) => [param.API_TYPE_ID],
            APIDAOParamVO.translateCheckAccessParams,
            APIDAOParamVO.URL,
            APIDAOParamVO.translateToURL,
            APIDAOParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, IDistantVOBase[]>(
            ModuleDAO.APINAME_GET_VOS,
            (API_TYPE_ID: StringParamVO) => [API_TYPE_ID.text],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));
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
        return await ModuleAPI.getInstance().handleAPI<string, T>(ModuleDAO.APINAME_GET_VO_BY_ID, API_TYPE_ID, id);
    }

    public async getVos<T extends IDistantVOBase>(API_TYPE_ID: string): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<string, T[]>(ModuleDAO.APINAME_GET_VOS, API_TYPE_ID);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}