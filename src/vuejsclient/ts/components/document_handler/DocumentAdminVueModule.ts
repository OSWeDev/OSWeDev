import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
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

    // istanbul ignore next: nothing to test
    public static getInstance(): DocumentAdminVueModule {
        if (!DocumentAdminVueModule.instance) {
            DocumentAdminVueModule.instance = new DocumentAdminVueModule();
        }

        return DocumentAdminVueModule.instance;
    }

    private static instance: DocumentAdminVueModule = null;

    private constructor() {

        super(ModuleDocument.getInstance().name);
        this.policies_needed = [
            ModuleDocument.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (this.policies_loaded[ModuleDocument.POLICY_BO_ACCESS]) {

            const menuBranch: MenuElementVO =
                await MenuController.getInstance().declare_menu_element(
                    MenuElementVO.create_new(
                        ModuleDocument.POLICY_BO_ACCESS,
                        VueAppController.APP_NAME_ADMIN,
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
                    VueAppController.APP_NAME_ADMIN,
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
                    VueAppController.APP_NAME_ADMIN,
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
                    VueAppController.APP_NAME_ADMIN,
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

    public initialize() {
        this.routes.push({
            path: '/documents',
            name: 'documents',
            component: () => import('./DocumentHandlerComponent')
        });
    }
}