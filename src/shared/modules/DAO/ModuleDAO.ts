import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import APIDAOParamVO from './vos/APIDAOParamVO';
import APIDAOParamsVO from './vos/APIDAOParamsVO';
import InsertOrDeleteQueryResult from './vos/InsertOrDeleteQueryResult';

export default class ModuleDAO extends Module {

    public static ACCESS_GROUP_NAME = "DAO_ACCESS";

    public static APINAME_DELETE_VOS = "DAO_DELETE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VOS = "DAO_INSERT_OR_UPDATE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VO = "DAO_INSERT_OR_UPDATE_VO";
    public static APINAME_SELECT_ALL = "SELECT_ALL";
    public static APINAME_SELECT_ONE = "SELECT_ONE";
    public static APINAME_GET_VO_BY_ID = "GET_VO_BY_ID";
    public static APINAME_GET_VOS_BY_IDS = "GET_VOS_BY_IDS";
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
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], InsertOrDeleteQueryResult[]>(
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
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase, InsertOrDeleteQueryResult>(
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VO,
            (param: IDistantVOBase) => [param._type]
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<APIDAOParamsVO, IDistantVOBase[]>(
            ModuleDAO.APINAME_GET_VOS_BY_IDS,
            (param: APIDAOParamsVO) => [param.API_TYPE_ID],
            APIDAOParamsVO.translateCheckAccessParams,
            APIDAOParamsVO.URL,
            APIDAOParamsVO.translateToURL,
            APIDAOParamsVO.translateFromREQ
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

    public async insertOrUpdateVOs(vos: IDistantVOBase[]): Promise<InsertOrDeleteQueryResult[]> {
        return await ModuleAPI.getInstance().handleAPI<IDistantVOBase[], InsertOrDeleteQueryResult[]>(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, vos);
    }

    public async insertOrUpdateVO(vo: IDistantVOBase): Promise<InsertOrDeleteQueryResult> {
        return await ModuleAPI.getInstance().handleAPI<IDistantVOBase, InsertOrDeleteQueryResult>(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, vo);
    }

    public async getVoById<T extends IDistantVOBase>(API_TYPE_ID: string, id: number): Promise<T> {
        return await ModuleAPI.getInstance().handleAPI<string, T>(ModuleDAO.APINAME_GET_VO_BY_ID, API_TYPE_ID, id);
    }

    public async getVosByIds<T extends IDistantVOBase>(API_TYPE_ID: string, ids: number[]): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<string, T[]>(ModuleDAO.APINAME_GET_VOS_BY_IDS, API_TYPE_ID, ids);
    }

    public async getVos<T extends IDistantVOBase>(API_TYPE_ID: string): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<string, T[]>(ModuleDAO.APINAME_GET_VOS, API_TYPE_ID);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}