import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModulePerfMon from '../PerfMon/ModulePerfMon';
import VOsTypesManager from '../VOsTypesManager';
import DSControllerPMLInfoVO from './performances/vos/DSControllerPMLInfoVO';
import MatroidBasePMLInfoVO from './performances/vos/MatroidBasePMLInfoVO';
import VarControllerPMLInfoVO from './performances/vos/VarControllerPMLInfoVO';
import VarConfVO from './vos/VarConfVO';

export default class VarsPerfMonController {

    public static getInstance(): VarsPerfMonController {
        if (!VarsPerfMonController.instance) {
            VarsPerfMonController.instance = new VarsPerfMonController();
        }
        return VarsPerfMonController.instance;
    }

    private static instance: VarsPerfMonController = null;

    protected constructor() {
    }

    public initialize_VarControllerPMLInfosVO(var_module: Module) {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Variable');
        ModulePerfMon.getInstance().register_perf_line_infos(
            VarControllerPMLInfoVO.API_TYPE_ID, () => new VarControllerPMLInfoVO(),
            [
                var_id
            ], var_module);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }

    public initialize_DSControllerPMLInfosVO(var_module: Module) {

        ModulePerfMon.getInstance().register_perf_line_infos(
            DSControllerPMLInfoVO.API_TYPE_ID, () => new DSControllerPMLInfoVO(),
            [
                new ModuleTableField('ds_name', ModuleTableField.FIELD_TYPE_string, 'DataSource')
            ], var_module);
    }

    public initialize_MatroidBasePMLInfoVO(var_module: Module) {

        ModulePerfMon.getInstance().register_perf_line_infos(
            MatroidBasePMLInfoVO.API_TYPE_ID, () => new MatroidBasePMLInfoVO(),
            [
                new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'Type Matroid'),
                new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'Field ID'),
                new ModuleTableField('range_type', ModuleTableField.FIELD_TYPE_int, 'Type Range'),
                new ModuleTableField('segment_type', ModuleTableField.FIELD_TYPE_int, 'Type Segment'),
                new ModuleTableField('min_as_number', ModuleTableField.FIELD_TYPE_int, 'Min'),
                new ModuleTableField('max_as_number', ModuleTableField.FIELD_TYPE_int, 'Max'),
                new ModuleTableField('is_max_range', ModuleTableField.FIELD_TYPE_boolean, 'MaxRange'),
                new ModuleTableField('cardinal', ModuleTableField.FIELD_TYPE_int, 'Cardinal')
            ], var_module);
    }
}