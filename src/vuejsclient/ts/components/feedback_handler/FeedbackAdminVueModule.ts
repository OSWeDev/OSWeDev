import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';

export default class FeedbackAdminVueModule extends VueModuleBase {

    public static getInstance(): FeedbackAdminVueModule {
        if (!FeedbackAdminVueModule.instance) {
            FeedbackAdminVueModule.instance = new FeedbackAdminVueModule();
        }

        return FeedbackAdminVueModule.instance;
    }

    private static instance: FeedbackAdminVueModule = null;

    private constructor() {

        super(ModuleFeedback.getInstance().name);
        this.policies_needed = [
            ModuleFeedback.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (this.policies_loaded[ModuleFeedback.POLICY_BO_ACCESS]) {
            let menuBranch: MenuElementVO =
                await MenuController.getInstance().declare_menu_element(
                    MenuElementVO.create_new(
                        ModuleFeedback.POLICY_BO_ACCESS,
                        VueAppController.getInstance().app_name,
                        "FeedbackAdminVueModule",
                        "fa-comment",
                        10,
                        null
                    )
                );

            await CRUDComponentManager.getInstance().registerCRUD(
                FeedbackVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleFeedback.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    FeedbackVO.API_TYPE_ID,
                    "fa-comment",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }
    }
}