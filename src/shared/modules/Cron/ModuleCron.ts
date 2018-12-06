import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import CronWorkerPlanification from './vos/CronWorkerPlanification';

export default class ModuleCron extends Module {

    public static MODULE_NAME: string = "Cron";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleCron.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleCron.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_executeWorkersManually: string = "executeWorkersManually";

    public static getInstance(): ModuleCron {
        if (!ModuleCron.instance) {
            ModuleCron.instance = new ModuleCron();
        }
        return ModuleCron.instance;
    }

    private static instance: ModuleCron = null;

    public datatable_cronworkplan: ModuleTable<CronWorkerPlanification>;

    private constructor() {

        super("cron", ModuleCron.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<void, void>(
            ModuleCron.APINAME_executeWorkersManually,
            [CronWorkerPlanification.API_TYPE_ID]
        ));
    }

    public async executeWorkersManually() {
        ModuleAPI.getInstance().handleAPI(ModuleCron.APINAME_executeWorkersManually);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('planification_uid', ModuleTableField.FIELD_TYPE_string, 'planification_uid', true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('worker_uid', ModuleTableField.FIELD_TYPE_string, 'worker_uid', true),
            new ModuleTableField('date_heure_planifiee', ModuleTableField.FIELD_TYPE_string, 'date_heure_planifiee', true),
            new ModuleTableField('type_recurrence', ModuleTableField.FIELD_TYPE_int, 'type_recurrence', true),
            new ModuleTableField('intervale_recurrence', ModuleTableField.FIELD_TYPE_float, 'intervale_recurrence', true),
        ];

        this.datatable_cronworkplan = new ModuleTable(this, CronWorkerPlanification.API_TYPE_ID, datatable_fields, label_field, "Tâches planifiées");
        this.datatables.push(this.datatable_cronworkplan);
    }
}