import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import MessageModuleTableFieldTypeController from '../../../../../shared/modules/Animation/fields/message_module/MessageModuleTableFieldTypeController';
import ReponseTableFieldTypeController from '../../../../../shared/modules/Animation/fields/reponse/ReponseTableFieldTypeController';
import ModuleAnimation from '../../../../../shared/modules/Animation/ModuleAnimation';
import AnimationModuleVO from '../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationParametersVO from '../../../../../shared/modules/Animation/vos/AnimationParametersVO';
import AnimationQRVO from '../../../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationThemeVO from '../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../../../shared/modules/Animation/vos/AnimationUserQRVO';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import VueModuleBase from '../../../modules/VueModuleBase';
import CRUDComponentManager from '../../crud/CRUDComponentManager';
import MenuBranch from '../../menu/vos/MenuBranch';
import MenuElementBase from '../../menu/vos/MenuElementBase';
import MenuLeaf from '../../menu/vos/MenuLeaf';
import MenuPointer from '../../menu/vos/MenuPointer';
import MessageModuleCreateUpdateComponent from './create_update_component/message_module/MessageModuleCreateUpdateComponent';
import ReponseCreateUpdateComponent from './create_update_component/reponse/ReponseCreateUpdateComponent';
import MessageModuleReadComponent from './read_component/message_module/MessageModuleReadComponent';
import ReponseReadComponent from './read_component/reponse/ReponseReadComponent';

export default class AnimationAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "AnimationAdminVueModule",
        MenuElementBase.PRIORITY_MEDIUM,
        "fa-graduation-cap",
        []
    );

    public static getInstance(): AnimationAdminVueModule {
        if (!AnimationAdminVueModule.instance) {
            AnimationAdminVueModule.instance = new AnimationAdminVueModule();
        }

        return AnimationAdminVueModule.instance;
    }

    private static instance: AnimationAdminVueModule = null;

    private constructor() {
        super(ModuleAnimation.getInstance().name);
    }

    public async initializeAsync() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAnimation.POLICY_BO_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationParametersVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationParametersVO", MenuElementBase.PRIORITY_MEDIUM, "fa-cogs"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationThemeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationThemeVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationModuleVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationModuleVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationQRVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationQRVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserModuleVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationUserModuleVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserQRVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationUserQRVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
            ),
            this.routes
        );

        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(MessageModuleTableFieldTypeController.getInstance().name, MessageModuleReadComponent, MessageModuleCreateUpdateComponent);
        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(ReponseTableFieldTypeController.getInstance().name, ReponseReadComponent, ReponseCreateUpdateComponent);
    }
}