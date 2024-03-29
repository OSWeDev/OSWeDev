import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ModulesManager from '../ModulesManager';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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

        for (let api_type_id in VarsInitController.pre_registered_var_data_api_type_id_modules_list) {
            let modules_list = VarsInitController.pre_registered_var_data_api_type_id_modules_list[api_type_id];

            for (let i in modules_list) {
                let module_name = modules_list[i];
                if (ModulesManager.getInstance().modules_by_name[module_name].getModuleComponentByRole(Module.SharedModuleRoleName).actif) {
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

    public register_var_data(
        api_type_id: string,
        constructor: () => VarDataBaseVO,
        var_fields: Array<ModuleTableField<any>>,
        module: Module = null,
        is_test: boolean = false): ModuleTable<any> {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf');

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
        for (let i in var_fields) {
            let var_field = var_fields[i];

            switch (var_field.field_type) {
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    var_field.index();
            }
        }

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarDataBaseVO.VALUE_TYPE_COMPUTED).setEnumValues(VarDataBaseVO.VALUE_TYPE_LABELS).index(),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('last_reads_ts', ModuleTableField.FIELD_TYPE_tstz_array, 'Dates derniers accès').set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('_bdd_only_index', ModuleTableField.FIELD_TYPE_string, 'Index pour recherche exacte', true, true).index().unique(true).readonly(),
            new ModuleTableField('_bdd_only_is_pixel', ModuleTableField.FIELD_TYPE_boolean, 'Pixel ? (Card == 1)', true, true, true).index().readonly(),
        ]);

        let datatable = new ModuleTable(module, api_type_id, constructor, var_fields, null).defineAsMatroid();
        if (!is_test) {
            var_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        }
        if (!!module) {
            module.datatables.push(datatable);
        }
        return datatable;
    }
}