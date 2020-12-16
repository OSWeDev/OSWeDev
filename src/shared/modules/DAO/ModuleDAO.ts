import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import INamedVO from '../../interfaces/INamedVO';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import IRange from '../DataRender/interfaces/IRange';
import NumRange from '../DataRender/vos/NumRange';
import IMatroid from '../Matroid/interfaces/IMatroid';
import Module from '../Module';
import VOsTypesManager from '../VOsTypesManager';
import APIDAOApiTypeAndMatroidsParamsVO, { APIDAOApiTypeAndMatroidsParamsVOStatic } from './vos/APIDAOApiTypeAndMatroidsParamsVO';
import APIDAOIdsRangesParamsVO, { APIDAOIdsRangesParamsVOStatic } from './vos/APIDAOIdsRangesParamsVO';
import APIDAONamedParamVO, { APIDAONamedParamVOStatic } from './vos/APIDAONamedParamVO';
import APIDAOParamsVO, { APIDAOParamsVOStatic } from './vos/APIDAOParamsVO';
import APIDAOParamVO, { APIDAOParamVOStatic } from './vos/APIDAOParamVO';
import APIDAORefFieldParamsVO, { APIDAORefFieldParamsVOStatic } from './vos/APIDAORefFieldParamsVO';
import APIDAORefFieldsAndFieldsStringParamsVO, { APIDAORefFieldsAndFieldsStringParamsVOStatic } from './vos/APIDAORefFieldsAndFieldsStringParamsVO';
import APIDAORefFieldsParamsVO, { APIDAORefFieldsParamsVOStatic } from './vos/APIDAORefFieldsParamsVO';
import InsertOrDeleteQueryResult from './vos/InsertOrDeleteQueryResult';

export default class ModuleDAO extends Module {

    public static MODULE_NAME: string = 'DAO';

    public static POLICY_GROUP_OVERALL: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_OVERALL';
    public static POLICY_GROUP_DATAS: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_DATAS';
    public static POLICY_GROUP_MODULES_CONF: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_MODULES_CONF';

    public static APINAME_truncate = "truncate";
    public static APINAME_DELETE_VOS = "DAO_DELETE_VOS";
    public static APINAME_DELETE_VOS_BY_IDS = "DAO_DELETE_VOS_BY_IDS";
    public static APINAME_INSERT_OR_UPDATE_VOS = "DAO_INSERT_OR_UPDATE_VOS";
    public static APINAME_INSERT_OR_UPDATE_VO = "DAO_INSERT_OR_UPDATE_VO";
    public static APINAME_SELECT_ALL = "SELECT_ALL";
    public static APINAME_SELECT_ONE = "SELECT_ONE";

    public static APINAME_GET_VO_BY_ID = "GET_VO_BY_ID";
    public static APINAME_GET_VOS_BY_IDS = "GET_VOS_BY_IDS";
    public static APINAME_GET_VOS_BY_IDS_RANGES = "GET_VOS_BY_IDS_RANGES";
    public static APINAME_GET_VOS = "GET_VOS";
    // public static APINAME_FILTER_VOS_BY_FIELD_RANGES = "FILTER_VOS_BY_FIELD_RANGES";
    // public static APINAME_FILTER_VOS_BY_FIELD_RANGES_INTERSECTIONS = "FILTER_VOS_BY_FIELD_RANGES_INTERSECTIONS";
    public static APINAME_GET_VOS_BY_REFFIELD_IDS = "GET_VOS_BY_REFFIELD_IDS";
    public static APINAME_GET_VOS_BY_REFFIELDS_IDS = "GET_VOS_BY_REFFIELDS_IDS";
    public static APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING = "GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING";
    public static APINAME_GET_NAMED_VO_BY_NAME = "GET_NAMED_VO_BY_NAME";
    public static APINAME_GET_BASE_URL = "GET_BASE_URL";
    // public static APINAME_GET_VOS_BY_EXACT_FIELD_RANGE = "GET_VOS_BY_EXACT_FIELD_RANGE";

    public static APINAME_GET_VOS_BY_EXACT_MATROIDS = "GET_VOS_BY_EXACT_MATROIDS";
    public static APINAME_FILTER_VOS_BY_MATROIDS = "FILTER_VOS_BY_MATROIDS";
    public static APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS = "FILTER_VOS_BY_MATROIDS_INTERSECTIONS";
    public static APINAME_getVarImportsByMatroidParams = "getVarImportsByMatroidParams";

    // Optimisation pour les vars initialement
    public static APINAME_getColSumFilterByMatroid = "getColSumFilterByMatroid";

    public static DAO_ACCESS_TYPE_LIST_LABELS: string = "LIST_LABELS";
    // inherit DAO_ACCESS_TYPE_LIST_LABELS
    public static DAO_ACCESS_TYPE_READ: string = "READ";
    // inherit DAO_ACCESS_TYPE_READ
    public static DAO_ACCESS_TYPE_INSERT_OR_UPDATE: string = "INSERT_OR_UPDATE";
    // inherit DAO_ACCESS_TYPE_READ
    public static DAO_ACCESS_TYPE_DELETE: string = "DELETE";

    public static DAO_ACCESS_QUERY: string = ModuleDAO.POLICY_GROUP_OVERALL + '.' + "QUERY";

    public static getInstance() {
        if (!ModuleDAO.instance) {
            ModuleDAO.instance = new ModuleDAO();
        }
        return ModuleDAO.instance;
    }

    private static instance: ModuleDAO = null;

    public getVosByRefFieldsIdsAndFieldsString: <T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string, ids1: number[],
        field_name2?: string, values2?: string[],
        field_name3?: string, values3?: string[]) => Promise<T[]> = ModuleAPI.sah(
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING,
            null, (
                API_TYPE_ID: string,
                field_name1: string, ids1: number[],
                field_name2: string, values2: string[],
                field_name3: string, values3: string[]) => {
            if (field_name1 && ((!ids1) || (!ids1.length))) {
                return false;
            }
            if (field_name2 && ((!values2) || (!values2.length))) {
                return false;
            }
            if (field_name3 && ((!values3) || (!values3.length))) {
                return false;
            }
            return true;
        });

    public truncate: (api_type_id: string) => Promise<void> = ModuleAPI.sah(ModuleDAO.APINAME_truncate);
    public getBaseUrl: () => Promise<string> = ModuleAPI.sah(ModuleDAO.APINAME_GET_BASE_URL);
    public deleteVOsByIds: (API_TYPE_ID: string, ids: number[]) => Promise<any[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_DELETE_VOS_BY_IDS,
        null,
        (API_TYPE_ID: string, ids: number[]) => {
            let nettoyage_ids: number[] = [];
            for (let i in ids) {
                if (!!ids[i]) {
                    nettoyage_ids.push(ids[i]);
                }
            }

            if ((!nettoyage_ids) || (!nettoyage_ids.length)) {
                return false;
            }

            return true;
        });
    public deleteVOs: (vos: IDistantVOBase[]) => Promise<any[]> = ModuleAPI.sah(ModuleDAO.APINAME_DELETE_VOS);
    public insertOrUpdateVOs: (vos: IDistantVOBase[]) => Promise<InsertOrDeleteQueryResult[]> = ModuleAPI.sah(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS);
    public insertOrUpdateVO: (vo: IDistantVOBase) => Promise<InsertOrDeleteQueryResult> = ModuleAPI.sah(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO);
    public getNamedVoByName: <T extends INamedVO>(API_TYPE_ID: string, vo_name: string) => Promise<T> = ModuleAPI.sah(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME);
    public getVoById: <T extends IDistantVOBase>(API_TYPE_ID: string, id: number, segmentation_ranges?: Array<IRange<any>>) => Promise<T> = ModuleAPI.sah(ModuleDAO.APINAME_GET_VO_BY_ID);
    public getVosByIds: <T extends IDistantVOBase>(API_TYPE_ID: string, ids: number[]) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_GET_VOS_BY_IDS,
        null,
        (API_TYPE_ID: string, ids: number[]) => {
            let nettoyage_ids: number[] = [];
            for (let i in ids) {
                if (!!ids[i]) {
                    nettoyage_ids.push(ids[i]);
                }
            }

            if ((!nettoyage_ids) || (!nettoyage_ids.length)) {
                return false;
            }

            return true;
        });
    public getVosByIdsRanges: <T extends IDistantVOBase>(API_TYPE_ID: string, ranges: NumRange[]) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_GET_VOS_BY_IDS_RANGES,
        null,
        (API_TYPE_ID: string, ranges: NumRange[]) => {
            if ((!ranges) || (!ranges.length)) {
                return false;
            }

            return true;
        });
    public getVosByExactMatroids: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_GET_VOS_BY_EXACT_MATROIDS,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });
    public getColSumFilterByMatroid: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => Promise<number> = ModuleAPI.sah(
        ModuleDAO.APINAME_getColSumFilterByMatroid,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });

    /**
     * Retourne tous les matroids inclus les matroids en param
     * IDEM filterVosByMatroids mais avec un contrôle du type de data importée
     * @param API_TYPE_ID
     * @param matroids
     * @param fields_ids_mapper
     */
    public getVarImportsByMatroidParams: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_getVarImportsByMatroidParams,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });

    /**
     * Retourne tous les matroids inclus les matroids en param
     * @param API_TYPE_ID
     * @param matroids
     * @param fields_ids_mapper
     */
    public filterVosByMatroids: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });

    /**
     * Retourne tous les matroids intersectant les matroids en param
     * @param API_TYPE_ID
     * @param matroids
     * @param fields_ids_mapper
     */
    public filterVosByMatroidsIntersections: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => Promise<T[]> = ModuleAPI.sah(
        ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });

    public getVosByRefFieldIds: <T extends IDistantVOBase>(API_TYPE_ID: string, field_name: string, ids: number[]) => Promise<T[]> = ModuleAPI.sah(ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS);
    public getVosByRefFieldsIds: <T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string, ids1: number[],
        field_name2?: string, ids2?: number[],
        field_name3?: string, ids3?: number[]) => Promise<T[]> = ModuleAPI.sah(
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS,
            null,
            (
                API_TYPE_ID: string,
                field_name1: string, ids1: number[],
                field_name2?: string, ids2?: number[],
                field_name3?: string, ids3?: number[]) => {

                if (field_name1 && ((!ids1) || (!ids1.length))) {
                    return false;
                }
                if (field_name2 && ((!ids2) || (!ids2.length))) {
                    return false;
                }
                if (field_name3 && ((!ids3) || (!ids3.length))) {
                    return false;
                }
                return true;
            });

    public getVos: <T extends IDistantVOBase>(API_TYPE_ID: string) => Promise<T[]> = ModuleAPI.sah(ModuleDAO.APINAME_GET_VOS);

    private constructor() {

        super("dao", ModuleDAO.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            null,
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
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APIDAOParamsVO, any[]>(
            null,
            ModuleDAO.APINAME_DELETE_VOS_BY_IDS,
            (param: APIDAOParamsVO) => [param.API_TYPE_ID],
            APIDAOParamsVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IDistantVOBase[], InsertOrDeleteQueryResult[]>(
            null,
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
            null,
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VO,
            (param: IDistantVOBase) => [param._type]
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_IDS,
            (param: APIDAOParamsVO) => [param.API_TYPE_ID],
            APIDAOParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOIdsRangesParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_IDS_RANGES,
            (param: APIDAOIdsRangesParamsVO) => [param.API_TYPE_ID],
            APIDAOIdsRangesParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_getVarImportsByMatroidParams,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, number>(
            null,
            ModuleDAO.APINAME_getColSumFilterByMatroid,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_EXACT_MATROIDS,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAORefFieldParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS,
            (param: APIDAORefFieldParamsVO) => [param.API_TYPE_ID],
            APIDAORefFieldParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAORefFieldsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS,
            (param: APIDAORefFieldsParamsVO) => [param.API_TYPE_ID],
            APIDAORefFieldsParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAORefFieldsAndFieldsStringParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING,
            (param: APIDAORefFieldsAndFieldsStringParamsVO) => [param.API_TYPE_ID],
            APIDAORefFieldsAndFieldsStringParamsVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAONamedParamVO, IDistantVOBase>(
            null,
            ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME,
            (param: APIDAONamedParamVO) => [param.API_TYPE_ID],
            APIDAONamedParamVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOParamVO, IDistantVOBase>(
            null,
            ModuleDAO.APINAME_GET_VO_BY_ID,
            (param: APIDAOParamVO) => [param.API_TYPE_ID],
            APIDAOParamVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS,
            (API_TYPE_ID: StringParamVO) => [API_TYPE_ID.text],
            StringParamVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, string>(
            null,
            ModuleDAO.APINAME_GET_BASE_URL,
            []
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleDAO.APINAME_truncate,
            (param: StringParamVO) => [param.text],
            StringParamVOStatic
        ));

    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public getAccessPolicyName(access_type: string, vo_type: string): string {
        if ((!access_type) || (!vo_type)) {
            return null;
        }
        let isModulesParams: boolean = VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].isModuleParamTable;
        return (isModulesParams ? ModuleDAO.POLICY_GROUP_MODULES_CONF : ModuleDAO.POLICY_GROUP_DATAS) + '.' + access_type + "." + vo_type;
    }
}