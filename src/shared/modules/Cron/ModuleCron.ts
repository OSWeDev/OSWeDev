import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import CronWorkerPlanification from './vos/CronWorkerPlanification';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';

export default class ModuleCron extends Module {

    public static APINAME_executeWorkers: string = "executeWorkers";

    public static getInstance(): ModuleCron {
        if (!ModuleCron.instance) {
            ModuleCron.instance = new ModuleCron();
        }
        return ModuleCron.instance;
    }

    private static instance: ModuleCron = null;

    private constructor() {

        super("cron", "Cron");
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<void, void>(
            ModuleCron.APINAME_executeWorkers,
            [CronWorkerPlanification.API_TYPE_ID]
        ));
    }

    public async executeWorkers() {
        ModuleAPI.getInstance().handleAPI(ModuleCron.APINAME_executeWorkers);
    }

    public datatable_cronworkplan: ModuleTable<CronWorkerPlanification>;

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