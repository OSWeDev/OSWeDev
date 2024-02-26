import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import LangVO from '../Translation/vos/LangVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import DocumentDocumentTagVO from './vos/DocumentDocumentTagVO';
import DocumentLangVO from './vos/DocumentLangVO';
import DocumentRoleVO from './vos/DocumentRoleVO';
import DocumentTagDocumentTagGroupVO from './vos/DocumentTagDocumentTagGroupVO';
import DocumentTagGroupLangVO from './vos/DocumentTagGroupLangVO';
import DocumentTagGroupVO from './vos/DocumentTagGroupVO';
import DocumentTagLangVO from './vos/DocumentTagLangVO';
import DocumentTagVO from './vos/DocumentTagVO';
import DocumentVO from './vos/DocumentVO';

export default class ModuleDocument extends Module {

    public static MODULE_NAME: string = 'Document';

    public static APINAME_get_ds_by_user_lang: string = "get_ds_by_user_lang";
    public static APINAME_get_dts_by_user_lang: string = "get_dts_by_user_lang";
    public static APINAME_get_dtgs_by_user_lang: string = "get_dtgs_by_user_lang";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDocument.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDocument.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDocument.MODULE_NAME + '.FO_ACCESS';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDocument {
        if (!ModuleDocument.instance) {
            ModuleDocument.instance = new ModuleDocument();
        }
        return ModuleDocument.instance;
    }

    private static instance: ModuleDocument = null;

    public get_ds_by_user_lang: () => Promise<DocumentVO[]> = APIControllerWrapper.sah(ModuleDocument.APINAME_get_ds_by_user_lang);
    public get_dts_by_user_lang: () => Promise<DocumentTagVO[]> = APIControllerWrapper.sah(ModuleDocument.APINAME_get_dts_by_user_lang);
    public get_dtgs_by_user_lang: () => Promise<DocumentTagGroupVO[]> = APIControllerWrapper.sah(ModuleDocument.APINAME_get_dtgs_by_user_lang);

    private constructor() {

        super("document", ModuleDocument.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<void, DocumentVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DocumentVO.API_TYPE_ID),
            ModuleDocument.APINAME_get_ds_by_user_lang,
            [DocumentVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<void, DocumentTagVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DocumentTagVO.API_TYPE_ID),
            ModuleDocument.APINAME_get_dts_by_user_lang,
            [DocumentTagVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<void, DocumentTagGroupVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DocumentTagGroupVO.API_TYPE_ID),
            ModuleDocument.APINAME_get_dtgs_by_user_lang,
            [DocumentTagGroupVO.API_TYPE_ID, UserVO.API_TYPE_ID]
        ));
    }

    public initialize() {

        this.initializeDocumentVO();
        this.initializeDocumentTagVO();
        this.initializeDocumentTagGroupVO();

        this.initializeDocumentRoleVO();
        this.initializeDocumentLangVO();
        this.initializeDocumentTagLangVO();
        this.initializeDocumentTagGroupLangVO();

        this.initializeDocumentDocumentTagVO();
        this.initializeDocumentTagDocumentTagGroupVO();
    }

    private initializeDocumentVO() {
        let name = ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);
        let file_id = ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier', false).not_add_to_crud();

        let fields = [
            name,
            file_id,
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().document_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL', false),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().target_route_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Page (route_name)', false),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de document', true, true, DocumentVO.DOCUMENT_TYPE_OTHER).setEnumValues(DocumentVO.DOCUMENT_TYPE_LABELS),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().importance, ModuleTableFieldVO.FIELD_TYPE_enum, 'Importance du document', true, true, DocumentVO.DOCUMENT_IMPORTANCE_M).setEnumValues(DocumentVO.DOCUMENT_IMPORTANCE_LABELS),
            ModuleTableFieldController.create_new(DocumentVO.API_TYPE_ID, field_names<DocumentVO>().show_icon, ModuleTableFieldVO.FIELD_TYPE_boolean, 'afficher icone', true, true, true),
        ];

        let table = new ModuleTableVO(this, DocumentVO.API_TYPE_ID, () => new DocumentVO(), fields, name, 'Documents');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeDocumentTagVO() {
        let name = ModuleTableFieldController.create_new(DocumentTagVO.API_TYPE_ID, field_names<DocumentTagVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);

        let fields = [
            name,
            ModuleTableFieldController.create_new(DocumentTagVO.API_TYPE_ID, field_names<DocumentTagVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(DocumentTagVO.API_TYPE_ID, field_names<DocumentTagVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let table = new ModuleTableVO(this, DocumentTagVO.API_TYPE_ID, () => new DocumentTagVO(), fields, name, 'Documents - Tags');
        this.datatables.push(table);
    }

    private initializeDocumentRoleVO() {
        let d_id = ModuleTableFieldController.create_new(DocumentRoleVO.API_TYPE_ID, field_names<DocumentRoleVO>().d_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Document', true);
        let role_id = ModuleTableFieldController.create_new(DocumentRoleVO.API_TYPE_ID, field_names<DocumentRoleVO>().role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Role', true);

        let fields = [
            d_id,
            role_id
        ];

        let table = new ModuleTableVO(this, DocumentRoleVO.API_TYPE_ID, () => new DocumentRoleVO(), fields, null, 'Roles d\'accès aux Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        role_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[RoleVO.API_TYPE_ID]);
    }


    private initializeDocumentLangVO() {
        let d_id = ModuleTableFieldController.create_new(DocumentLangVO.API_TYPE_ID, field_names<DocumentLangVO>().d_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Document', true);
        let lang_id = ModuleTableFieldController.create_new(DocumentLangVO.API_TYPE_ID, field_names<DocumentLangVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            d_id,
            lang_id
        ];

        let table = new ModuleTableVO(this, DocumentLangVO.API_TYPE_ID, () => new DocumentLangVO(), fields, null, 'Langues des Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }

    private initializeDocumentTagLangVO() {
        let dt_id = ModuleTableFieldController.create_new(DocumentTagLangVO.API_TYPE_ID, field_names<DocumentTagLangVO>().dt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tag', true);
        let lang_id = ModuleTableFieldController.create_new(DocumentTagLangVO.API_TYPE_ID, field_names<DocumentTagLangVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            dt_id,
            lang_id
        ];

        let table = new ModuleTableVO(this, DocumentTagLangVO.API_TYPE_ID, () => new DocumentTagLangVO(), fields, null, 'Langues des Tags');
        this.datatables.push(table);

        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }

    private initializeDocumentTagGroupVO() {
        let name = ModuleTableFieldController.create_new(DocumentTagGroupVO.API_TYPE_ID, field_names<DocumentTagGroupVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);

        let fields = [
            name,
            ModuleTableFieldController.create_new(DocumentTagGroupVO.API_TYPE_ID, field_names<DocumentTagGroupVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(DocumentTagGroupVO.API_TYPE_ID, field_names<DocumentTagGroupVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let table = new ModuleTableVO(this, DocumentTagGroupVO.API_TYPE_ID, () => new DocumentTagGroupVO(), fields, name, 'Documents - TagGroups');
        this.datatables.push(table);
    }


    private initializeDocumentTagGroupLangVO() {
        let dtg_id = ModuleTableFieldController.create_new(DocumentTagGroupLangVO.API_TYPE_ID, field_names<DocumentTagGroupLangVO>().dtg_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'TagGroup', true);
        let lang_id = ModuleTableFieldController.create_new(DocumentTagGroupLangVO.API_TYPE_ID, field_names<DocumentTagGroupLangVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            dtg_id,
            lang_id
        ];

        let table = new ModuleTableVO(this, DocumentTagGroupLangVO.API_TYPE_ID, () => new DocumentTagGroupLangVO(), fields, null, 'Langues des TagGroups');
        this.datatables.push(table);

        dtg_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagGroupVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }


    private initializeDocumentTagDocumentTagGroupVO() {
        let dtg_id = ModuleTableFieldController.create_new(DocumentTagDocumentTagGroupVO.API_TYPE_ID, field_names<DocumentTagDocumentTagGroupVO>().dtg_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'TagGroup', true);
        let dt_id = ModuleTableFieldController.create_new(DocumentTagDocumentTagGroupVO.API_TYPE_ID, field_names<DocumentTagDocumentTagGroupVO>().dt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tag', true);

        let fields = [
            dtg_id,
            dt_id
        ];

        let table = new ModuleTableVO(this, DocumentTagDocumentTagGroupVO.API_TYPE_ID, () => new DocumentTagDocumentTagGroupVO(), fields, null, 'Groupes des Tags');
        this.datatables.push(table);

        dtg_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagGroupVO.API_TYPE_ID]);
        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
    }


    private initializeDocumentDocumentTagVO() {
        let d_id = ModuleTableFieldController.create_new(DocumentDocumentTagVO.API_TYPE_ID, field_names<DocumentDocumentTagVO>().d_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Document', true);
        let dt_id = ModuleTableFieldController.create_new(DocumentDocumentTagVO.API_TYPE_ID, field_names<DocumentDocumentTagVO>().dt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tag', true);

        let fields = [
            d_id,
            dt_id
        ];

        let table = new ModuleTableVO(this, DocumentDocumentTagVO.API_TYPE_ID, () => new DocumentDocumentTagVO(), fields, null, 'Tags des Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
    }
}