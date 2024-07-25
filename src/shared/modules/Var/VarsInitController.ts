import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModulesManager from '../ModulesManager';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class VarsInitController {

    public static pre_registered_var_data_api_type_id_modules_list: { [api_type_id: string]: string[] } = {};
    public static registered_vars_datas_api_type_ids: string[] = [];

    /**
     * On reprend la liste des api_type_id, et pour chacun
     *  Si au moins 1 module est actif, on active l'api_type_id dans registered_vars_datas_api_type_ids
     */
    public static activate_pre_registered_var_data_api_type_id_modules_list() {

        if ((!!VarsInitController.registered_vars_datas_api_type_ids) && (VarsInitController.registered_vars_datas_api_type_ids.length > 0)) {
            // Cas des tests unitaires
            return;
        }

        this.registered_vars_datas_api_type_ids = [];

        for (const api_type_id in VarsInitController.pre_registered_var_data_api_type_id_modules_list) {
            const modules_list = VarsInitController.pre_registered_var_data_api_type_id_modules_list[api_type_id];

            for (const i in modules_list) {
                const module_name = modules_list[i];
                if (ModulesManager.getInstance().getModuleByNameAndRole(module_name, Module.SharedModuleRoleName).actif) {
                    this.registered_vars_datas_api_type_ids.push(api_type_id);
                    break;
                }
            }
        }

        delete VarsInitController.pre_registered_var_data_api_type_id_modules_list;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): VarsInitController {
        if (!VarsInitController.instance) {
            VarsInitController.instance = new VarsInitController();
        }
        return VarsInitController.instance;
    }

    private static instance: VarsInitController = null;

    public register_var_data<T extends VarDataBaseVO>(
        api_type_id: string,
        vo_constructor: { new(): T },
        module: Module = null,
        is_test: boolean = false): ModuleTableVO {
        const var_id = ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>().var_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Var conf');

        if (!VarsInitController.pre_registered_var_data_api_type_id_modules_list[api_type_id]) {
            VarsInitController.pre_registered_var_data_api_type_id_modules_list[api_type_id] = [];
        }

        if ((!module) && (!!is_test)) {
            // Cas des tests unitaires
            VarsInitController.registered_vars_datas_api_type_ids.push(api_type_id);
        } else {
            VarsInitController.pre_registered_var_data_api_type_id_modules_list[api_type_id].push(module.name);
        }

        /**
         * On ajoute un index automatiquement sur tous les champs ranges des vars
         */
        const var_fields: { [field_name: string]: ModuleTableFieldVO } = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[api_type_id];
        for (const i in var_fields) {
            const var_field = var_fields[i];

            switch (var_field.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    var_field.index();
            }
        }

        ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>().value, ModuleTableFieldVO.FIELD_TYPE_float, 'Valeur');
        ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>().value_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, VarDataBaseVO.VALUE_TYPE_COMPUTED).setEnumValues(VarDataBaseVO.VALUE_TYPE_LABELS).index();
        ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>().value_ts, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>()._bdd_only_index, ModuleTableFieldVO.FIELD_TYPE_string, 'Index pour recherche exacte', true, true).index().unique().readonly();
        ModuleTableFieldController.create_new(api_type_id, field_names<VarDataBaseVO>()._bdd_only_is_pixel, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Pixel ? (Card == 1)', true, true, true).index().readonly();

        const datatable = ModuleTableController.create_new(module.name, vo_constructor, null, api_type_id).defineAsMatroid();
        if (!is_test) {
            var_id.set_many_to_one_target_moduletable_name(VarConfVO.API_TYPE_ID);
        }
        return datatable;
    }
}