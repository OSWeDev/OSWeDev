import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class VarsInitController {

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

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarDataBaseVO.VALUE_TYPE_COMPUTED).setEnumValues({
                [VarDataBaseVO.VALUE_TYPE_IMPORT]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_IMPORT],
                [VarDataBaseVO.VALUE_TYPE_COMPUTED]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_COMPUTED]
            }),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('last_reads_ts', ModuleTableField.FIELD_TYPE_tstz_array, 'Dates derniers accès').set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('_bdd_only_index', ModuleTableField.FIELD_TYPE_string, 'Index pour recherche exacte', false, false).index().unique(), // TODO FIXME passer obligatoire quand tous les projets ont migrés en V3 ça sera plus simple
        ]);

        let datatable = new ModuleTable(module, api_type_id, constructor, var_fields, null).defineAsMatroid();
        if (!is_test) {
            var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        }
        if (!!module) {
            module.datatables.push(datatable);
        }
        return datatable;
    }
}