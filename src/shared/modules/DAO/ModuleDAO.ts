import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import APIDAOParamVO from './vos/APIDAOParamVO';
import APIDAOParamsVO from './vos/APIDAOParamsVO';
import InsertOrDeleteQueryResult from './vos/InsertOrDeleteQueryResult';
import APIDAORefFieldParamsVO from './vos/APIDAORefFieldParamsVO';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import INamedVO from '../../interfaces/INamedVO';
import APIDAONamedParamVO from './vos/APIDAONamedParamVO';
import APIDAORefFieldsParamsVO from './vos/APIDAORefFieldsParamsVO';

export default class ModuleDAO extends Module {

    public static MODULE_NAME: string = 'DAO';

    public static POLICY_GROUP_OVERALL: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_OVERALL';
    public static POLICY_GROUP_DATAS: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_DATAS';
    public static POLICY_GROUP_MODULES_CONF: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_MODULES_CONF';

    public static APINAME_DELETE_VOS = "DAO_DELETE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VOS = "DAO_INSERT_OR_UPDATE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VO = "DAO_INSERT_OR_UPDATE_VO";
    public static APINAME_SELECT_ALL = "SELECT_ALL";
    public static APINAME_SELECT_ONE = "SELECT_ONE";
    public static APINAME_GET_VO_BY_ID = "GET_VO_BY_ID";
    public static APINAME_GET_VOS_BY_IDS = "GET_VOS_BY_IDS";
    public static APINAME_GET_VOS = "GET_VOS";
    public static APINAME_GET_VOS_BY_REFFIELD_IDS = "GET_VOS_BY_REFFIELD_IDS";
    public static APINAME_GET_VOS_BY_REFFIELDS_IDS = "GET_VOS_BY_REFFIELDS_IDS";
    public static APINAME_GET_NAMED_VO_BY_NAME = "GET_NAMED_VO_BY_NAME";

    public static getInstance() {
        if (!ModuleDAO.instance) {
            ModuleDAO.instance = new ModuleDAO();
        }
        return ModuleDAO.instance;
    }

    private static instance: ModuleDAO = null;

    private constructor() {

        super("dao", ModuleDAO.MODULE_NAME);
        this.forceActivationOnInstallation();
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

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<APIDAORefFieldParamsVO, IDistantVOBase[]>(
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS,
            (param: APIDAORefFieldParamsVO) => [param.API_TYPE_ID],
            APIDAORefFieldParamsVO.translateCheckAccessParams,
            APIDAORefFieldParamsVO.URL,
            APIDAORefFieldParamsVO.translateToURL,
            APIDAORefFieldParamsVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<APIDAORefFieldsParamsVO, IDistantVOBase[]>(
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS,
            (param: APIDAORefFieldsParamsVO) => [param.API_TYPE_ID],
            APIDAORefFieldsParamsVO.translateCheckAccessParams,
            APIDAORefFieldsParamsVO.URL,
            APIDAORefFieldsParamsVO.translateToURL,
            APIDAORefFieldsParamsVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<APIDAONamedParamVO, IDistantVOBase>(
            ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME,
            (param: APIDAONamedParamVO) => [param.API_TYPE_ID],
            APIDAONamedParamVO.translateCheckAccessParams,
            APIDAONamedParamVO.URL,
            APIDAONamedParamVO.translateToURL,
            APIDAONamedParamVO.translateFromREQ
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

    public async getNamedVoByName<T extends INamedVO>(API_TYPE_ID: string, vo_name: string): Promise<T> {
        return await ModuleAPI.getInstance().handleAPI<APIDAONamedParamVO, T>(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME, API_TYPE_ID, vo_name);
    }

    public async getVoById<T extends IDistantVOBase>(API_TYPE_ID: string, id: number): Promise<T> {
        return await ModuleAPI.getInstance().handleAPI<string, T>(ModuleDAO.APINAME_GET_VO_BY_ID, API_TYPE_ID, id);
    }

    public async getVosByIds<T extends IDistantVOBase>(API_TYPE_ID: string, ids: number[]): Promise<T[]> {
        if ((!ids) || (!ids.length)) {
            return null;
        }
        return await ModuleAPI.getInstance().handleAPI<string, T[]>(ModuleDAO.APINAME_GET_VOS_BY_IDS, API_TYPE_ID, ids);
    }

    public async getVosByRefFieldIds<T extends IDistantVOBase>(API_TYPE_ID: string, field_name: string, ids: number[]): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<APIDAORefFieldParamsVO, T[]>(ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS, API_TYPE_ID, field_name, ids);
    }

    public async getVosByRefFieldsIds<T extends IDistantVOBase>(
        API_TYPE_ID: string, field_name1: string, ids1: number[], field_name2: string = null, ids2: number[] = null, field_name3: string = null, ids3: number[] = null): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<APIDAORefFieldsParamsVO, T[]>(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS, API_TYPE_ID, field_name1, ids1, field_name2, ids2, field_name3, ids3);
    }

    public async getVos<T extends IDistantVOBase>(API_TYPE_ID: string): Promise<T[]> {
        return await ModuleAPI.getInstance().handleAPI<string, T[]>(ModuleDAO.APINAME_GET_VOS, API_TYPE_ID);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}