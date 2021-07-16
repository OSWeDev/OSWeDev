import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDocument from '../../../../shared/modules/Document/ModuleDocument';
import DocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../shared/modules/Document/vos/DocumentVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';

export default class DocumentAdminVueModule extends VueModuleBase {

    public static getInstance(): DocumentAdminVueModule {
        if (!DocumentAdminVueModule.instance) {
            DocumentAdminVueModule.instance = new DocumentAdminVueModule();
        }

        return DocumentAdminVueModule.instance;
    }

    private static instance: DocumentAdminVueModule = null;

    private constructor() {

        super(ModuleDocument.getInstance().name);
    }

    public async initializeAsync() {

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleDocument.POLICY_BO_ACCESS)) {

            let menuBranch: MenuElementVO =
                await MenuController.getInstance().declare_menu_element(
                    MenuElementVO.create_new(
                        ModuleDocument.POLICY_BO_ACCESS,
                        VueAppController.getInstance().app_name,
                        "DocumentAdminVueModule",
                        "fa-book",
                        10,
                        null
                    )
                );

            await CRUDComponentManager.getInstance().registerCRUD(
                DocumentVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleDocument.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    DocumentVO.API_TYPE_ID,
                    "fa-book",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
            await CRUDComponentManager.getInstance().registerCRUD(
                DocumentTagVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleDocument.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    DocumentTagVO.API_TYPE_ID,
                    "fa-tag",
                    20,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
            await CRUDComponentManager.getInstance().registerCRUD(
                DocumentTagGroupVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleDocument.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    DocumentTagGroupVO.API_TYPE_ID,
                    "fa-tags",
                    30,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }
    }
}