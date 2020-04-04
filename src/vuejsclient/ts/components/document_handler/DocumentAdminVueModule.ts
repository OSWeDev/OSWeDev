import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDocument from '../../../../shared/modules/Document/ModuleDocument';
import DocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../shared/modules/Document/vos/DocumentVO';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuBranch from '../menu/vos/MenuBranch';
import MenuLeaf from '../menu/vos/MenuLeaf';
import MenuPointer from '../menu/vos/MenuPointer';

export default class DocumentAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "DocumentAdminVueModule",
        MenuBranch.PRIORITY_ULTRAHIGH,
        "fa-book",
        []
    );

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

        let menuBranch: MenuBranch = DocumentAdminVueModule.DEFAULT_MENU_BRANCH;

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleDocument.POLICY_BO_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                DocumentVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf(DocumentVO.API_TYPE_ID, MenuBranch.PRIORITY_ULTRAHIGH, "fa-book"),
                    menuBranch),
                this.routes);
            CRUDComponentManager.getInstance().registerCRUD(
                DocumentTagVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf(DocumentTagVO.API_TYPE_ID, MenuBranch.PRIORITY_HIGH, "fa-tag"),
                    menuBranch),
                this.routes);
            CRUDComponentManager.getInstance().registerCRUD(
                DocumentTagGroupVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf(DocumentTagGroupVO.API_TYPE_ID, MenuBranch.PRIORITY_MEDIUM, "fa-tags"),
                    menuBranch),
                this.routes);
        }
    }
}