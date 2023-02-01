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

            this.set_document_crud();
        }
    }

    public initialize() {
        this.routes.push({
            path: '/documents',
            name: 'documents',
            component: () => import(/* webpackChunkName: "DocumentHandlerComponent" */ './DocumentHandlerComponent')
        });
    }

    private set_document_crud() {
        let document_crud: CRUD<DocumentVO> = CRUDComponentManager.getInstance().cruds_by_api_type_id[DocumentVO.API_TYPE_ID];

        document_crud.updateDatatable.removeFields([
            'file_id'
        ]);
        document_crud.createDatatable.removeFields([
            'file_id'
        ]);
    }
}