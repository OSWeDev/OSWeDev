import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import OseliaChatVO from './vos/OseliaChatVO';

export default class ModuleOselia extends Module {

    public static MODULE_NAME: string = 'Oselia';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleOselia.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.BO_ACCESS';

    /**
     * Droit d'accès aux discussions sur le front
     */
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_MESSAGE_FEEDBACK_ACCESS';
    public static POLICY_THREAD_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_FEEDBACK_ACCESS';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleOselia {
        if (!ModuleOselia.instance) {
            ModuleOselia.instance = new ModuleOselia();
        }
        return ModuleOselia.instance;
    }

    private static instance: ModuleOselia = null;

    private constructor() {

        super("oselia", ModuleOselia.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.initializeOseliaChatVO();
    }

    public initializeOseliaChatVO() {
        const regex = ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().regex, ModuleTableFieldVO.FIELD_TYPE_string, 'Regex', true);
        const partenaire_code = ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().partenaire_code, ModuleTableFieldVO.FIELD_TYPE_string, 'Code partenaire', true);
        const fields = [
            regex,
            partenaire_code
        ];

        const table = ModuleTableController.create_new(this.name, OseliaChatVO, null, 'Oselia - Chat');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaChatVO.API_TYPE_ID]);
    }
}