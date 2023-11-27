import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';
import ModuleBard from '../../../../shared/modules/Bard/ModuleBard';
import BardConversationVO from '../../../../shared/modules/Bard/vos/BardConversationVO';
import BardMessageVO from '../../../../shared/modules/Bard/vos/BardMessageVO';
import BardConfigurationVO from '../../../../shared/modules/Bard/vos/BardConfigurationVO';

export default class BardChatroomAdminVueModule extends VueModuleBase {

    public static getInstance(): BardChatroomAdminVueModule {
        if (!BardChatroomAdminVueModule.instance) {
            BardChatroomAdminVueModule.instance = new BardChatroomAdminVueModule();
        }

        return BardChatroomAdminVueModule.instance;
    }

    private static instance: BardChatroomAdminVueModule = null;

    private constructor() {
        super(ModuleBard.getInstance().name);

        this.policies_needed = [
            ModuleBard.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (this.policies_loaded[ModuleBard.POLICY_BO_ACCESS]) {
            let menuBranch: MenuElementVO = await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleBard.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "BardChatroomAdminVueModule",
                    "fa-comment",
                    10,
                    null
                )
            );

            await CRUDComponentManager.getInstance().registerCRUD(
                BardConversationVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleBard.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    BardConversationVO.API_TYPE_ID,
                    "fa-comment",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes
            );

            await CRUDComponentManager.getInstance().registerCRUD(
                BardMessageVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleBard.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    BardMessageVO.API_TYPE_ID,
                    "fa-comment",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes
            );

            await CRUDComponentManager.getInstance().registerCRUD(
                BardConfigurationVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleBard.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    BardConfigurationVO.API_TYPE_ID,
                    "fa-cogs",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes
            );
        }
    }
}