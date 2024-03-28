import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleSuiviCompetences from '../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import SuiviCompetencesGroupeResult from '../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult';
import SuiviCompetencesGrilleVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO';
import SuiviCompetencesGroupeVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO';
import SuiviCompetencesItemRapportVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesItemVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO';
import SuiviCompetencesRapportVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import SuiviCompetencesSousGroupeVO from '../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import VarDaySuiviCompetencesNiveauMaturiteGroupeController from './vars/VarDaySuiviCompetencesNiveauMaturiteGroupeController';
import VarDaySuiviCompetencesNiveauMaturiteSousGroupeController from './vars/VarDaySuiviCompetencesNiveauMaturiteSousGroupeController';

export default class ModuleSuiviCompetencesServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSuiviCompetencesServer.instance) {
            ModuleSuiviCompetencesServer.instance = new ModuleSuiviCompetencesServer();
        }
        return ModuleSuiviCompetencesServer.instance;
    }

    private static instance: ModuleSuiviCompetencesServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSuiviCompetences.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSuiviCompetences.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'SuiviCompetences'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSuiviCompetences.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration SuiviCompetences'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleSuiviCompetences.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - SuiviCompetences'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(SuiviCompetencesItemVO.API_TYPE_ID, this, this.handleSuiviCompetencesItemCreation);
        preCreateTrigger.registerHandler(SuiviCompetencesRapportVO.API_TYPE_ID, this, this.handleSuiviCompetencesRapportCreation);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(SuiviCompetencesItemVO.API_TYPE_ID, this, this.handleSuiviCompetencesItemUpdate);
        preUpdateTrigger.registerHandler(SuiviCompetencesRapportVO.API_TYPE_ID, this, this.handleSuiviCompetencesRapportUpdate);

        await this.configure_vars();

        this.registerTranslations();
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleSuiviCompetences.APINAME_get_all_suivi_competences_groupe, this.get_all_suivi_competences_groupe.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleSuiviCompetences.APINAME_duplicate_suivi_competences_rapport, this.duplicate_suivi_competences_rapport.bind(this));
    }


    private async handleSuiviCompetencesItemCreation(item: SuiviCompetencesItemVO): Promise<boolean> {
        // On va checker la cohérence groupe / sous-groupe
        if (item.sous_groupe_id) {
            let sous_groupe: SuiviCompetencesSousGroupeVO = await query(SuiviCompetencesSousGroupeVO.API_TYPE_ID).filter_by_id(item.sous_groupe_id).select_one();

            item.groupe_id = sous_groupe.groupe_id;
        }

        return true;
    }

    private async handleSuiviCompetencesRapportCreation(item: SuiviCompetencesRapportVO): Promise<boolean> {
        item.name = await this.get_rapport_name(item);

        return true;
    }

    private async handleSuiviCompetencesItemUpdate(vo_update_handler: DAOUpdateVOHolder<SuiviCompetencesItemVO>): Promise<boolean> {
        // On va checker la cohérence groupe / sous-groupe
        if (
            (vo_update_handler.post_update_vo.groupe_id == vo_update_handler.pre_update_vo.groupe_id) &&
            (vo_update_handler.post_update_vo.sous_groupe_id == vo_update_handler.pre_update_vo.sous_groupe_id)
        ) {
            return true;
        }

        return this.handleSuiviCompetencesItemCreation(vo_update_handler.post_update_vo);
    }

    private async handleSuiviCompetencesRapportUpdate(vo_update_handler: DAOUpdateVOHolder<SuiviCompetencesRapportVO>): Promise<boolean> {
        // On va checker la cohérence groupe / sous-groupe
        if (
            (vo_update_handler.post_update_vo.date == vo_update_handler.pre_update_vo.date) &&
            (vo_update_handler.post_update_vo.user_id == vo_update_handler.pre_update_vo.user_id) &&
            (vo_update_handler.post_update_vo.suivi_comp_grille_id == vo_update_handler.pre_update_vo.suivi_comp_grille_id)
        ) {
            return true;
        }

        return this.handleSuiviCompetencesRapportCreation(vo_update_handler.post_update_vo);
    }

    private async get_all_suivi_competences_groupe(grille_id_ranges: NumRange[]): Promise<SuiviCompetencesGroupeResult[]> {
        let res: SuiviCompetencesGroupeResult[] = [];

        let groupe_by_ids: { [id: number]: SuiviCompetencesGroupeVO } = null;
        let sous_groupes_by_groupe_ids: { [groupe_id: number]: SuiviCompetencesSousGroupeVO[] } = {};
        let items_by_groupe_and_sous_groupe_ids: { [groupe_id: number]: { [sous_groupe_id: number]: SuiviCompetencesItemVO[] } } = {};

        let query_grilles = query(SuiviCompetencesGrilleVO.API_TYPE_ID);

        if (grille_id_ranges && grille_id_ranges.length > 0) {
            query_grilles.filter_by_ids(grille_id_ranges);
        }

        let grilles: SuiviCompetencesGrilleVO[] = await query_grilles.select_vos<SuiviCompetencesGrilleVO>();
        let item_id_ranges: NumRange[] = [];

        for (let i in grilles) {
            let grille: SuiviCompetencesGrilleVO = grilles[i];

            if (grille.suivi_comp_item_id_ranges) {
                item_id_ranges = item_id_ranges.concat(grille.suivi_comp_item_id_ranges);
            }
        }

        let limit = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        await promise_pipeline.push(async () => {
            groupe_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query(SuiviCompetencesGroupeVO.API_TYPE_ID)
                    .filter_is_true(field_names<SuiviCompetencesGroupeVO>().active)
                    .set_sort(new SortByVO(SuiviCompetencesGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesGroupeVO>().weight, true))
                    .select_vos<SuiviCompetencesGroupeVO>()
            );
        });
        await promise_pipeline.push(async () => {
            let sous_groupes: SuiviCompetencesSousGroupeVO[] = await query(SuiviCompetencesSousGroupeVO.API_TYPE_ID)
                .filter_is_true(field_names<SuiviCompetencesSousGroupeVO>().active)
                .set_sort(new SortByVO(SuiviCompetencesSousGroupeVO.API_TYPE_ID, field_names<SuiviCompetencesSousGroupeVO>().weight, true))
                .select_vos<SuiviCompetencesSousGroupeVO>();

            for (let i in sous_groupes) {
                if (!sous_groupes_by_groupe_ids[sous_groupes[i].groupe_id]) {
                    sous_groupes_by_groupe_ids[sous_groupes[i].groupe_id] = [];
                }
                sous_groupes_by_groupe_ids[sous_groupes[i].groupe_id].push(sous_groupes[i]);
            }
        });
        await promise_pipeline.push(async () => {
            let items: SuiviCompetencesItemVO[] = await query(SuiviCompetencesItemVO.API_TYPE_ID)
                .filter_is_true(field_names<SuiviCompetencesItemVO>().active)
                .filter_by_ids(item_id_ranges)
                .set_sort(new SortByVO(SuiviCompetencesItemVO.API_TYPE_ID, field_names<SuiviCompetencesItemVO>().weight, true))
                .select_vos<SuiviCompetencesItemVO>();

            for (let i_idx in items) {
                let item: SuiviCompetencesItemVO = items[i_idx];
                if (!items_by_groupe_and_sous_groupe_ids[item.groupe_id]) {
                    items_by_groupe_and_sous_groupe_ids[item.groupe_id] = {};
                }
                if (!items_by_groupe_and_sous_groupe_ids[item.groupe_id][item.sous_groupe_id]) {
                    items_by_groupe_and_sous_groupe_ids[item.groupe_id][item.sous_groupe_id] = [];
                }
                items_by_groupe_and_sous_groupe_ids[item.groupe_id][item.sous_groupe_id].push(item);
            }
        });

        await promise_pipeline.end();

        for (let i in groupe_by_ids) {
            let groupe: SuiviCompetencesGroupeVO = groupe_by_ids[i];

            let groupe_result: SuiviCompetencesGroupeResult = new SuiviCompetencesGroupeResult();
            groupe_result.name = groupe.name;
            groupe_result.icon = groupe.icon;
            groupe_result.id = groupe.id;
            groupe_result.sous_groupe = [];

            // Si on a des sous groupe, on les parcours
            if (sous_groupes_by_groupe_ids[groupe.id]) {
                let sous_groupes: SuiviCompetencesSousGroupeVO[] = sous_groupes_by_groupe_ids[groupe.id];

                for (let j in sous_groupes) {
                    let sous_groupe: SuiviCompetencesSousGroupeVO = sous_groupes[j];

                    let ts_sous_groupe_result: { id: number, name: string, items: SuiviCompetencesItemVO[] } = {
                        id: sous_groupe.id,
                        name: sous_groupe.name,
                        items: null
                    };

                    if (items_by_groupe_and_sous_groupe_ids[groupe.id] && items_by_groupe_and_sous_groupe_ids[groupe.id][sous_groupe.id]) {
                        ts_sous_groupe_result.items = items_by_groupe_and_sous_groupe_ids[groupe.id][sous_groupe.id];
                    }

                    if (ts_sous_groupe_result.items && (ts_sous_groupe_result.items.length > 0)) {
                        groupe_result.sous_groupe.push(ts_sous_groupe_result);
                    }
                }
            } else if (items_by_groupe_and_sous_groupe_ids[groupe.id]) {
                // Si on a pas de sous groupe, on va chercher directement les items
                let ts_sous_groupe_result: { id: number, name: string, items: SuiviCompetencesItemVO[] } = {
                    id: null,
                    name: null,
                    items: []
                };

                for (let j in items_by_groupe_and_sous_groupe_ids[groupe.id]) {
                    ts_sous_groupe_result.items = ts_sous_groupe_result.items.concat(items_by_groupe_and_sous_groupe_ids[groupe.id][j]);
                }

                if (ts_sous_groupe_result.items.length > 0) {
                    groupe_result.sous_groupe.push(ts_sous_groupe_result);
                }
            }

            if (groupe_result.sous_groupe.length > 0) {
                res.push(groupe_result);
            }
        }

        return res;
    }

    private async duplicate_suivi_competences_rapport(new_rapport_id: number, duplicate_rapport_id: number): Promise<boolean> {
        let items: SuiviCompetencesItemRapportVO[] = await query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<SuiviCompetencesItemRapportVO>().rapport_id, duplicate_rapport_id)
            .select_vos<SuiviCompetencesItemRapportVO>();
        let grille: SuiviCompetencesGrilleVO = await query(SuiviCompetencesGrilleVO.API_TYPE_ID)
            .filter_by_id_in(
                query(SuiviCompetencesRapportVO.API_TYPE_ID).field(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id).filter_by_id(new_rapport_id)
            )
            .select_vo<SuiviCompetencesGrilleVO>();

        let tosave: SuiviCompetencesItemRapportVO[] = [];

        for (let i in items) {
            let item: SuiviCompetencesItemRapportVO = items[i];

            if (!RangeHandler.elt_intersects_any_range(item.suivi_comp_item_id, grille.suivi_comp_item_id_ranges)) {
                continue;
            }

            item.id = null;
            item.rapport_id = new_rapport_id;

            tosave.push(item);
        }

        if (tosave.length > 0) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(tosave);
        }

        return true;
    }

    private async get_rapport_name(
        rapport: SuiviCompetencesRapportVO,
    ): Promise<string> {
        let res: string[] = [];

        let grille: SuiviCompetencesGrilleVO = rapport.suivi_comp_grille_id ? await query(SuiviCompetencesGrilleVO.API_TYPE_ID).filter_by_id(rapport.suivi_comp_grille_id).select_vo() : null;
        let user: UserVO = rapport.user_id ? await query(UserVO.API_TYPE_ID).filter_by_id(rapport.user_id).select_vo() : null;

        res.push(Dates.format(rapport.date, "DD/MM/YYYY"));

        if (user?.name) {
            res.push(user.name);
        }

        if (grille?.name) {
            res.push(grille.name);
        }

        return res.join(' - ');
    }

    private async configure_vars() {
        await VarDaySuiviCompetencesNiveauMaturiteGroupeController.getInstance().initialize();
        await VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.getInstance().initialize();
    }

    private registerTranslations() {
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Supprimer le rapport ?'
        }, 'confirm_delete_selected_rapport.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Suppression'
        }, 'confirm_delete_selected_rapport.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Suivi des compétences'
        }, 'dashboards.widgets.icons_tooltips.SuiviCompetences.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Commentaire'
        }, 'suivi_competences_widget_component.commentaires.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Créer un rapport'
        }, 'suivi_competences_widget_component.create.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Merci de sélectionner au moins un filtre pour pouvoir sélectionner un rapport'
        }, 'suivi_competences_widget_component.no_has_active_filters.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": "Plan d'action"
        }, 'suivi_competences_widget_component.plan_action.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Maturité'
        }, 'suivi_competences_widget_component.indicateur.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'KPI'
        }, 'suivi_competences_widget_component.kpi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Sélectionner un rapport'
        }, 'suivi_competences_widget_component.select_rapport.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Afficher le détail'
        }, 'show_details.no.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Afficher le détail'
        }, 'show_details.yes.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Fond du bloc'
        }, 'niveau_maturite_style.background.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Couleur du texte'
        }, 'niveau_maturite_style.color.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Max'
        }, 'niveau_maturite_style.max.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Min'
        }, 'niveau_maturite_style.min.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Dupliquer le rapport ?'
        }, 'confirm_duplicate_rapport.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Dupliquer le rapport'
        }, 'suivi_competences_widget_component.duplicate.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Objectif de la prochaine visite'
        }, 'suivi_competences_widget_component.objectif_prochaine_visite.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Points clés'
        }, 'suivi_competences_widget_component.points_cles.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Suivi du {date}'
        }, 'suivi_competences_widget_component.suivi.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Détails'
        }, 'suivi_competences_widget_component.indicateur_detail.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            "fr-fr": 'Rapport dupliqué'
        }, 'duplicate_rapport.success.___LABEL___'));
    }
}