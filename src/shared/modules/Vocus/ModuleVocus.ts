import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import APIDAOParamVO, { APIDAOParamVOStatic } from '../DAO/vos/APIDAOParamVO';
import Module from '../Module';
import { VOsTypesManager } from '../VO/manager/VOsTypesManager';
import VocusInfoVO from './vos/VocusInfoVO';

export default class ModuleVocus extends Module {

    public static MODULE_NAME: string = "Vocus";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVocus.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVocus.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_getVosRefsById = "getVosRefsById";

    public static getInstance(): ModuleVocus {
        if (!ModuleVocus.instance) {
            ModuleVocus.instance = new ModuleVocus();
        }
        return ModuleVocus.instance;
    }

    private static instance: ModuleVocus = null;

    /**
     * Par définition on ne peut pas chercher des refs sur un type segmenté puisqu'on ne peut pas ref un type segmenté
     * @param API_TYPE_ID
     * @param id
     */
    public getVosRefsById: (API_TYPE_ID: string, id: number) => Promise<VocusInfoVO[]> = APIControllerWrapper.sah(ModuleVocus.APINAME_getVosRefsById);

    private constructor() {

        super("vocus", ModuleVocus.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        // cas particulier d'une interface qui dépend de tous les types potentiellement
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOParamVO, VocusInfoVO[]>(
            ModuleVocus.POLICY_BO_ACCESS,
            ModuleVocus.APINAME_getVosRefsById,
            Object.keys(VOsTypesManager.moduleTables_by_voType),
            APIDAOParamVOStatic
        ));
    }
}