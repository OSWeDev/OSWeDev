import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import BGThreadVO from './vos/BGThreadVO';

export default class ModuleBGThread extends Module {

    public static MODULE_NAME: string = "BGThread";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleBGThread.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleBGThread.MODULE_NAME + ".BO_ACCESS";

    private static instance: ModuleBGThread = null;

    /**
     * Méthode pour récupérer les ports des workers apibgthread loadbalancés
     * @returns les ports des apibgthreads workers
     */
    public get_apibgthread_ports: () => Promise<number[]> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleBGThread>().get_apibgthread_ports);

    private constructor() {

        super("bgthread", ModuleBGThread.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleBGThread {
        if (!ModuleBGThread.instance) {
            ModuleBGThread.instance = new ModuleBGThread();
        }
        return ModuleBGThread.instance;
    }

    public initialize() {
        const label_field = ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().last_up_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Dernière exécution', false).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableController.create_new(this.name, BGThreadVO, label_field, "BGThreads");
    }

    public registerApis(): void {
        APIControllerWrapper.registerApi(GetAPIDefinition.new<void, number[]>(
            null,
            this.name,
            reflect<ModuleBGThread>().get_apibgthread_ports,
            null,
        ));
    }
}