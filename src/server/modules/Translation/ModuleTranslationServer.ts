import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import TranslationCronWorkersHandler from './TranslationCronWorkersHandler';
import TranslationsServerController from './TranslationsServerController';

export default class ModuleTranslationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleTranslationServer.instance) {
            ModuleTranslationServer.instance = new ModuleTranslationServer();
        }
        return ModuleTranslationServer.instance;
    }

    private static instance: ModuleTranslationServer = null;

    /**
     * Local thread cache -----
     */
    public policy_group: AccessPolicyGroupVO = null;
    private flat_translations: { [code_lang: string]: { [code_text: string]: string } } = null;
    /**
     * ----- Local thread cache
     */

    private constructor() {
        super(ModuleTranslation.getInstance().name);
    }

    public registerCrons(): void {
        TranslationCronWorkersHandler.getInstance();
    }

    public async configure() {
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);

        let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        let postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this, this.clear_flat_translations);
        postUpdateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this, this.clear_flat_translations);
        postDeleteTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this, this.clear_flat_translations);
        postCreateTrigger.registerHandler(TranslationVO.API_TYPE_ID, this, this.clear_flat_translations);
        postUpdateTrigger.registerHandler(TranslationVO.API_TYPE_ID, this, this.clear_flat_translations);
        postDeleteTrigger.registerHandler(TranslationVO.API_TYPE_ID, this, this.clear_flat_translations);
        postCreateTrigger.registerHandler(LangVO.API_TYPE_ID, this, this.clear_flat_translations);
        postUpdateTrigger.registerHandler(LangVO.API_TYPE_ID, this, this.clear_flat_translations);
        postDeleteTrigger.registerHandler(LangVO.API_TYPE_ID, this, this.clear_flat_translations);

        preCreateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this, this.onPreCreateTranslatableTextVO);
        preUpdateTrigger.registerHandler(TranslatableTextVO.API_TYPE_ID, this, this.onPreUpdateTranslatableTextVO);

        postCreateTrigger.registerHandler(LangVO.API_TYPE_ID, this, this.trigger_oncreate_lang);
        preDeleteTrigger.registerHandler(LangVO.API_TYPE_ID, this, this.trigger_ondelete_lang);

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traductions'
        }, 'TranslationsImportDefaultFormatLabels.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traductions'
        }, 'menu.menuelements.admin.__i__import_translation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traductions'
        }, 'menu.menuelements.admin._i_import_translation.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traduction'
        }, 'fields.labels.ref.module_translation_translation.___LABEL____lang_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traduction'
        }, 'fields.labels.ref.module_translation_translation.___LABEL____text_id'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utilisateur'
        }, 'fields.labels.ref.user.___LABEL____lang_id'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Une erreur empêche la validation de la saisie'
        }, 'field.validate_input.error.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de mise à jour de la valeur du champs'
        }, 'field.auto_update_field_value.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de mise à jour de la valeur du champs, la valeur n\'est peut etre pas correctement formattée, ou vide.'
        }, 'field.auto_update_field_value.failed.empty.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Une erreur serveur a eue lieu et vous empêche de modifier la valeur de ce champs. Essayez de modifier la valeur et de l\'enregistrer à nouveau et si le problème persiste, contactez votre équipe technique en indiquant le champs de saisie et le texte que vous souhaitez valider.'
        }, 'field.auto_update_field_value.server_error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification enregistrée'
        }, 'field.auto_update_field_value.succes.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'NO'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'YES'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'admin.logout.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Choisissez "Déconnexion"'
        }, 'admin.logout.content.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Déconnexion'
        }, 'admin.logout.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Déconnexion'
        }, 'admin.logout.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Import des traductions'
        }, 'import.translations.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Codes textes'
        }, 'menu.menuelements.admin.TranslatableTextVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Internationalisation'
        }, 'menu.menuelements.admin.TranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Traductions'
        }, 'menu.menuelements.admin.TranslationVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Import des traductions'
        }, 'menu.menuelements.admin.TranslationsImport.___LABEL___'));





        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'CRON'
        }, 'cron.component.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'CRON'
        }, 'cron.component.head.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lancer les tâches'
        }, 'cron.run_cron.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter'
        }, 'crud.actions.create.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exporter'
        }, 'crud.actions.export.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Actualiser'
        }, 'crud.actions.refresh.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout supprimer'
        }, 'crud.actions.delete_all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Query string'
        }, 'crud.actions.getquerystr.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Copié dans le presse-papier !'
        }, 'copied_to_clipboard.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer TOUTES les données ? Les filtrages sont ignorés'
        }, 'crud.actions.delete_all.confirmation.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ATTENTION'
        }, 'crud.actions.delete_all.confirmation.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression en cours...'
        }, 'crud.actions.delete_all.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajouter'
        }, 'crud.create.modal.add.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'crud.create.modal.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nouveau'
        }, 'crud.create.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajout : En cours...'
        }, 'crud.create.starting.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ajout : OK'
        }, 'crud.create.success.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'crud.delete.modal.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'crud.delete.modal.content.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de sélection'
        }, 'crud.delete.modal.content.selection_failure.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'crud.delete.modal.content.warning.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'crud.delete.modal.delete.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'crud.delete.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression : En cours...'
        }, 'crud.delete.starting.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression : OK'
        }, 'crud.delete.success.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non'
        }, 'crud.field.boolean.false.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non renseigné'
        }, 'crud.field.boolean.n_a.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Oui'
        }, 'crud.field.boolean.true.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Données - {datatable_title}'
        }, 'crud.read.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'crud.update.modal.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Edition : Echec de sélection'
        }, 'crud.update.modal.content.selection_failure.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrer'
        }, 'crud.update.modal.save.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mettre à jour'
        }, 'crud.update.modal.update.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'crud.update.modal.delete.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifier'
        }, 'crud.update.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer la modification ?'
        }, 'crud.update.modal.title.confirmation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification : En cours...'
        }, 'crud.update.starting.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification : OK'
        }, 'crud.update.success.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification : KO'
        }, 'crud.update.errors.update_failure.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Actions'
        }, 'datatable.actions_column.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Champ requis non renseigné'
        }, 'crud.check_form.field_required.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Colonnes'
        }, 'datatable.columns.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Affichage des résultats ###from-## à ###to-## (sur un total de ###count-##)|###count-## résultats|A résultat'
        }, 'datatable.count.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner ###column-##'
        }, 'datatable.default_option.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer:'
        }, 'datatable.filter.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Filtrer par ###column-##'
        }, 'datatable.filter_by.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Recherche'
        }, 'datatable.filter_place_holder.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Premier'
        }, 'datatable.first.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dernier'
        }, 'datatable.last.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Résultats:'
        }, 'datatable.limit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Chargement...'
        }, 'datatable.loading.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aucun résultat'
        }, 'datatable.no_results.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Page:'
        }, 'datatable.page.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'dropzone.dictCancelUpload.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler l\'upload'
        }, 'dropzone.dictCancelUploadConfirmation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Déposez votre fichier'
        }, 'dropzone.dictDefaultMessage.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'dropzone.dictFallbackMessage.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': ''
        }, 'dropzone.dictFallbackText.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mo'
        }, 'dropzone.dictFileSizeUnits.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fichier trop lourd'
        }, 'dropzone.dictFileTooBig.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Type de fichier invalide'
        }, 'dropzone.dictInvalidFileType.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Nb. max de fichiers atteint'
        }, 'dropzone.dictMaxFilesExceeded.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'dropzone.dictRemoveFile.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fichier supprimé'
        }, 'dropzone.dictRemoveFileConfirmation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur'
        }, 'dropzone.dictResponseError.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Upload annulé'
        }, 'dropzone.dictUploadCanceled.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aucun historique'
        }, 'import.modal.no_hisotoric.___LABEL___'));



        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'CRON'
        }, 'menu.menuelements.admin.CronAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exécution'
        }, 'menu.menuelements.admin.CronRun.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Planification'
        }, 'menu.menuelements.admin.CronWorkerPlanification.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Administration des fichiers'
        }, 'menu.menuelements.admin.FileAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fichier'
        }, 'menu.menuelements.admin.FileVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Langues'
        }, 'menu.menuelements.admin.LangVOTranslationAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modules'
        }, 'menu.menuelements.admin.ModuleVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modules'
        }, 'menu.menuelements.admin.ModulesAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Role policy'
        }, 'menu.menuelements.admin.RolePolicyVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Rôle'
        }, 'menu.menuelements.admin.RoleVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Configuration des Vars'
        }, 'menu.menuelements.admin.SimpleVarConfVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Utilisateurs'
        }, 'menu.menuelements.admin.UserVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Variables'
        }, 'menu.menuelements.admin.VarAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Access policy'
        }, 'menu.menuelements.admin.module_access_policy.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Module Format dates/nombres'
        }, 'menu.menuelements.admin.module_format_dates_nombres.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Module Mailer'
        }, 'menu.menuelements.admin.module_mailer.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Module SASS'
        }, 'menu.menuelements.admin.module_sass_resource_planning_skin_configurator.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fermer'
        }, 'on_page_translation.close_button_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Autres langues'
        }, 'on_page_translation.hide_other_langs.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importer les traductions'
        }, 'on_page_translation.import_translations.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ouvrir'
        }, 'on_page_translation.open_button_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Autres langues'
        }, 'on_page_translation.show_other_langs.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement en cours'
        }, 'on_page_translation.save_translation.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de la sauvegarde'
        }, 'on_page_translation.save_translation.ko.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Surcharger'
        }, 'translations_import_params.overwrite.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Manuel utilisateur'
        }, 'client.learning.book.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'http://www.wedev.fr/'
        }, 'client.learning.link.manual.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'http://www.wedev.fr/'
        }, 'client.learning.link.youtube.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tutoriel'
        }, 'client.learning.youtube.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Déconnexion'
        }, 'client.logout.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Wedev'
        }, 'client.main-title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Admin'
        }, 'client.menu-gauche.admin'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Menu principal'
        }, 'client.menu-gauche.navigationPrincipale'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année'
        }, 'label.year.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois'
        }, 'label.month.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Janvier'
        }, 'label.month.janvier.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Février'
        }, 'label.month.fevrier.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mars'
        }, 'label.month.mars.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Avril'
        }, 'label.month.avril.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mai'
        }, 'label.month.mai.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Juin'
        }, 'label.month.juin.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Juillet'
        }, 'label.month.juillet.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Août'
        }, 'label.month.aout.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Septembre'
        }, 'label.month.septembre.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Octobre'
        }, 'label.month.octobre.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Novembre'
        }, 'label.month.novembre.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Décembre'
        }, 'label.month.decembre.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Jour'
        }, 'label.day.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dimanche'
        }, 'label.day.dimanche.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lundi'
        }, 'label.day.lundi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mardi'
        }, 'label.day.mardi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mercredi'
        }, 'label.day.mercredi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Jeudi'
        }, 'label.day.jeudi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Vendredi'
        }, 'label.day.vendredi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Samedi'
        }, 'label.day.samedi.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'tous'
        }, 'select_all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'aucun'
        }, 'select_none.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner'
        }, 'multiselect.selectLabel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionner'
        }, 'multiselect.selectGroupLabel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Sélectionné'
        }, 'multiselect.selectedLabel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dé-sélectionner'
        }, 'multiselect.deselectLabel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dé-sélectionner'
        }, 'multiselect.deselectGroupLabel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le maximum de sélection est atteint ({max}). Retirez d\'abord la sélection actuelle pour choisir un autre élément.',
            'en-us': 'Maximum of {max} options selected. First remove a selected option to select another.',
            'en-en': 'Maximum of {max} options selected. First remove a selected option to select another.'
        }, 'multiselect.maxElements.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Début'
        }, 'num_range_input.debut.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fin'
        }, 'num_range_input.fin.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valeur Simple'
        }, 'num_range_input.is_single.on.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tranche de valeurs'
        }, 'num_range_input.is_single.off.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Liste des alertes'
        }, 'alert.list.title.default.___LABEL___'));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleTranslation.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Traductions'
        }));
        this.policy_group = group;

        let bo_translations_access: AccessPolicyVO = new AccessPolicyVO();
        bo_translations_access.group_id = group.id;
        bo_translations_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_translations_access.translatable_name = ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS;
        bo_translations_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_translations_access, new DefaultTranslation({
            'fr-fr': 'Administration des traductions'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        // let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        // admin_access_dependency.src_pol_id = bo_translations_access.id;
        // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
        // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let promises = [];
        promises.push((async () => {
            let bo_others_access: AccessPolicyVO = new AccessPolicyVO();
            bo_others_access.group_id = group.id;
            bo_others_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_others_access.translatable_name = ModuleTranslation.POLICY_BO_OTHERS_ACCESS;
            bo_others_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_others_access, new DefaultTranslation({
                'fr-fr': 'Administration des langues et codes de traduction'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
            // admin_access_dependency = new PolicyDependencyVO();
            // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            // admin_access_dependency.src_pol_id = bo_others_access.id;
            // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
            // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
            let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            access_dependency.src_pol_id = bo_others_access.id;
            access_dependency.depends_on_pol_id = bo_translations_access.id;
            access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
        })());

        promises.push((async () => {
            let on_page_translation_module_access: AccessPolicyVO = new AccessPolicyVO();
            on_page_translation_module_access.group_id = group.id;
            on_page_translation_module_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            on_page_translation_module_access.translatable_name = ModuleTranslation.POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS;
            on_page_translation_module_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(on_page_translation_module_access, new DefaultTranslation({
                'fr-fr': 'Module de traduction sur page'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
            let access_dependency = new PolicyDependencyVO();
            access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            access_dependency.src_pol_id = on_page_translation_module_access.id;
            access_dependency.depends_on_pol_id = bo_translations_access.id;
            access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
        })());

        promises.push((async () => {
            let LANG_SELECTOR_ACCESS: AccessPolicyVO = new AccessPolicyVO();
            LANG_SELECTOR_ACCESS.group_id = group.id;
            LANG_SELECTOR_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            LANG_SELECTOR_ACCESS.translatable_name = ModuleTranslation.POLICY_LANG_SELECTOR_ACCESS;
            LANG_SELECTOR_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_ACCESS, new DefaultTranslation({
                'fr-fr': 'Outil - Choix de la langue'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());
        await Promise.all(promises);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS, this.getAllTranslations.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_LANGS, this.getLangs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_LANG, this.getLang.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, this.getTranslatableText.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS, this.getTranslatableTexts.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATION, this.getTranslation.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATIONS, this.getTranslations.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_getALL_LOCALES, this.getALL_LOCALES.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_getALL_FLAT_LOCALE_TRANSLATIONS, this.getALL_FLAT_LOCALE_TRANSLATIONS.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_LABEL, this.label.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleTranslation.APINAME_T, this.t.bind(this));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await query(TranslatableTextVO.API_TYPE_ID).select_vos<TranslatableTextVO>();
    }

    public async getTranslatableText(text: string): Promise<TranslatableTextVO> {
        return await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_eq('code_text', text).select_vo<TranslatableTextVO>();
    }

    public async getLang(text: string): Promise<LangVO> {
        return await query(LangVO.API_TYPE_ID).filter_by_text_eq('code_lang', text).select_vo<LangVO>();
    }

    public async getLangs(): Promise<LangVO[]> {
        return await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await query(TranslationVO.API_TYPE_ID).select_vos<TranslationVO>();
    }

    public async getTranslations(num: number): Promise<TranslationVO[]> {
        return await query(TranslationVO.API_TYPE_ID)
            .filter_by_num_eq('lang_id', num)
            .select_vos<TranslationVO>();
    }

    public async getTranslation(lang_id: number, text_id: number): Promise<TranslationVO> {
        return await query(TranslationVO.API_TYPE_ID).filter_by_id(lang_id, LangVO.API_TYPE_ID).filter_by_id(text_id, TranslatableTextVO.API_TYPE_ID).select_vo<TranslationVO>();
    }

    private async trigger_oncreate_lang(lang: LangVO) {
        let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        LANG_SELECTOR_PER_LANG_ACCESS.group_id = ModuleTranslationServer.getInstance().policy_group.id;
        LANG_SELECTOR_PER_LANG_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        LANG_SELECTOR_PER_LANG_ACCESS.translatable_name = ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id);
        LANG_SELECTOR_PER_LANG_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_PER_LANG_ACCESS, new DefaultTranslation({
            'fr-fr': 'Outil - Peut choisir la langue : ' + lang.code_lang
        }), await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationServer.getInstance().name));
    }

    private async trigger_ondelete_lang(lang: LangVO): Promise<boolean> {
        let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = AccessPolicyServerController.get_registered_policy(ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id));
        if (!LANG_SELECTOR_PER_LANG_ACCESS) {
            return false;
        }
        await ModuleDAO.getInstance().deleteVOs([LANG_SELECTOR_PER_LANG_ACCESS]);
        return true;
    }

    private async getALL_FLAT_LOCALE_TRANSLATIONS(code_lang: string): Promise<{ [code_text: string]: string }> {

        if (this.flat_translations && this.flat_translations[code_lang]) {
            return this.flat_translations[code_lang];
        }

        let res: { [code_text: string]: string } = {};

        /**
         * On intègre en premier lieu la langue demandée, puis on intègre la langue par défaut pour combler les trous
         */
        let promises = [];
        let lang_translations: TranslationVO[] = null;
        let default_translations: TranslationVO[] = null;
        let translatableTexts: TranslatableTextVO[] = null;

        promises.push((async () => {
            lang_translations = await this.get_translations(code_lang);
        })());
        if (code_lang != ConfigurationService.node_configuration.DEFAULT_LOCALE) {
            promises.push((async () => {
                default_translations = await this.get_translations(ConfigurationService.node_configuration.DEFAULT_LOCALE);
            })());
        }

        let translatableTexts_by_id: { [id: number]: TranslatableTextVO } = null;
        promises.push((async () => {
            translatableTexts = await this.getTranslatableTexts();
            translatableTexts_by_id = VOsTypesManager.vosArray_to_vosByIds(translatableTexts);
        })());

        await all_promises(promises);


        await this.add_locale_flat_translations(translatableTexts_by_id, lang_translations, res);
        await this.add_locale_flat_translations(translatableTexts_by_id, default_translations, res);

        if (!this.flat_translations) {
            this.flat_translations = {};
        }
        this.flat_translations[code_lang] = res;
        return res;
    }

    private async get_translations(code_lang: string): Promise<TranslationVO[]> {

        let lang = await this.getLang(code_lang);
        if (!lang) {
            return null;
        }
        let translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID).filter_by_num_eq('lang_id', lang.id).select_vos<TranslationVO>();

        return translations;
    }

    private async add_locale_flat_translations(
        translatableTexts_by_id: { [id: number]: TranslatableTextVO },
        translations: TranslationVO[],
        res: { [code_text: string]: string }): Promise<{ [code_text: string]: string }> {

        if (!translations) {
            return res;
        }

        for (let i in translations) {
            let translation = translations[i];

            if (!res[translatableTexts_by_id[translation.text_id].code_text]) {
                res[translatableTexts_by_id[translation.text_id].code_text] = translation.translated;
            }
        }

        return res;
    }

    private async getALL_LOCALES(): Promise<{ [code_lang: string]: any }> {
        let promises = [];
        let langs: LangVO[] = null;
        let translatableTexts: TranslatableTextVO[] = null;
        let translatableTexts_by_id: { [id: number]: TranslatableTextVO } = null;
        let translations_per_lang_id: { [lang_id: number]: TranslationVO[] } = {};

        promises.push((async () => {
            langs = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
        })());
        promises.push((async () => {
            translatableTexts = await query(TranslatableTextVO.API_TYPE_ID).select_vos<TranslatableTextVO>();
            translatableTexts_by_id = VOsTypesManager.vosArray_to_vosByIds(translatableTexts);
        })());
        promises.push((async () => {
            let translations = await query(TranslationVO.API_TYPE_ID).select_vos<TranslationVO>();
            for (let i in translations) {
                let translation = translations[i];
                if (!translations_per_lang_id[translation.lang_id]) {
                    translations_per_lang_id[translation.lang_id] = [];
                }
                translations_per_lang_id[translation.lang_id].push(translation);
            }
        })());

        await all_promises(promises);

        let res: { [code_lang: string]: any } = {};

        for (let i in langs) {
            let lang: LangVO = langs[i];

            let translations: TranslationVO[] = translations_per_lang_id[lang.id];

            for (let j in translations) {
                let translation: TranslationVO = translations[j];

                if (!translation.text_id) {
                    continue;
                }

                res = TranslationsServerController.getInstance().addCodeToLocales(res, lang.code_lang.toLowerCase(), translatableTexts_by_id[translation.text_id].code_text, translation.translated);
            }
        }

        return res;
    }

    private async t(code_text: string, lang_id: number): Promise<string> {
        let translation = await query(TranslationVO.API_TYPE_ID).filter_by_id(lang_id, LangVO.API_TYPE_ID).filter_by_text_eq('code_text', code_text, TranslatableTextVO.API_TYPE_ID).select_vo<TranslationVO>();
        if (!translation) {
            return null;
        }

        return translation.translated;
    }

    private async label(code_text: string, lang_id: number): Promise<string> {
        code_text += DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        return await this.t(code_text, lang_id);
    }

    private async onPreCreateTranslatableTextVO(vo: TranslatableTextVO): Promise<boolean> {
        if ((!vo) || (!vo.code_text)) {
            return false;
        }
        return await ModuleTranslationServer.getInstance().isCodeOk(vo.code_text);
    }

    private async onPreUpdateTranslatableTextVO(vo_update_handler: DAOUpdateVOHolder<TranslatableTextVO>): Promise<boolean> {

        if ((!vo_update_handler.post_update_vo) || (!vo_update_handler.post_update_vo.code_text)) {
            return false;
        }
        return await ModuleTranslationServer.getInstance().isCodeOk(vo_update_handler.post_update_vo.code_text);
    }

    private async isCodeOk(code_text: string): Promise<boolean> {

        // On vérifie qu'il existe pas en base un code conflictuel. Sinon on refuse l'insert
        let something_longer: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_starting_with('code_text', code_text + '.')
            .select_vos<TranslatableTextVO>();

        if ((!!something_longer) && (something_longer.length > 0)) {
            return false;
        }

        let shorter_code: string = code_text;
        let segments: string[] = shorter_code.split('.');

        while ((!!segments) && (segments.length > 1)) {

            segments.pop();
            shorter_code = segments.join('.');

            let something_shorter: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_text_eq('code_text', shorter_code)
                .select_vos<TranslatableTextVO>();

            if ((!!something_shorter) && (something_shorter.length > 0)) {
                return false;
            }
        }

        return true;
    }

    private async clear_flat_translations(any?) {
        this.flat_translations = null;
    }
}