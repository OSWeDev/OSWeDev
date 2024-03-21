import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import INamedVO from '../../interfaces/INamedVO';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import IMatroid from '../Matroid/interfaces/IMatroid';
import Module from '../Module';
import ModuleTableController from './ModuleTableController';
import APIDAOApiTypeAndMatroidsParamsVO, { APIDAOApiTypeAndMatroidsParamsVOStatic } from './vos/APIDAOApiTypeAndMatroidsParamsVO';
import APIDAONamedParamVO, { APIDAONamedParamVOStatic } from './vos/APIDAONamedParamVO';
import APIDAOParamsVO, { APIDAOParamsVOStatic } from './vos/APIDAOParamsVO';
import APIDAOTypeLimitOffsetVO, { APIDAOTypeLimitOffsetVOStatic } from './vos/APIDAOTypeLimitOffsetVO';
import APIDAOselectUsersForCheckUnicityVO, { APIDAOselectUsersForCheckUnicityVOStatic } from './vos/APIDAOselectUsersForCheckUnicityVO';
import CRUDFieldRemoverConfVO from './vos/CRUDFieldRemoverConfVO';
import InsertOrDeleteQueryResult from './vos/InsertOrDeleteQueryResult';
import ModuleTableCompositeUniqueKeyVO from './vos/ModuleTableCompositeUniqueKeyVO';
import ComputedDatatableFieldVO from './vos/datatable/ComputedDatatableFieldVO';

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
            const nettoyage_ids: number[] = [];
            for (const i in ids) {
                if (ids[i]) {
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
                const res: { [type: string]: boolean } = {};

                for (const i in params) {
                    const param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], any[]>(
            null,
            ModuleDAO.APINAME_DELETE_VOS,
            (params: IDistantVOBase[]) => {
                const res: { [type: string]: boolean } = {};

                for (const i in params) {
                    const param = params[i];

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
                const res: { [type: string]: boolean } = {};

                for (const i in params) {
                    const param = params[i];

                    res[param._type] = true;
                }

                return Object.keys(res);
            }
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<IDistantVOBase[], InsertOrDeleteQueryResult[]>(
            null,
            ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS,
            (params: IDistantVOBase[]) => {
                const res: { [type: string]: boolean } = {};

                for (const i in params) {
                    const param = params[i];

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
        this.init_CRUDFieldRemoverConfVO();
        this.init_ModuleTableVO();
        this.init_ModuleTableFieldVO();
        this.init_ModuleTableCompositeUniqueKeyVO();
    }

    public get_compute_function_uid(vo_type: string) {
        return vo_type + '__label_function';
    }

    public async late_configuration(is_generator: boolean) {

        for (const i in ModuleTableController.module_tables_by_vo_type) {
            const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[i];
            if (!moduleTable) {
                continue;
            }

            let label_function = ModuleTableController.table_label_function_by_vo_type[moduleTable.vo_type];
            if (label_function) {
                ComputedDatatableFieldVO.define_compute_function(this.get_compute_function_uid(moduleTable.vo_type), label_function);
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
        return ModuleDAO.POLICY_GROUP_DATAS + '.' + access_type + "." + vo_type;
    }

    private init_CRUDFieldRemoverConfVO() {

        ModuleTableController.create_new(this.name, CRUDFieldRemoverConfVO, null, "Champs supprimés du CRUD");

        ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Vo Type', true, false);
        ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().module_table_field_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Types', false);
        ModuleTableFieldController.create_new(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().is_update, ModuleTableFieldVO.FIELD_TYPE_boolean, 'CRUD update ?', true, true, true);
    }

    private init_ModuleTableCompositeUniqueKeyVO() {
        ModuleTableController.create_new(this.name, ModuleTableCompositeUniqueKeyVO, null, "Clés uniques composites");

        ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().field_names, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Champs - Noms', true);
        ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().field_id_num_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Champs - Liens', true)
            .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Table - Nom', true);
        ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>().table_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Table - Lien', true)
            .set_many_to_one_target_moduletable_name(ModuleTableVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ModuleTableCompositeUniqueKeyVO.API_TYPE_ID, field_names<ModuleTableCompositeUniqueKeyVO>()._bdd_only_index, ModuleTableFieldVO.FIELD_TYPE_string, 'Index pour recherche exacte', true, true).index().unique().readonly();
    }

    private init_ModuleTableFieldVO() {

        const label_field = ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        ModuleTableController.create_new(this.name, ModuleTableFieldVO, label_field, "Format des champs de table");

        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().secure_boolean_switch_only_server_side, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Sécurisé côté serveur', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().foreign_ref_vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'VOType lié', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().module_table_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Table', true).set_many_to_one_target_moduletable_name(ModuleTableVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().module_table_vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'VOType', true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().cascade_on_delete, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Cascade on delete', true, true, true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().do_not_add_to_crud, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ne pas ajouter au CRUD', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().min_values, ModuleTableFieldVO.FIELD_TYPE_int, 'Valeurs min', true, true, 0);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().max_values, ModuleTableFieldVO.FIELD_TYPE_int, 'Valeurs max', true, true, 999);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().force_index, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Toujours indexer', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_readonly, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lecture seule', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().format_localized_time, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Date localisée', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().translatable_params_field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Champ contenant les paramètres de traduction', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_inclusive_data, ModuleTableFieldVO.FIELD_TYPE_boolean, 'La donnée est inclusive - [] vs ()', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_inclusive_ihm, ModuleTableFieldVO.FIELD_TYPE_boolean, 'L\'affichage est inclusif - [] vs ()', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_visible_datatable, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Visible dans les datatable', true, true, true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().enum_values, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Valeurs enum', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().enum_image_values, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Valeurs enum - images', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().enum_color_values, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Valeurs enum - couleurs', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().hidden_print, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masqué pour l\'impression', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_array, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Est un tableau', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().segmentation_type, ModuleTableFieldVO.FIELD_TYPE_int, 'Type de segmentation', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().boolean_icon_true, ModuleTableFieldVO.FIELD_TYPE_string, 'Icone pour true', true, true, "fa-check-circle");
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().boolean_icon_false, ModuleTableFieldVO.FIELD_TYPE_string, 'Icone pour false', true, true, "fa-times-circle");
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().boolean_invert_colors, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Inverser les couleurs', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().return_min_value, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Retourner la valeur min', true, true, true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().return_max_value, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Retourner la valeur max', true, true, true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().max_range_offset, ModuleTableFieldVO.FIELD_TYPE_int, 'Offset de la valeur max', true, true, 0);
        // ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom en base', true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().field_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Type', true);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().field_required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Obligatoire', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().has_default, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Possède une valeur par défaut', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().field_default_value, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Valeur par défaut', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().default_translation, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Traduction par défaut', false);
        ModuleTableFieldController.create_new(ModuleTableFieldVO.API_TYPE_ID, field_names<ModuleTableFieldVO>().is_unique, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Unique', true, true, false);
    }

    private init_ModuleTableVO() {
        const label_field = ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().table_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        ModuleTableController.create_new(this.name, ModuleTableVO, label_field, "Format tables");

        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().full_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom complet', true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().uid, ModuleTableFieldVO.FIELD_TYPE_string, 'UID', true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().is_segmented, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Segmenté', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().is_versioned, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Versionné', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().is_archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().table_segmented_field, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Champ de segmentation', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().table_segmented_field_range_type, ModuleTableFieldVO.FIELD_TYPE_int, 'Type de range', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().table_segmented_field_segment_type, ModuleTableFieldVO.FIELD_TYPE_int, 'Type de segment', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du module', true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().suffix, ModuleTableFieldVO.FIELD_TYPE_string, 'Suffixe', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().prefix, ModuleTableFieldVO.FIELD_TYPE_string, 'Préfixe', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().database, ModuleTableFieldVO.FIELD_TYPE_string, 'Base de données', true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'VOType', true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().label, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Label', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().default_label_field, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Champ de label par défaut', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().importable, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Importable', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().inherit_rights_from_vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Hérite des droits de', false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().is_matroid_table, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Table de matroids', true, true, false);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().any_to_many_default_behaviour_show, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Afficher par défaut les relations many to many', true, true, true);
        ModuleTableFieldController.create_new(ModuleTableVO.API_TYPE_ID, field_names<ModuleTableVO>().mapping_by_api_type_ids, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Mapping des champs par APIType', false);
    }
}