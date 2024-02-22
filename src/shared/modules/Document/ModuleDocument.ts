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
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
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
        let name = new ModuleTableField(field_names<DocumentVO>().name, ModuleTableField.FIELD_TYPE_string, 'Titre', true);
        let file_id = new ModuleTableField(field_names<DocumentVO>().file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier', false).not_add_to_crud();

        let fields = [
            name,
            file_id,
            new ModuleTableField(field_names<DocumentVO>().document_url, ModuleTableField.FIELD_TYPE_string, 'URL', false),
            new ModuleTableField(field_names<DocumentVO>().target_route_name, ModuleTableField.FIELD_TYPE_string, 'Page (route_name)', false),
            new ModuleTableField(field_names<DocumentVO>().description, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<DocumentVO>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<DocumentVO>().type, ModuleTableField.FIELD_TYPE_enum, 'Type de document', true, true, DocumentVO.DOCUMENT_TYPE_OTHER).setEnumValues(DocumentVO.DOCUMENT_TYPE_LABELS),
            new ModuleTableField(field_names<DocumentVO>().importance, ModuleTableField.FIELD_TYPE_enum, 'Importance du document', true, true, DocumentVO.DOCUMENT_IMPORTANCE_M).setEnumValues(DocumentVO.DOCUMENT_IMPORTANCE_LABELS),
            new ModuleTableField(field_names<DocumentVO>().show_icon, ModuleTableField.FIELD_TYPE_boolean, 'afficher icone', true, true, true),
        ];

        let table = new ModuleTable(this, DocumentVO.API_TYPE_ID, () => new DocumentVO(), fields, name, 'Documents');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeDocumentTagVO() {
        let name = new ModuleTableField(field_names<DocumentTagVO>().name, ModuleTableField.FIELD_TYPE_string, 'Titre', true);

        let fields = [
            name,
            new ModuleTableField(field_names<DocumentTagVO>().description, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<DocumentTagVO>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let table = new ModuleTable(this, DocumentTagVO.API_TYPE_ID, () => new DocumentTagVO(), fields, name, 'Documents - Tags');
        this.datatables.push(table);
    }

    private initializeDocumentRoleVO() {
        let d_id = new ModuleTableField(field_names<DocumentRoleVO>().d_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Document', true);
        let role_id = new ModuleTableField(field_names<DocumentRoleVO>().role_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Role', true);

        let fields = [
            d_id,
            role_id
        ];

        let table = new ModuleTable(this, DocumentRoleVO.API_TYPE_ID, () => new DocumentRoleVO(), fields, null, 'Roles d\'accès aux Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        role_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[RoleVO.API_TYPE_ID]);
    }


    private initializeDocumentLangVO() {
        let d_id = new ModuleTableField(field_names<DocumentLangVO>().d_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Document', true);
        let lang_id = new ModuleTableField(field_names<DocumentLangVO>().lang_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            d_id,
            lang_id
        ];

        let table = new ModuleTable(this, DocumentLangVO.API_TYPE_ID, () => new DocumentLangVO(), fields, null, 'Langues des Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }

    private initializeDocumentTagLangVO() {
        let dt_id = new ModuleTableField(field_names<DocumentTagLangVO>().dt_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Tag', true);
        let lang_id = new ModuleTableField(field_names<DocumentTagLangVO>().lang_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            dt_id,
            lang_id
        ];

        let table = new ModuleTable(this, DocumentTagLangVO.API_TYPE_ID, () => new DocumentTagLangVO(), fields, null, 'Langues des Tags');
        this.datatables.push(table);

        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }

    private initializeDocumentTagGroupVO() {
        let name = new ModuleTableField(field_names<DocumentTagGroupVO>().name, ModuleTableField.FIELD_TYPE_string, 'Titre', true);

        let fields = [
            name,
            new ModuleTableField(field_names<DocumentTagGroupVO>().description, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<DocumentTagGroupVO>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let table = new ModuleTable(this, DocumentTagGroupVO.API_TYPE_ID, () => new DocumentTagGroupVO(), fields, name, 'Documents - TagGroups');
        this.datatables.push(table);
    }


    private initializeDocumentTagGroupLangVO() {
        let dtg_id = new ModuleTableField(field_names<DocumentTagGroupLangVO>().dtg_id, ModuleTableField.FIELD_TYPE_foreign_key, 'TagGroup', true);
        let lang_id = new ModuleTableField(field_names<DocumentTagGroupLangVO>().lang_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', true);

        let fields = [
            dtg_id,
            lang_id
        ];

        let table = new ModuleTable(this, DocumentTagGroupLangVO.API_TYPE_ID, () => new DocumentTagGroupLangVO(), fields, null, 'Langues des TagGroups');
        this.datatables.push(table);

        dtg_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagGroupVO.API_TYPE_ID]);
        lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
    }


    private initializeDocumentTagDocumentTagGroupVO() {
        let dtg_id = new ModuleTableField(field_names<DocumentTagDocumentTagGroupVO>().dtg_id, ModuleTableField.FIELD_TYPE_foreign_key, 'TagGroup', true);
        let dt_id = new ModuleTableField(field_names<DocumentTagDocumentTagGroupVO>().dt_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Tag', true);

        let fields = [
            dtg_id,
            dt_id
        ];

        let table = new ModuleTable(this, DocumentTagDocumentTagGroupVO.API_TYPE_ID, () => new DocumentTagDocumentTagGroupVO(), fields, null, 'Groupes des Tags');
        this.datatables.push(table);

        dtg_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagGroupVO.API_TYPE_ID]);
        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
    }


    private initializeDocumentDocumentTagVO() {
        let d_id = new ModuleTableField(field_names<DocumentDocumentTagVO>().d_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Document', true);
        let dt_id = new ModuleTableField(field_names<DocumentDocumentTagVO>().dt_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Tag', true);

        let fields = [
            d_id,
            dt_id
        ];

        let table = new ModuleTable(this, DocumentDocumentTagVO.API_TYPE_ID, () => new DocumentDocumentTagVO(), fields, null, 'Tags des Documents');
        this.datatables.push(table);

        d_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        dt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DocumentTagVO.API_TYPE_ID]);
    }
}