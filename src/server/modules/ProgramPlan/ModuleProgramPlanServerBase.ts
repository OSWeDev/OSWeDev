
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanFacilitator from '../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import { field_names } from '../../../shared/tools/ObjectHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';

export default abstract class ModuleProgramPlanServerBase extends ModuleServerBase {

    protected constructor(name: string) {
        super(name);
    }

    get programplan_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        // On ajoute les triggers pour le statut des RDVs en fonction des Preps / CRs et confirmation

        // Cycle de vie :
        //  Création de RDV on a un statut created ou confirmed si il est créé confirmed
        //  Mise à jour du RDV : On demande à recalculer le statut du RDV
        //  Ajout / Suppression de CR ou Prep : On demande à recalculer le statut du RDV
        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_type_id, this, this.handleTriggerSetStateRDV);

        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(this.programplan_shared_module.rdv_type_id, this, this.handleTriggerSetStateRDVUpdate);

        preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_cr_type_id, this, this.handleTriggerPreCreateCr);
        const preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        preDeleteTrigger.registerHandler(this.programplan_shared_module.rdv_cr_type_id, this, this.handleTriggerPreDeleteCr);

        if (this.programplan_shared_module.rdv_prep_type_id) {
            preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_prep_type_id, this, this.handleTriggerPreCreatePrep);
            preDeleteTrigger.registerHandler(this.programplan_shared_module.rdv_prep_type_id, this, this.handleTriggerPreDeletePrep);
        }

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer ?'
        }, 'programplan.create_cr.confirmation.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrer le compte-rendu'
        }, 'programplan.create_cr.confirmation.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement en cours...'
        }, 'programplan.create_cr.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'enregistrement du compte-rendu'
        }, 'programplan.create_cr.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Enregistrement du compte-rendu terminé'
        }, 'programplan.create_cr.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____manager_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____region_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____user_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Boutique'
        }, 'fields.labels.ref.module_sfam_program_plan_boutique.___LABEL____enseigne_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Contact'
        }, 'fields.labels.ref.module_sfam_program_plan_contact.___LABEL____contact_type_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Contact'
        }, 'fields.labels.ref.module_sfam_program_plan_contact.___LABEL____user_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Manager'
        }, 'fields.labels.ref.module_sfam_program_plan_manager.___LABEL____user_id'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Création interdite'
        }, 'programplan.fc.create.denied.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur de création'
        }, 'programplan.fc.create.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Suppression interdite'
        }, 'programplan.fc.delete.denied.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur de suppression'
        }, 'programplan.delete.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modification interdite'
        }, 'programplan.fc.update.denied.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur de modification'
        }, 'programplan.fc.update.error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Date'
        }, 'programplan.rdv_modal.rdv_date.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Archiver ce RDV ?'
        }, 'ProgramPlanComponentModalHistoric.confirm_archive.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmer l\'archivage'
        }, 'ProgramPlanComponentModalHistoric.confirm_archive.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Archivage en cours...'
        }, 'ProgramPlanComponentModalHistoric.confirm_archive.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur lors de l\'archivage'
        }, 'ProgramPlanComponentModalHistoric.confirm_archive.ko.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Archivage terminé'
        }, 'ProgramPlanComponentModalHistoric.confirm_archive.ok.___LABEL___'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(this.programplan_shared_module.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT, this.getRDVsOfProgramSegment.bind(this));
        APIControllerWrapper.registerServerApiHandler(this.programplan_shared_module.APINAME_GET_CRS_OF_PROGRAM_SEGMENT, this.getCRsOfProgramSegment.bind(this));

        if (this.programplan_shared_module.rdv_prep_type_id) {

            APIControllerWrapper.registerServerApiHandler(this.programplan_shared_module.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT, this.getPrepsOfProgramSegment.bind(this));
        }
    }

    // istanbul ignore next: cannot test registerAccessHooks
    public registerAccessHooks(): void {

        // IPlanManager
        // id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(this.programplan_shared_module.manager_type_id, ModuleDAO.DAO_ACCESS_TYPE_READ, this, this.filterManagerByIdByAccess);
        ModuleDAOServer.getInstance().registerContextAccessHook(this.programplan_shared_module.manager_type_id, this, this.filterManagerByIdByContextAccessHook);


        // IPlanFacilitator
        // manager_id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(this.programplan_shared_module.facilitator_type_id, ModuleDAO.DAO_ACCESS_TYPE_READ, this, this.filterIPlanFacilitatorByManagerByAccess);
        ModuleDAOServer.getInstance().registerContextAccessHook(this.programplan_shared_module.facilitator_type_id, this, this.filterIPlanFacilitatorByManagerByContextAccessHook);

        // IPlanRDV
        // facilitator_id
        // READ team ou tous(en fonction du manager lié au facilitator_id du RDV ...)
        ModuleDAOServer.getInstance().registerAccessHook(this.programplan_shared_module.rdv_type_id, ModuleDAO.DAO_ACCESS_TYPE_READ, this, this.filterRDVsByFacilitatorIdByAccess);
        ModuleDAOServer.getInstance().registerContextAccessHook(this.programplan_shared_module.rdv_type_id, this, this.filterRDVsByFacilitatorIdByContextAccessHook);

        // et CREATE / UPDATE / DELETE own / team / tous => on part du principe que c'est l'interface qui bloque à ce niveau

        // IPlanRDVCR => en fonction du IPlanRDV sur CRUD
        ModuleDAOServer.getInstance().registerAccessHook(this.programplan_shared_module.rdv_cr_type_id, ModuleDAO.DAO_ACCESS_TYPE_READ, this, this.filterRDVCRPrepsByFacilitatorIdByAccess);
        ModuleDAOServer.getInstance().registerContextAccessHook(this.programplan_shared_module.rdv_cr_type_id, this, this.filterRDVCRPrepsByFacilitatorIdByContextAccessHook);

        if (this.programplan_shared_module.rdv_prep_type_id) {
            // IPlanRDVPrep => en fonction du IPlanRDV sur CRUD
            ModuleDAOServer.getInstance().registerAccessHook(this.programplan_shared_module.rdv_prep_type_id, ModuleDAO.DAO_ACCESS_TYPE_READ, this, this.filterRDVCRPrepsByFacilitatorIdByAccess);
            ModuleDAOServer.getInstance().registerContextAccessHook(this.programplan_shared_module.rdv_prep_type_id, this, this.filterRDVCRPrepsByFacilitatorIdByContextAccessHook);
        }
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = this.programplan_shared_module.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'ProgramPlan - ' + this.programplan_shared_module.name
        }));

        let promises = [];
        promises.push((async () => {
            let bo_access: AccessPolicyVO = new AccessPolicyVO();
            bo_access.group_id = group.id;
            bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            bo_access.translatable_name = this.programplan_shared_module.POLICY_BO_ACCESS;
            bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Administration du ProgramPlan - ' + this.programplan_shared_module.name
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
            const admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            admin_access_dependency.src_pol_id = bo_access.id;
            admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
        })());

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            fo_access.group_id = group.id;
            fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            fo_access.translatable_name = this.programplan_shared_module.POLICY_FO_ACCESS;
            fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, DefaultTranslationVO.create_new({
                'fr-fr': 'Accès au ProgramPlan - ' + this.programplan_shared_module.name
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let fo_see_fc: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            fo_see_fc.group_id = group.id;
            fo_see_fc.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            fo_see_fc.translatable_name = this.programplan_shared_module.POLICY_FO_SEE_FC;
            fo_see_fc = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_see_fc, DefaultTranslationVO.create_new({
                'fr-fr': 'Vision calendrier du ProgramPlan - ' + this.programplan_shared_module.name
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let fo_edit: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            fo_edit.group_id = group.id;
            fo_edit.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            fo_edit.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT;
            fo_edit = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_edit, DefaultTranslationVO.create_new({
                'fr-fr': 'Edition du ProgramPlan - ' + this.programplan_shared_module.name
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        await Promise.all(promises);
        promises = [];

        promises.push((async () => {
            const front_access_dependency_seefc: PolicyDependencyVO = new PolicyDependencyVO();
            front_access_dependency_seefc.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            front_access_dependency_seefc.src_pol_id = fo_see_fc.id;
            front_access_dependency_seefc.depends_on_pol_id = fo_access.id;
            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency_seefc);
        })());

        promises.push((async () => {
            const front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            front_access_dependency.src_pol_id = fo_edit.id;
            front_access_dependency.depends_on_pol_id = fo_access.id;
            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        })());
        promises.push(this.registerFrontVisibilityAccessPolicies(group, fo_access));
        promises.push(this.registerFrontEditionAccessPolicies(group, fo_edit));
        await Promise.all(promises);
    }

    public async getPrepsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVPrep[]> {
        const rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(program_id, timeSegment);
        if (!rdvs) {
            return null;
        }

        const ids: number[] = [];
        for (const i in rdvs) {
            ids.push(rdvs[i].id);
        }

        if (!ids.length) {
            return [];
        }
        return await query(this.programplan_shared_module.rdv_prep_type_id).filter_by_num_has(field_names<IPlanRDVPrep>().rdv_id, ids).select_vos<IPlanRDVPrep>();
    }

    public async getCRsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVCR[]> {
        const rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(program_id, timeSegment);
        if (!rdvs) {
            return null;
        }

        const ids: number[] = [];
        for (const i in rdvs) {
            ids.push(rdvs[i].id);
        }

        if (!ids.length) {
            return [];
        }
        return await query(this.programplan_shared_module.rdv_cr_type_id).filter_by_num_has(field_names<IPlanRDVCR>().rdv_id, ids).select_vos<IPlanRDVCR>();
    }

    public async getRDVsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDV[]> {

        if (!timeSegment) {
            return null;
        }

        const start_time: number = TimeSegmentHandler.getStartTimeSegment(timeSegment);
        const end_time: number = TimeSegmentHandler.getEndTimeSegment(timeSegment);

        if (!this.programplan_shared_module.program_type_id) {

            return await query(this.programplan_shared_module.rdv_type_id)
                .filter_is_false(field_names<IPlanRDV>().archived)
                .filter_by_date_before(field_names<IPlanRDV>().start_time, end_time)
                .filter_by_date_same_or_after(field_names<IPlanRDV>().end_time, start_time)
                .select_vos<IPlanRDV>();
        }

        return await query(this.programplan_shared_module.rdv_type_id)
            .filter_is_false(field_names<IPlanRDV>().archived)
            .filter_by_date_before(field_names<IPlanRDV>().start_time, end_time)
            .filter_by_date_same_or_after(field_names<IPlanRDV>().end_time, start_time)
            .filter_by_num_eq(field_names<IPlanRDV>().program_id, program_id)
            .select_vos<IPlanRDV>();
    }

    private async registerFrontVisibilityAccessPolicies(group: AccessPolicyGroupVO, fo_access: AccessPolicyVO) {
        let see_own_team: AccessPolicyVO = new AccessPolicyVO();
        see_own_team.group_id = group.id;
        see_own_team.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        see_own_team.translatable_name = this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM;
        see_own_team = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_own_team, DefaultTranslationVO.create_new({
            'fr-fr': 'Voir son équipe - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = see_own_team.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let see_all_teams: AccessPolicyVO = new AccessPolicyVO();
        see_all_teams.group_id = group.id;
        see_all_teams.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        see_all_teams.translatable_name = this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS;
        see_all_teams = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_all_teams, DefaultTranslationVO.create_new({
            'fr-fr': 'Voir toutes les équipes - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = see_all_teams.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        const see_own_team_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        see_own_team_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        see_own_team_access_dependency.src_pol_id = see_all_teams.id;
        see_own_team_access_dependency.depends_on_pol_id = see_own_team.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(see_own_team_access_dependency);
    }

    private async registerFrontEditionAccessPolicies(group: AccessPolicyGroupVO, fo_edit: AccessPolicyVO) {

        let archive_rdvs: AccessPolicyVO = new AccessPolicyVO();
        archive_rdvs.group_id = group.id;
        archive_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        archive_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_CAN_ARCHIVE_RDV;
        archive_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(archive_rdvs, DefaultTranslationVO.create_new({
            'fr-fr': 'Archiver les RDVs - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = archive_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let edit_own_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_own_rdvs.group_id = group.id;
        edit_own_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_own_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_OWN_RDVS;
        edit_own_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_rdvs, DefaultTranslationVO.create_new({
            'fr-fr': 'Modifier ses propres RDVs - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_own_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let edit_own_team_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_own_team_rdvs.group_id = group.id;
        edit_own_team_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_own_team_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_OWN_TEAM_RDVS;
        edit_own_team_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_team_rdvs, DefaultTranslationVO.create_new({
            'fr-fr': 'Modifier les RDVs de son équipe - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_own_team_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        const edit_own_rdvs_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        edit_own_rdvs_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        edit_own_rdvs_access_dependency.src_pol_id = edit_own_team_rdvs.id;
        edit_own_rdvs_access_dependency.depends_on_pol_id = edit_own_rdvs.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(edit_own_rdvs_access_dependency);

        let edit_all_teams_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_all_teams_rdvs.group_id = group.id;
        edit_all_teams_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_all_teams_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_ALL_RDVS;
        edit_all_teams_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_all_teams_rdvs, DefaultTranslationVO.create_new({
            'fr-fr': 'Modifier tous les RDVs - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_all_teams_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        const edit_own_team_rdvs_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        edit_own_team_rdvs_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        edit_own_team_rdvs_access_dependency.src_pol_id = edit_all_teams_rdvs.id;
        edit_own_team_rdvs_access_dependency.depends_on_pol_id = edit_own_team_rdvs.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(edit_own_team_rdvs_access_dependency);
    }

    /**
     * Context access hook pour les IPlanFacilitator par équipe. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    private async filterIPlanFacilitatorByManagerByContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return null;
        }

        if (!AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        if (!this.programplan_shared_module.manager_type_id) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const is_own_facilitators_manager_filter: ContextFilterVO = new ContextFilterVO();
        is_own_facilitators_manager_filter.field_name = 'user_id';
        is_own_facilitators_manager_filter.vo_type = this.programplan_shared_module.manager_type_id;
        is_own_facilitators_manager_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        is_own_facilitators_manager_filter.param_numeric = loggedUserId;

        const is_own_facilitator_filter: ContextFilterVO = new ContextFilterVO();
        is_own_facilitator_filter.field_name = 'user_id';
        is_own_facilitator_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        is_own_facilitator_filter.param_numeric = loggedUserId;
        is_own_facilitator_filter.vo_type = moduletable.vo_type;

        const root_filter: ContextFilterVO = new ContextFilterVO();
        root_filter.filter_type = ContextFilterVO.TYPE_FILTER_OR;
        root_filter.left_hook = is_own_facilitator_filter;
        root_filter.right_hook = is_own_facilitators_manager_filter;

        return query(moduletable.vo_type).using(this.programplan_shared_module.manager_type_id).field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id').add_filters([root_filter]).exec_as_server();
    }

    /**
     * @deprecated access_hook à remplacer petit à petit par les context_access_hooks
     */
    private async filterIPlanFacilitatorByManagerByAccess(datatable: ModuleTableVO, vos: IPlanFacilitator[], uid: number): Promise<IPlanFacilitator[]> {
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterIPlanFacilitatorByManagerByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    /**
     * Context access hook pour les IPlanManager par équipe. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    private async filterManagerByIdByContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return null;
        }

        if (!AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        if (!this.programplan_shared_module.manager_type_id) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const is_own_facilitators_manager_filter: ContextFilterVO = new ContextFilterVO();
        is_own_facilitators_manager_filter.field_name = 'user_id';
        is_own_facilitators_manager_filter.vo_type = this.programplan_shared_module.facilitator_type_id;
        is_own_facilitators_manager_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        is_own_facilitators_manager_filter.param_numeric = loggedUserId;

        const is_own_manager_filter: ContextFilterVO = new ContextFilterVO();
        is_own_manager_filter.field_name = 'user_id';
        is_own_manager_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        is_own_manager_filter.param_numeric = loggedUserId;
        is_own_manager_filter.vo_type = moduletable.vo_type;

        const root_filter: ContextFilterVO = new ContextFilterVO();
        root_filter.filter_type = ContextFilterVO.TYPE_FILTER_OR;
        root_filter.left_hook = is_own_manager_filter;
        root_filter.right_hook = is_own_facilitators_manager_filter;

        return query(moduletable.vo_type).using(this.programplan_shared_module.facilitator_type_id).field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id').add_filters([root_filter]).exec_as_server();
    }

    /**
     * @deprecated access_hook à remplacer petit à petit par les context_access_hooks
     */
    private async filterManagerByIdByAccess(datatable: ModuleTableVO, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterManagerByIdByAccess_own_team(datatable, vos, uid);
        }
        return null;
    }

    private async filterManagerByIdByAccess_own_team(datatable: ModuleTableVO, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {

        if (!this.programplan_shared_module.manager_type_id) {
            return null;
        }

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return null;
        }

        let is_own_users: boolean = true;
        for (const i in vos) {
            const vo: IPlanManager = vos[i];

            if ((!vo) || (vo.user_id != loggedUserId)) {
                is_own_users = false;
                break;
            }
        }

        if (is_own_users) {
            // Important pour éviter une boucle infinie
            return vos;
        }

        // On check si on est un manager
        const user_managers: IPlanManager[] = await query(this.programplan_shared_module.manager_type_id).filter_by_num_eq(field_names<IPlanManager>().user_id, loggedUserId).select_vos<IPlanManager>();
        if ((!!user_managers) && (user_managers.length > 0)) {

            const res_: IPlanFacilitator[] = [];

            for (const i in vos) {
                const vo = vos[i];
                if ((!!vo) && vo.id) {
                    for (const j in user_managers) {
                        const user_manager: IPlanManager = user_managers[j];

                        if (vo.id == user_manager.id) {
                            res_.push(vo);
                            break;
                        }
                    }
                }
            }

            return res_;
        }

        const user_facilitators: IPlanFacilitator[] = await query(this.programplan_shared_module.facilitator_type_id).filter_by_num_eq(field_names<IPlanFacilitator>().user_id, loggedUserId).select_vos<IPlanFacilitator>();

        if ((!user_facilitators) || (!user_facilitators.length)) {
            return null;
        }

        const res: IPlanManager[] = [];

        for (const i in vos) {
            const vo = vos[i];
            if ((!!vo) && vo.id) {
                for (const j in user_facilitators) {
                    const user_facilitator: IPlanFacilitator = user_facilitators[j];

                    if (!user_facilitator.manager_id) {
                        continue;
                    }

                    if (vo.id == user_facilitator.manager_id) {
                        res.push(vo);
                        break;
                    }
                }
            }
        }

        return res;
    }

    private async filterIPlanFacilitatorByManagerByAccess_ownTeam(datatable: ModuleTableVO, vos: IPlanFacilitator[], uid: number): Promise<IPlanFacilitator[]> {

        if (!this.programplan_shared_module.manager_type_id) {
            return null;
        }

        if (!vos) {
            return null;
        }

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return null;
        }

        let is_own_users: boolean = true;
        for (const i in vos) {
            const vo: IPlanFacilitator = vos[i];

            if ((!vo) || (vo.user_id != loggedUserId)) {
                is_own_users = false;
                break;
            }
        }

        if (is_own_users) {
            // Important pour éviter une boucle infinie
            return vos;
        }

        // On check si on est un manager
        const user_managers: IPlanManager[] = await query(this.programplan_shared_module.manager_type_id).filter_by_num_eq(field_names<IPlanManager>().user_id, loggedUserId).select_vos<IPlanManager>();
        if ((!!user_managers) && (user_managers.length > 0)) {

            const res_: IPlanFacilitator[] = [];

            for (const i in vos) {
                const vo = vos[i];
                if ((!!vo) && vo['manager_id']) {
                    for (const j in user_managers) {
                        const user_manager: IPlanManager = user_managers[j];

                        if (vo['manager_id'] == user_manager.id) {
                            res_.push(vo);
                            break;
                        }
                    }
                }
            }

            return res_;
        }

        const user_facilitators: IPlanFacilitator[] = await query(this.programplan_shared_module.facilitator_type_id).filter_by_num_eq(field_names<IPlanFacilitator>().user_id, loggedUserId).select_vos<IPlanFacilitator>();

        if ((!user_facilitators) || (!user_facilitators.length)) {
            return null;
        }

        const res: IPlanFacilitator[] = [];

        for (const i in vos) {
            const vo = vos[i];
            if ((!!vo) && vo['manager_id']) {

                for (const j in user_facilitators) {
                    const user_facilitator: IPlanFacilitator = user_facilitators[j];

                    if (!user_facilitator.manager_id) {
                        continue;
                    }

                    if (vo['manager_id'] == user_facilitator.manager_id) {
                        res.push(vo);
                        break;
                    }
                }
            }
        }

        return res;
    }

    /**
     * Context access hook pour les IPlanRDV par équipe. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    private async filterRDVsByFacilitatorIdByContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return null;
        }

        if (!AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        const is_own_facilitators_rdv_filter: ContextFilterVO = new ContextFilterVO();
        is_own_facilitators_rdv_filter.field_name = 'user_id';
        is_own_facilitators_rdv_filter.vo_type = this.programplan_shared_module.facilitator_type_id;
        is_own_facilitators_rdv_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        is_own_facilitators_rdv_filter.param_numeric = loggedUserId;

        return query(moduletable.vo_type).field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id').add_filters([is_own_facilitators_rdv_filter]).exec_as_server();
    }

    /**
     * @deprecated access_hook à remplacer petit à petit par les context_access_hooks
     */
    private async filterRDVsByFacilitatorIdByAccess(datatable: ModuleTableVO, vos: IPlanRDV[], uid: number): Promise<IPlanRDV[]> {
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVsByFacilitatorIdByAccess_ownTeam(datatable: ModuleTableVO, vos: IPlanRDV[], uid: number): Promise<IPlanRDV[]> {
        const res: IPlanRDV[] = [];

        const facilitators_by_ids: { [id: number]: IPlanFacilitator } = VOsTypesManager.vosArray_to_vosByIds(
            await query(this.programplan_shared_module.facilitator_type_id).select_vos<IPlanFacilitator>()
        );
        for (const i in vos) {
            const vo = vos[i];
            if ((!!vo) && (!!vo.facilitator_id) && (!!facilitators_by_ids[vo.facilitator_id])) {
                res.push(vo);
            }
        }
        return res;
    }

    /**
     * Context access hook pour les IPlanRDVCR | IPlanRDVPrep par équipe. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    private async filterRDVCRPrepsByFacilitatorIdByContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return null;
        }

        if (!AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        /**
         * Là on utilise la récursivité des subquery, en disant qu'on peut read un cr ou prep de rdv readable
         *  donc on fait une subquery sur rdv.id mais en indiquant bien que cette subquery doit utiliser les context filters access hooks
         */
        const res: ContextQueryVO = query(moduletable.vo_type)
            .field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id')
            .filter_by_num_in(field_names<IPlanRDVCR>().rdv_id,
                query(this.programplan_shared_module.rdv_type_id)
                    .filter_is_false(field_names<IPlanRDV>().archived)
                    .field(field_names<IDistantVOBase>().id, 'filter_' + this.programplan_shared_module.rdv_type_id + '_id_for_filter_' + moduletable.vo_type + '_id'))
            .exec_as_server();

        res.is_access_hook_def = true;
        return res;
    }

    /**
     * @deprecated access_hook à remplacer petit à petit par les context_access_hooks
     */
    private async filterRDVCRPrepsByFacilitatorIdByAccess<T extends IPlanRDVCR[] | IPlanRDVPrep[]>(datatable: ModuleTableVO, vos: T, uid: number): Promise<T> {
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (AccessPolicyServerController.checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam<T extends IPlanRDVCR[] | IPlanRDVPrep[]>(
        datatable: ModuleTableVO,
        vos: T,
        uid: number
    ): Promise<T> {

        const res: T = [] as T;

        const rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.vosArray_to_vosByIds(
            await query(this.programplan_shared_module.rdv_type_id).filter_is_false(field_names<IPlanRDV>().archived).select_vos<IPlanRDV>()
        );
        for (const i in vos) {
            const vo = vos[i];
            if ((!!vo) && (!!vo.rdv_id) && (!!rdvs_by_ids[vo.rdv_id])) {
                res.push(vo as any);
            }
        }
        return res;
    }

    private async handleTriggerSetStateRDVUpdate(vo_update_handler: DAOUpdateVOHolder<IPlanRDV>): Promise<boolean> {
        return this.handleTriggerSetStateRDV(vo_update_handler.post_update_vo);
    }

    private async handleTriggerSetStateRDV(rdv: IPlanRDV): Promise<boolean> {
        if (!rdv) {
            return true;
        }

        if (!rdv.id) {
            rdv.state = this.programplan_shared_module.getRDVState(rdv, null, null);
            return true;
        }

        // Si on est sur une modification on veut juste tester le confirmed, surtout pas les preps et crs ici qui sont gérés sur les triggers des vos en question
        if ((rdv.state >= this.programplan_shared_module.RDV_STATE_CONFIRMED) && (!rdv.target_validation)) {
            rdv.state = this.programplan_shared_module.RDV_STATE_CREATED;
            return true;
        }
        if ((rdv.state == this.programplan_shared_module.RDV_STATE_CREATED) && (rdv.target_validation)) {

            const crs: IPlanRDVCR[] = await query(this.programplan_shared_module.rdv_cr_type_id).filter_by_num_eq(field_names<IPlanRDVCR>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVCR>();

            const cr = crs ? crs[0] : null;

            let prep = null;
            if (this.programplan_shared_module.rdv_prep_type_id) {
                const preps: IPlanRDVPrep[] = await query(this.programplan_shared_module.rdv_prep_type_id).filter_by_num_eq(field_names<IPlanRDVPrep>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVPrep>();
                prep = preps ? preps[0] : null;
            }

            const state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

            if (rdv.state != state) {
                rdv.state = state;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rdv);
            }
        }

        return true;
    }

    private async handleTriggerPreCreateCr(cr: IPlanRDVCR): Promise<boolean> {

        if (!cr) {
            return true;
        }

        const rdv: IPlanRDV = await query(this.programplan_shared_module.rdv_type_id).filter_by_id(cr.rdv_id).exec_as_server().select_vo<IPlanRDV>();

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let prep = null;
        if (this.programplan_shared_module.rdv_prep_type_id) {
            const preps: IPlanRDVPrep[] = await query(this.programplan_shared_module.rdv_prep_type_id).filter_by_num_eq(field_names<IPlanRDVPrep>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVPrep>();

            prep = preps ? preps[0] : null;
        }

        const state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rdv);
        }

        return true;
    }

    private async handleTriggerPreCreatePrep(prep: IPlanRDVPrep): Promise<boolean> {
        if (!prep) {
            return true;
        }

        if (!this.programplan_shared_module.rdv_prep_type_id) {
            return false;
        }

        const rdv: IPlanRDV = await query(this.programplan_shared_module.rdv_type_id).filter_by_id(prep.rdv_id).exec_as_server().select_vo<IPlanRDV>();

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        const crs: IPlanRDVCR[] = await query(this.programplan_shared_module.rdv_cr_type_id).filter_by_num_eq(field_names<IPlanRDVCR>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVCR>();

        const cr = crs ? crs[0] : null;

        const state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rdv);
        }

        return true;
    }

    private async handleTriggerPreDeleteCr(cr: IPlanRDVCR): Promise<boolean> {
        if ((!cr) || (!cr.id)) {
            return true;
        }

        const rdv: IPlanRDV = await query(this.programplan_shared_module.rdv_type_id).filter_by_id(cr.rdv_id).exec_as_server().select_vo<IPlanRDV>();

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let prep = null;

        if (this.programplan_shared_module.rdv_prep_type_id) {
            const preps: IPlanRDVPrep[] = await query(this.programplan_shared_module.rdv_prep_type_id).filter_by_num_eq(field_names<IPlanRDVPrep>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVPrep>();

            prep = preps ? preps[0] : null;
        }

        const state = this.programplan_shared_module.getRDVState(rdv, prep, null);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rdv);
        }

        return true;
    }

    private async handleTriggerPreDeletePrep(prep: IPlanRDVPrep): Promise<boolean> {
        if ((!prep) || (!prep.id)) {
            return true;
        }

        if (!this.programplan_shared_module.rdv_prep_type_id) {
            return false;
        }

        const rdv: IPlanRDV = await query(this.programplan_shared_module.rdv_type_id).filter_by_id(prep.rdv_id).exec_as_server().select_vo<IPlanRDV>();

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        const crs: IPlanRDVCR[] = await query(this.programplan_shared_module.rdv_cr_type_id).filter_by_num_eq(field_names<IPlanRDVCR>().rdv_id, rdv.id).exec_as_server().select_vos<IPlanRDVCR>();

        const cr = crs ? crs[0] : null;

        const state = this.programplan_shared_module.getRDVState(rdv, null, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rdv);
        }

        return true;
    }
}