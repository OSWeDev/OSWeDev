import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDocument from '../../../shared/modules/Document/ModuleDocument';
import DocumentLangVO from '../../../shared/modules/Document/vos/DocumentLangVO';
import DocumentRoleVO from '../../../shared/modules/Document/vos/DocumentRoleVO';
import DocumentTagGroupLangVO from '../../../shared/modules/Document/vos/DocumentTagGroupLangVO';
import DocumentTagGroupVO from '../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagLangVO from '../../../shared/modules/Document/vos/DocumentTagLangVO';
import DocumentTagVO from '../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../shared/modules/Document/vos/DocumentVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import FileHandler from '../../../shared/tools/FileHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';

export default class ModuleDocumentServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDocumentServer.instance) {
            ModuleDocumentServer.instance = new ModuleDocumentServer();
        }
        return ModuleDocumentServer.instance;
    }

    private static instance: ModuleDocumentServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDocument.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDocument.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Documents'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDocument.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Documents'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleDocument.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - Documents'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Documents' },
            'fields.labels.ref.module_document_document.___LABEL____file_id'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Youtube' },
            'DOCUMENT.DOCUMENT_TYPE.YOUTUBE'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'PDF' },
            'DOCUMENT.DOCUMENT_TYPE.PDF'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'PPT' },
            'DOCUMENT.DOCUMENT_TYPE.PPT'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'XLS' },
            'DOCUMENT.DOCUMENT_TYPE.XLS'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'DOC' },
            'DOCUMENT.DOCUMENT_TYPE.DOC'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'AUTRE' },
            'DOCUMENT.DOCUMENT_TYPE.OTHER'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'XS' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XS'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'S' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.S'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'M' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.M'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'L' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.L'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'XL' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XL'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'XXL' },
            'DOCUMENT.DOCUMENT_IMPORTANCE.XXL'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Documents' },
            'menu.menuelements.admin.DocumentAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Feedbacks' },
            'menu.menuelements.admin.FeedbackAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Documents' },
            'menu.menuelements.admin.document.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Tags' },
            'menu.menuelements.admin.dt.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Groupes de tags' },
            'menu.menuelements.admin.dtg.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Feedbacks' },
            'menu.menuelements.admin.feedback.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': ' ' },
            'tstz_input.placeholder.date_debut.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Documentation' },
            'document_handler.modal_title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Tous' },
            'document_handler.tags.tous.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Besoin d'infos" },
            'document_handler.need_info.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': "Aucun document disponible" },
            'document_handler_component.no_document.___LABEL___')
        );

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        preCreateTrigger.registerHandler(DocumentVO.API_TYPE_ID, this, this.force_document_path_from_file);
        preUpdateTrigger.registerHandler(DocumentVO.API_TYPE_ID, this, this.force_document_path_from_file_update);

        // Quand on change un fichier on check si on doit changer l'url d'un doc au passage.
        postUpdateTrigger.registerHandler(FileVO.API_TYPE_ID, this, this.force_document_path_from_file_changed);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }

    // istanbul ignore next: cannot test registerAccessHooks
    public registerAccessHooks(): void {

        APIControllerWrapper.registerServerApiHandler(ModuleDocument.APINAME_get_ds_by_user_lang, this.get_ds_by_user_lang.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDocument.APINAME_get_dts_by_user_lang, this.get_dts_by_user_lang.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDocument.APINAME_get_dtgs_by_user_lang, this.get_dtgs_by_user_lang.bind(this));
    }

    private async force_document_path_from_file_update(vo_update_handler: DAOUpdateVOHolder<DocumentVO>): Promise<boolean> {

        return ModuleDocumentServer.getInstance().force_document_path_from_file(vo_update_handler.post_update_vo);
    }

    private async force_document_path_from_file(d: DocumentVO): Promise<boolean> {

        if (!d) {
            return false;
        }

        if (!d.file_id) {
            return true;
        }

        const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(d.file_id).select_vo<FileVO>();

        if (!file) {
            return false;
        }

        const BASE_URL: string = ConfigurationService.node_configuration.BASE_URL;
        const url = FileHandler.getInstance().get_full_url(BASE_URL, file.path);

        d.document_url = url;
        return true;
    }

    private async force_document_path_from_file_changed(vo_update_handler: DAOUpdateVOHolder<FileVO>): Promise<void> {

        const f: FileVO = vo_update_handler.post_update_vo;

        if (!f) {
            return;
        }

        const docs: DocumentVO[] = await query(DocumentVO.API_TYPE_ID).filter_by_num_eq(field_names<DocumentVO>().file_id, f.id).select_vos<DocumentVO>();
        if ((!docs) || (!docs.length)) {
            return;
        }

        const BASE_URL: string = ConfigurationService.node_configuration.BASE_URL;
        const url = FileHandler.getInstance().get_full_url(BASE_URL, f.path);

        for (const i in docs) {
            const doc = docs[i];

            if (doc.document_url != url) {
                // Techniquement, en faisant cette modif avec le DAO ça fait lancer le trigger preupdate du doc et donc recalc le field... mais bon
                //  on est en post update du file donc ça marche ...
                doc.document_url = url;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(doc);
            }
        }
    }


    private async get_ds_by_user_lang(): Promise<DocumentVO[]> {
        const main_query = query(DocumentVO.API_TYPE_ID);
        const user = await ModuleAccessPolicyServer.getSelfUser();
        return await main_query
            .filter_by_num_eq(field_names<DocumentTagLangVO>().lang_id, user.lang_id, DocumentLangVO.API_TYPE_ID)
            .add_filters([
                ContextFilterVO.or([
                    filter(DocumentRoleVO.API_TYPE_ID, field_names<DocumentRoleVO>().role_id).by_num_in(query(UserRoleVO.API_TYPE_ID).field(field_names<UserRoleVO>().role_id).exec_as_server().filter_by_num_eq(field_names<UserRoleVO>().user_id, StackContext.get('UID')), main_query),
                    filter(DocumentRoleVO.API_TYPE_ID, field_names<DocumentRoleVO>().role_id).is_null_or_empty()
                ])
            ])
            .select_vos<DocumentVO>();
    }

    private async get_dts_by_user_lang(): Promise<DocumentTagVO[]> {
        const user = await ModuleAccessPolicyServer.getSelfUser();
        return query(DocumentTagVO.API_TYPE_ID).filter_by_num_eq(field_names<DocumentTagLangVO>().lang_id, user.lang_id, DocumentTagLangVO.API_TYPE_ID).select_vos<DocumentTagVO>();
    }

    private async get_dtgs_by_user_lang(): Promise<DocumentTagGroupVO[]> {
        const user = await ModuleAccessPolicyServer.getSelfUser();
        return query(DocumentTagGroupVO.API_TYPE_ID).filter_by_num_eq(field_names<DocumentTagLangVO>().lang_id, user.lang_id, DocumentTagGroupLangVO.API_TYPE_ID).select_vos<DocumentTagVO>();
    }
}