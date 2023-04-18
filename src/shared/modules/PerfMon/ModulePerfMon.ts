import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import { VOsTypesManager } from '../VO/manager/VOsTypesManager';
import IPerfMonLineInfo from './interfaces/IPerfMonLineInfo';
import PerfMonLineTypeVO from './vos/PerfMonLineTypeVO';
import PerfMonLineVO from './vos/PerfMonLineVO';

export default class ModulePerfMon extends Module {

    public static MODULE_NAME: string = 'PerfMon';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModulePerfMon.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModulePerfMon.MODULE_NAME + ".BO_ACCESS";

    public static getInstance(): ModulePerfMon {
        if (!ModulePerfMon.instance) {
            ModulePerfMon.instance = new ModulePerfMon();
        }
        return ModulePerfMon.instance;
    }

    private static instance: ModulePerfMon = null;

    private constructor() {

        super("perfmon", ModulePerfMon.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];


        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('is_active', ModuleTableField.FIELD_TYPE_boolean, 'Active', true),
        ];
        let datatable = new ModuleTable(this, PerfMonLineTypeVO.API_TYPE_ID, () => new PerfMonLineTypeVO(), datatable_fields, null, "Type de performance");
        this.datatables.push(datatable);


        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur');
        let line_type_id = new ModuleTableField('line_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Type de performance', true);
        let parent_id = new ModuleTableField('parent_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Parent');
        let datatable_fields_line = [
            new ModuleTableField('start_time', ModuleTableField.FIELD_TYPE_float, 'Début', true),
            new ModuleTableField('end_time', ModuleTableField.FIELD_TYPE_float, 'Fin', true),
            new ModuleTableField('is_server', ModuleTableField.FIELD_TYPE_boolean, 'Serveur', true),
            new ModuleTableField('client_tab_id', ModuleTableField.FIELD_TYPE_string, 'Onglet'),
            line_type_id,
            parent_id,
            user_id,
            new ModuleTableField('uid', ModuleTableField.FIELD_TYPE_int, 'UID', true),
        ];
        let datatable_line = new ModuleTable(this, PerfMonLineVO.API_TYPE_ID, () => new PerfMonLineVO(), datatable_fields_line, null, "Performance");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        line_type_id.addManyToOneRelation(datatable);
        parent_id.addManyToOneRelation(datatable_line);
        this.datatables.push(datatable_line);
    }

    public register_perf_line_infos(
        api_type_id: string,
        constructor: () => IPerfMonLineInfo,
        fields: Array<ModuleTableField<any>>,
        module: Module): ModuleTable<any> {
        let perf_line_id = new ModuleTableField('perf_line_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Performance liée', true);

        fields.unshift(perf_line_id);

        let datatable = new ModuleTable(module, api_type_id, constructor, fields, null);
        perf_line_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[PerfMonLineVO.API_TYPE_ID]);
        if (!!module) {
            module.datatables.push(datatable);
        }
        return datatable;
    }
}