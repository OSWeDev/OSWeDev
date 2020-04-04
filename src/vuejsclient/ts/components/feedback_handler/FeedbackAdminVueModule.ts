import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuBranch from '../menu/vos/MenuBranch';
import MenuLeaf from '../menu/vos/MenuLeaf';
import MenuPointer from '../menu/vos/MenuPointer';

export default class FeedbackAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "FeedbackAdminVueModule",
        MenuBranch.PRIORITY_ULTRAHIGH,
        "fa-comment",
        []
    );

    public static getInstance(): FeedbackAdminVueModule {
        if (!FeedbackAdminVueModule.instance) {
            FeedbackAdminVueModule.instance = new FeedbackAdminVueModule();
        }

        return FeedbackAdminVueModule.instance;
    }

    private static instance: FeedbackAdminVueModule = null;

    private constructor() {

        super(ModuleFeedback.getInstance().name);
    }

    public async initializeAsync() {

        let menuBranch: MenuBranch = FeedbackAdminVueModule.DEFAULT_MENU_BRANCH;

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleFeedback.POLICY_BO_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                FeedbackVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf(FeedbackVO.API_TYPE_ID, MenuBranch.PRIORITY_ULTRAHIGH, "fa-comment"),
                    menuBranch),
                this.routes);
        }
    }
}