import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class SendInBlueAdminVueModule extends VueModuleBase {


    public static getInstance(): SendInBlueAdminVueModule {
        if (!SendInBlueAdminVueModule.instance) {
            SendInBlueAdminVueModule.instance = new SendInBlueAdminVueModule();
        }

        return SendInBlueAdminVueModule.instance;
    }

    private static instance: SendInBlueAdminVueModule = null;

    private constructor() {
        super(ModuleSendInBlue.getInstance().name);
    }

    public async initializeAsync() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleSendInBlue.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = new MenuBranch("SendInBlueAdminVueModule", MenuElementBase.PRIORITY_MEDIUM - 1, "fa-calculator", []);

        CRUDComponentManager.getInstance().registerCRUD(
            SendInBlueVO.API_TYPE_ID,
            null,
            new MenuPointer(new MenuLeaf("SendInBlueVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-envelope"), menuBranch),
            this.routes
        );
    }
}