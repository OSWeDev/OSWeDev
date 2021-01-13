import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
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
    public static APINAME_executeWorkerManually: string = "executeWorkerManually";
    public static APINAME_run_manual_task: string = "run_manual_task";

    public static getInstance(): ModuleCron {
        if (!ModuleCron.instance) {
            ModuleCron.instance = new ModuleCron();
        }
        return ModuleCron.instance;
    }

    private static instance: ModuleCron = null;

    public run_manual_task: (name: string) => void = APIControllerWrapper.sah(ModuleCron.APINAME_run_manual_task);
    public executeWorkersManually: () => void = APIControllerWrapper.sah(ModuleCron.APINAME_executeWorkersManually);
    public executeWorkerManually: (worker_uid: string) => void = APIControllerWrapper.sah(ModuleCron.APINAME_executeWorkerManually);

    private constructor() {

        super("cron", ModuleCron.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<void, void>(
            ModuleCron.POLICY_BO_ACCESS,
            ModuleCron.APINAME_executeWorkersManually,
            [CronWorkerPlanification.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleCron.POLICY_BO_ACCESS,
            ModuleCron.APINAME_executeWorkerManually,
            [CronWorkerPlanification.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleCron.POLICY_BO_ACCESS,
            ModuleCron.APINAME_run_manual_task,
            [CronWorkerPlanification.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('planification_uid', ModuleTableField.FIELD_TYPE_string, 'planification_uid', true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('worker_uid', ModuleTableField.FIELD_TYPE_string, 'worker_uid', true),
            new ModuleTableField('date_heure_planifiee', ModuleTableField.FIELD_TYPE_string, 'date_heure_planifiee', false),
            new ModuleTableField('type_recurrence', ModuleTableField.FIELD_TYPE_int, 'type_recurrence', true),
            new ModuleTableField('intervale_recurrence', ModuleTableField.FIELD_TYPE_float, 'intervale_recurrence', true),
        ];

        this.datatables.push(new ModuleTable(this, CronWorkerPlanification.API_TYPE_ID, () => new CronWorkerPlanification(), datatable_fields, label_field, "Tâches planifiées"));
    }
}