import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../../ts/components/menu/MenuController';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';

export default class SendInBlueAdminVueModule extends VueModuleBase {


    // istanbul ignore next: nothing to test
    public static getInstance(): SendInBlueAdminVueModule {
        if (!SendInBlueAdminVueModule.instance) {
            SendInBlueAdminVueModule.instance = new SendInBlueAdminVueModule();
        }

        return SendInBlueAdminVueModule.instance;
    }

    private static instance: SendInBlueAdminVueModule = null;

    private constructor() {
        super(ModuleSendInBlue.getInstance().name);
        this.policies_needed = [
            ModuleSendInBlue.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {
        if (!this.policies_loaded[ModuleSendInBlue.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleSendInBlue.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "SendInBlueAdminVueModule",
                    "fa-calculator",
                    30 - 1,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            SendInBlueVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleSendInBlue.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "SendInBlueVO",
                "fa-envelope",
                10,
                null,
                null,
                menuBranch.id
            ),
            this.routes
        );
    }
}