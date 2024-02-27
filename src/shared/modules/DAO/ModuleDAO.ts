import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import INamedVO from '../../interfaces/INamedVO';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import IMatroid from '../Matroid/interfaces/IMatroid';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import APIDAOApiTypeAndMatroidsParamsVO, { APIDAOApiTypeAndMatroidsParamsVOStatic } from './vos/APIDAOApiTypeAndMatroidsParamsVO';
import APIDAONamedParamVO, { APIDAONamedParamVOStatic } from './vos/APIDAONamedParamVO';
import APIDAOParamsVO, { APIDAOParamsVOStatic } from './vos/APIDAOParamsVO';
import APIDAOselectUsersForCheckUnicityVO, { APIDAOselectUsersForCheckUnicityVOStatic } from './vos/APIDAOselectUsersForCheckUnicityVO';
import APIDAOTypeLimitOffsetVO, { APIDAOTypeLimitOffsetVOStatic } from './vos/APIDAOTypeLimitOffsetVO';
import CRUDFieldRemoverConfVO from './vos/CRUDFieldRemoverConfVO';
import ComputedDatatableFieldVO from './vos/datatable/ComputedDatatableFieldVO';
import InsertOrDeleteQueryResult from './vos/InsertOrDeleteQueryResult';
import ModuleTableCompositeUniqueKeyVO from './vos/ModuleTableCompositeUniqueKeyVO';

export default class ModuleDAO extends Module {

    public static MODULE_NAME: string = 'DAO';

    public static POLICY_GROUP_OVERALL: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_OVERALL';
    public static POLICY_GROUP_DATAS: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_DATAS';
    public static POLICY_GROUP_MODULES_CONF: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAO.MODULE_NAME + '_MODULES_CONF';

    public static POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDAO.MODULE_NAME + ".CAN_EDIT_REMOVED_CRUD_FIELDS_ACCESS";

    public static PARAM_NAME_MAX_DELETE_PER_QUERY: string = "ModuleDAO.MAX_DELETE_PER_QUERY";
    public static PARAM_NAME_MAX_UPDATE_PER_QUERY: string = "ModuleDAO.MAX_UPDATE_PER_QUERY";

    public static APINAME_selectUsersForCheckUnicity = "selectUsersForCheckUnicity";

    public static APINAME_truncate = "truncate";
    public static APINAME_delete_all_vos_triggers_ok = "delete_all_vos_triggers_ok";

    public static APINAME_DELETE_VOS = "DAO_DELETE_VOS";
    public static APINAME_DELETE_VOS_MULTICONNECTIONS = "DAO_DELETE_VOS_MULTICONNECTIONS";

    public static APINAME_DELETE_VOS_BY_IDS = "DAO_DELETE_VOS_BY_IDS";
    public static APINAME_INSERT_OR_UPDATE_VOS = "DAO_INSERT_OR_UPDATE_VOS";
    public static APINAME_INSERT_VOS = "INSERT_VOS";
    public static APINAME_INSERT_OR_UPDATE_VOS_MULTICONNECTIONS = "DAO_INSERT_OR_UPDATE_VOS_MULTICONNEXIONS";

    public static APINAME_INSERT_OR_UPDATE_VO = "DAO_INSERT_OR_UPDATE_VO";
    public static APINAME_SELECT_ALL = "SELECT_ALL";
    public static APINAME_SELECT_ONE = "SELECT_ONE";

    public static APINAME_GET_VOS = "GET_VOS";
    public static APINAME_GET_NAMED_VO_BY_NAME = "GET_NAMED_VO_BY_NAME";
    public static APINAME_GET_BASE_URL = "GET_BASE_URL";

    public static APINAME_FILTER_VOS_BY_MATROIDS = "FILTER_VOS_BY_MATROIDS";
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

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDAO.instance) {
            ModuleDAO.instance = new ModuleDAO();
        }
        return ModuleDAO.instance;
    }

    private static instance: ModuleDAO = null;

    public selectUsersForCheckUnicity: (name: string, email: string, phone: string, user_id: number) => Promise<boolean> =
        APIControllerWrapper.sah(ModuleDAO.APINAME_selectUsersForCheckUnicity);

    public truncate: (api_type_id: string) => Promise<void> = APIControllerWrapper.sah(ModuleDAO.APINAME_truncate);
    public delete_all_vos_triggers_ok: (api_type_id: string) => Promise<void> = APIControllerWrapper.sah(ModuleDAO.APINAME_delete_all_vos_triggers_ok);
    public getBaseUrl: () => Promise<string> = APIControllerWrapper.sah(ModuleDAO.APINAME_GET_BASE_URL);
    public deleteVOsByIds: (API_TYPE_ID: string, ids: number[]) => Promise<any[]> = APIControllerWrapper.sah(
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

    public deleteVOsMulticonnections: (vos: IDistantVOBase[]) => Promise<any[]> = APIControllerWrapper.sah(ModuleDAO.APINAME_DELETE_VOS_MULTICONNECTIONS);
    public deleteVOs: (vos: IDistantVOBase[]) => Promise<any[]> = APIControllerWrapper.sah(ModuleDAO.APINAME_DELETE_VOS);

    public insertOrUpdateVOs: (vos: IDistantVOBase[]) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS);

    /**
     * Insère les vos, et met l'id retourné par la bdd dans le vo et le retourne également en InsertOrDeleteQueryResult
     */
    public insert_vos: (vos: IDistantVOBase[]) => Promise<InsertOrDeleteQueryResult[]> = APIControllerWrapper.sah(ModuleDAO.APINAME_INSERT_VOS);
    public insertOrUpdateVO: (vo: IDistantVOBase) => Promise<InsertOrDeleteQueryResult> = APIControllerWrapper.sah(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO);
    public getNamedVoByName: <T extends INamedVO>(API_TYPE_ID: string, vo_name: string) => Promise<T> = APIControllerWrapper.sah(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME);
    public getColSumFilterByMatroid: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => Promise<number> = APIControllerWrapper.sah(
        ModuleDAO.APINAME_getColSumFilterByMatroid,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => {
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
    public getVarImportsByMatroidParams: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => Promise<T[]> = APIControllerWrapper.sah(
        ModuleDAO.APINAME_getVarImportsByMatroidParams,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => {
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
    public filterVosByMatroids: <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => Promise<T[]> = APIControllerWrapper.sah(
        ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS,
        null,
        <T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper?: { [matroid_field_id: string]: string }) => {
            if ((!matroids) || (!matroids.length)) {
                return false;
            }

            return true;
        });

    private constructor() {

        super("dao", ModuleDAO.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            null,
            ModuleDAO.APINAME_DELETE_VOS_MULTICONNECTIONS,
            (params: IDistantVOBase[]) => {
                let res: { [type: string]: boolean } = {};

                for (let i in params) {
                    let param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            null,
            ModuleDAO.APINAME_DELETE_VOS,
            (params: IDistantVOBase[]) => {
                let res: { [type: string]: boolean } = {};

                for (let i in params) {
                    let param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<APIDAOParamsVO, any[]>(
            null,
            ModuleDAO.APINAME_DELETE_VOS_BY_IDS,
            (param: APIDAOParamsVO) => [param.API_TYPE_ID],
            APIDAOParamsVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], InsertOrDeleteQueryResult[]>(
            null,
            ModuleDAO.APINAME_INSERT_VOS,
            (params: IDistantVOBase[]) => {
                let res: { [type: string]: boolean } = {};

                for (let i in params) {
                    let param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], InsertOrDeleteQueryResult[]>(
            null,
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS,
            (params: IDistantVOBase[]) => {
                let res: { [type: string]: boolean } = {};

                for (let i in params) {
                    let param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase, InsertOrDeleteQueryResult>(
            null,
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VO,
            (param: IDistantVOBase) => [param._type]
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_getVarImportsByMatroidParams,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, number>(
            null,
            ModuleDAO.APINAME_getColSumFilterByMatroid,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVOStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIDAONamedParamVO, IDistantVOBase>(
            null,
            ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME,
            (param: APIDAONamedParamVO) => [param.API_TYPE_ID],
            APIDAONamedParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<APIDAOTypeLimitOffsetVO, IDistantVOBase[]>(
            null,
            ModuleDAO.APINAME_GET_VOS,
            (API_TYPE_ID: APIDAOTypeLimitOffsetVO) => [API_TYPE_ID.API_TYPE_ID],
            APIDAOTypeLimitOffsetVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, string>(
            null,
            ModuleDAO.APINAME_GET_BASE_URL,
            []
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIDAOselectUsersForCheckUnicityVO, boolean>(
            null,
            ModuleDAO.APINAME_selectUsersForCheckUnicity,
            [UserVO.API_TYPE_ID],
            APIDAOselectUsersForCheckUnicityVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleDAO.APINAME_truncate,
            (param: StringParamVO) => [param.text],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleDAO.APINAME_delete_all_vos_triggers_ok,
            (param: StringParamVO) => [param.text],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.init_ModuleTableCompositeUniqueKeyVO();

        this.init_CRUDFieldRemoverConfVO();
    }

    public get_compute_function_uid(vo_type: string) {
        return vo_type + '__label_function';
    }

    public async late_configuration(is_generator: boolean) {

        for (let i in VOsTypesManager.moduleTables_by_voType) {
            let moduleTable: ModuleTableVO = VOsTypesManager.moduleTables_by_voType[i];
            if (!moduleTable) {
                continue;
            }

            if (moduleTable.table_label_function) {
                ComputedDatatableFieldVO.define_compute_function(this.get_compute_function_uid(moduleTable.vo_type), moduleTable.table_label_function);
            }
        }
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.late_configuration(false);
    }


    public getAccessPolicyName(access_type: string, vo_type: string): string {
        if ((!access_type) || (!vo_type)) {
            return null;
        }
        let isModulesParams: boolean = VOsTypesManager.moduleTables_by_voType[vo_type].isModuleParamTable;
        return (isModulesParams ? ModuleDAO.POLICY_GROUP_MODULES_CONF : ModuleDAO.POLICY_GROUP_DATAS) + '.' + access_type + "." + vo_type;
    }

    private init_CRUDFieldRemoverConfVO(): ModuleTableVO {

        let datatable_fields = [
            ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Vo Type', true, false),
            ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().module_table_field_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Types', false),
            ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().is_update, ModuleTableFieldVO.FIELD_TYPE_boolean, 'CRUD update ?', true, true, true),
        ];

        let res = new ModuleTableVO(this, CRUDFieldRemoverConfVO.API_TYPE_ID, () => new CRUDFieldRemoverConfVO(), datatable_fields, null, "Champs supprimés du CRUD");
        this.datatables.push(res);
        return res;
    }

    private init_ModuleTableCompositeUniqueKeyVO(): ModuleTableVO {
        let datatable_fields = [
            ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().field_names, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Champs - Noms', true),
            ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().field_id_num_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Champs - Liens', true)
                .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID),
            ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Table - Nom', true),
            ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().table_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Table - Lien', true)
                .set_many_to_one_target_moduletable_name(ModuleTableVO.API_TYPE_ID),
            ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>()._bdd_only_index, ModuleTableFieldVO.FIELD_TYPE_string, 'Index pour recherche exacte', true, true).index().unique(true).readonly(),
        ];

        let res = new ModuleTableVO(this, ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, () => new ModuleTableCompositeUniqueKeyVO(), datatable_fields, null, "Clés uniques composites");
        this.datatables.push(res);
        return res;
    }
}