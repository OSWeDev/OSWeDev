
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTable from '../../../shared/modules/ModuleTable';
import IPlanFacilitator from '../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../shared/tools/DateHandler';
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

export default abstract class ModuleProgramPlanServerBase extends ModuleServerBase {

    protected constructor(name: string) {
        super(name);
    }

    get programplan_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    public async configure() {

        // On ajoute les triggers pour le statut des RDVs en fonction des Preps / CRs et confirmation

        // Cycle de vie :
        //  Création de RDV on a un statut created ou confirmed si il est créé confirmed
        //  Mise à jour du RDV : On demande à recalculer le statut du RDV
        //  Ajout / Suppression de CR ou Prep : On demande à recalculer le statut du RDV
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_type_id, this.handleTriggerSetStateRDV.bind(this));

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(this.programplan_shared_module.rdv_type_id, this.handleTriggerSetStateRDVUpdate.bind(this));

        preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_cr_type_id, this.handleTriggerPreCreateCr.bind(this));
        let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        preDeleteTrigger.registerHandler(this.programplan_shared_module.rdv_cr_type_id, this.handleTriggerPreDeleteCr.bind(this));

        if (!!this.programplan_shared_module.rdv_prep_type_id) {
            preCreateTrigger.registerHandler(this.programplan_shared_module.rdv_prep_type_id, this.handleTriggerPreCreatePrep.bind(this));
            preDeleteTrigger.registerHandler(this.programplan_shared_module.rdv_prep_type_id, this.handleTriggerPreDeletePrep.bind(this));
        }

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmer ?'
        }, 'programplan.create_cr.confirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrer le compte-rendu'
        }, 'programplan.create_cr.confirmation.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement en cours...'
        }, 'programplan.create_cr.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'enregistrement du compte-rendu'
        }, 'programplan.create_cr.error.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement du compte-rendu terminé'
        }, 'programplan.create_cr.ok.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____manager_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____region_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Animateur'
        }, 'fields.labels.ref.module_sfam_program_plan_animateur.___LABEL____user_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Boutique'
        }, 'fields.labels.ref.module_sfam_program_plan_boutique.___LABEL____enseigne_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Contact'
        }, 'fields.labels.ref.module_sfam_program_plan_contact.___LABEL____contact_type_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Contact'
        }, 'fields.labels.ref.module_sfam_program_plan_contact.___LABEL____user_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Manager'
        }, 'fields.labels.ref.module_sfam_program_plan_manager.___LABEL____user_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Création interdite'
        }, 'programplan.fc.create.denied.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur de création'
        }, 'programplan.fc.create.error.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression interdite'
        }, 'programplan.fc.delete.denied.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur de suppression'
        }, 'programplan.delete.error.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modification interdite'
        }, 'programplan.fc.update.denied.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur de modification'
        }, 'programplan.fc.update.error.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Date'
        }, 'programplan.rdv_modal.rdv_date.___LABEL___'));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(this.programplan_shared_module.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT, this.getRDVsOfProgramSegment.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(this.programplan_shared_module.APINAME_GET_CRS_OF_PROGRAM_SEGMENT, this.getCRsOfProgramSegment.bind(this));

        if (!!this.programplan_shared_module.rdv_prep_type_id) {

            APIControllerWrapper.getInstance().registerServerApiHandler(this.programplan_shared_module.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT, this.getPrepsOfProgramSegment.bind(this));
        }
    }

    public registerAccessHooks(): void {

        // IPlanManager
        // id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(
            this.programplan_shared_module.manager_type_id,
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            this.filterManagerByIdByAccess.bind(this));

        // IPlanFacilitator
        // manager_id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(
            this.programplan_shared_module.facilitator_type_id,
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            this.filterIPlanFacilitatorByManagerByAccess.bind(this));

        // IPlanRDV
        // facilitator_id
        // READ team ou tous(en fonction du manager lié au facilitator_id du RDV ...)
        ModuleDAOServer.getInstance().registerAccessHook(
            this.programplan_shared_module.rdv_type_id,
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            this.filterRDVsByFacilitatorIdByAccess.bind(this));
        // et CREATE / UPDATE / DELETE own / team / tous => on part du principe que c'est l'interface qui bloque à ce niveau

        // IPlanRDVCR => en fonction du IPlanRDV sur CRUD
        ModuleDAOServer.getInstance().registerAccessHook(
            this.programplan_shared_module.rdv_cr_type_id,
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            this.filterRDVCRPrepsByFacilitatorIdByAccess.bind(this));

        if (!!this.programplan_shared_module.rdv_prep_type_id) {
            // IPlanRDVPrep => en fonction du IPlanRDV sur CRUD
            ModuleDAOServer.getInstance().registerAccessHook(
                this.programplan_shared_module.rdv_prep_type_id,
                ModuleDAO.DAO_ACCESS_TYPE_READ,
                this.filterRDVCRPrepsByFacilitatorIdByAccess.bind(this));
        }
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = this.programplan_shared_module.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'ProgramPlan - ' + this.programplan_shared_module.name
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = this.programplan_shared_module.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration du ProgramPlan - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = this.programplan_shared_module.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            'fr-fr': 'Accès au ProgramPlan - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let fo_see_fc: AccessPolicyVO = new AccessPolicyVO();
        fo_see_fc.group_id = group.id;
        fo_see_fc.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_see_fc.translatable_name = this.programplan_shared_module.POLICY_FO_SEE_FC;
        fo_see_fc = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_see_fc, new DefaultTranslation({
            'fr-fr': 'Vision calendrier du ProgramPlan - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency_seefc: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency_seefc.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency_seefc.src_pol_id = fo_see_fc.id;
        front_access_dependency_seefc.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency_seefc);


        let fo_edit: AccessPolicyVO = new AccessPolicyVO();
        fo_edit.group_id = group.id;
        fo_edit.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_edit.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT;
        fo_edit = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_edit, new DefaultTranslation({
            'fr-fr': 'Edition du ProgramPlan - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = fo_edit.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        await this.registerFrontVisibilityAccessPolicies(group, fo_access);
        await this.registerFrontEditionAccessPolicies(group, fo_edit);
    }

    public async getPrepsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVPrep[]> {
        let rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(program_id, timeSegment);
        if (!rdvs) {
            return null;
        }

        let ids: number[] = [];
        for (let i in rdvs) {
            ids.push(rdvs[i].id);
        }
        return await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(this.programplan_shared_module.rdv_prep_type_id, 'rdv_id', ids);
    }

    public async getCRsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVCR[]> {
        let rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(program_id, timeSegment);
        if (!rdvs) {
            return null;
        }

        let ids: number[] = [];
        for (let i in rdvs) {
            ids.push(rdvs[i].id);
        }
        return await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(this.programplan_shared_module.rdv_cr_type_id, 'rdv_id', ids);
    }

    public async getRDVsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDV[]> {

        if (!timeSegment) {
            return null;
        }

        let start_time: number = TimeSegmentHandler.getInstance().getStartTimeSegment(timeSegment);
        let end_time: number = TimeSegmentHandler.getInstance().getEndTimeSegment(timeSegment);

        if (!this.programplan_shared_module.program_type_id) {

            return await ModuleDAOServer.getInstance().selectAll<IPlanRDV>(
                this.programplan_shared_module.rdv_type_id,
                ' where start_time < $2 and end_time >= $1',
                [start_time, end_time]);
        }

        return await ModuleDAOServer.getInstance().selectAll<IPlanRDV>(
            this.programplan_shared_module.rdv_type_id,
            ' where start_time < $2 and end_time >= $1 and program_id = $3',
            [start_time, end_time, program_id]);
    }

    private async registerFrontVisibilityAccessPolicies(group: AccessPolicyGroupVO, fo_access: AccessPolicyVO) {
        let see_own_team: AccessPolicyVO = new AccessPolicyVO();
        see_own_team.group_id = group.id;
        see_own_team.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        see_own_team.translatable_name = this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM;
        see_own_team = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_own_team, new DefaultTranslation({
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
        see_all_teams = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_all_teams, new DefaultTranslation({
            'fr-fr': 'Voir toutes les équipes - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = see_all_teams.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        let see_own_team_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        see_own_team_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        see_own_team_access_dependency.src_pol_id = see_all_teams.id;
        see_own_team_access_dependency.depends_on_pol_id = see_own_team.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(see_own_team_access_dependency);
    }

    private async registerFrontEditionAccessPolicies(group: AccessPolicyGroupVO, fo_edit: AccessPolicyVO) {

        let edit_own_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_own_rdvs.group_id = group.id;
        edit_own_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_own_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_OWN_RDVS;
        edit_own_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_rdvs, new DefaultTranslation({
            'fr-fr': 'Modifier ses propres RDVs - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_own_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let edit_own_team_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_own_team_rdvs.group_id = group.id;
        edit_own_team_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_own_team_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_OWN_TEAM_RDVS;
        edit_own_team_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_team_rdvs, new DefaultTranslation({
            'fr-fr': 'Modifier les RDVs de son équipe - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_own_team_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        let edit_own_rdvs_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        edit_own_rdvs_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        edit_own_rdvs_access_dependency.src_pol_id = edit_own_team_rdvs.id;
        edit_own_rdvs_access_dependency.depends_on_pol_id = edit_own_rdvs.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(edit_own_rdvs_access_dependency);

        let edit_all_teams_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_all_teams_rdvs.group_id = group.id;
        edit_all_teams_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_all_teams_rdvs.translatable_name = this.programplan_shared_module.POLICY_FO_EDIT_ALL_RDVS;
        edit_all_teams_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_all_teams_rdvs, new DefaultTranslation({
            'fr-fr': 'Modifier tous les RDVs - ' + this.programplan_shared_module.name
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        front_access_dependency = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_all_teams_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);
        let edit_own_team_rdvs_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        edit_own_team_rdvs_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        edit_own_team_rdvs_access_dependency.src_pol_id = edit_all_teams_rdvs.id;
        edit_own_team_rdvs_access_dependency.depends_on_pol_id = edit_own_team_rdvs.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(edit_own_team_rdvs_access_dependency);
    }

    private async filterIPlanFacilitatorByManagerByAccess(datatable: ModuleTable<IPlanFacilitator>, vos: IPlanFacilitator[], uid: number): Promise<IPlanFacilitator[]> {
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterIPlanFacilitatorByManagerByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterManagerByIdByAccess(datatable: ModuleTable<IPlanManager>, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterManagerByIdByAccess_own_team(datatable, vos, uid);
        }
        return null;
    }

    private async filterManagerByIdByAccess_own_team(datatable: ModuleTable<IPlanManager>, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {

        if (!this.programplan_shared_module.manager_type_id) {
            return null;
        }

        let loggedUserId: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        if (!loggedUserId) {
            return null;
        }

        let is_own_users: boolean = true;
        for (let i in vos) {
            let vo: IPlanManager = vos[i];

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
        let user_managers: IPlanManager[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanManager>(
            this.programplan_shared_module.manager_type_id, 'user_id', [loggedUserId]);
        if ((!!user_managers) && (user_managers.length > 0)) {

            let res_: IPlanFacilitator[] = [];

            for (let i in vos) {
                let vo = vos[i];
                if ((!!vo) && vo.id) {
                    for (let j in user_managers) {
                        let user_manager: IPlanManager = user_managers[j];

                        if (vo.id == user_manager.id) {
                            res_.push(vo);
                            break;
                        }
                    }
                }
            }

            return res_;
        }

        let user_facilitators: IPlanFacilitator[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanFacilitator>(
            this.programplan_shared_module.facilitator_type_id, 'user_id', [loggedUserId]);

        if ((!user_facilitators) || (!user_facilitators.length)) {
            return null;
        }

        let res: IPlanManager[] = [];

        for (let i in vos) {
            let vo = vos[i];
            if ((!!vo) && vo.id) {
                for (let j in user_facilitators) {
                    let user_facilitator: IPlanFacilitator = user_facilitators[j];

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

    private async filterIPlanFacilitatorByManagerByAccess_ownTeam(datatable: ModuleTable<IPlanFacilitator>, vos: IPlanFacilitator[], uid: number): Promise<IPlanFacilitator[]> {

        if (!this.programplan_shared_module.manager_type_id) {
            return null;
        }

        if (!vos) {
            return null;
        }

        let loggedUserId: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        if (!loggedUserId) {
            return null;
        }

        let is_own_users: boolean = true;
        for (let i in vos) {
            let vo: IPlanFacilitator = vos[i];

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
        let user_managers: IPlanManager[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanManager>(
            this.programplan_shared_module.manager_type_id, 'user_id', [loggedUserId]);
        if ((!!user_managers) && (user_managers.length > 0)) {

            let res_: IPlanFacilitator[] = [];

            for (let i in vos) {
                let vo = vos[i];
                if ((!!vo) && vo['manager_id']) {
                    for (let j in user_managers) {
                        let user_manager: IPlanManager = user_managers[j];

                        if (vo['manager_id'] == user_manager.id) {
                            res_.push(vo);
                            break;
                        }
                    }
                }
            }

            return res_;
        }

        let user_facilitators: IPlanFacilitator[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanFacilitator>(
            this.programplan_shared_module.facilitator_type_id, 'user_id', [loggedUserId]);

        if ((!user_facilitators) || (!user_facilitators.length)) {
            return null;
        }

        let res: IPlanFacilitator[] = [];

        for (let i in vos) {
            let vo = vos[i];
            if ((!!vo) && vo['manager_id']) {

                for (let j in user_facilitators) {
                    let user_facilitator: IPlanFacilitator = user_facilitators[j];

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


    private async filterRDVsByFacilitatorIdByAccess(datatable: ModuleTable<IPlanRDV>, vos: IPlanRDV[], uid: number): Promise<IPlanRDV[]> {
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVsByFacilitatorIdByAccess_ownTeam(datatable: ModuleTable<IPlanRDV>, vos: IPlanRDV[], uid: number): Promise<IPlanRDV[]> {
        let res: IPlanRDV[] = [];

        let facilitators_by_ids: { [id: number]: IPlanFacilitator } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<IPlanFacilitator>(this.programplan_shared_module.facilitator_type_id)
        );
        for (let i in vos) {
            let vo = vos[i];
            if ((!!vo) && (!!vo.facilitator_id) && (!!facilitators_by_ids[vo.facilitator_id])) {
                res.push(vo);
            }
        }
        return res;
    }

    private async filterRDVCRPrepsByFacilitatorIdByAccess(datatable: ModuleTable<IPlanRDVCR | IPlanRDVPrep>, vos: IPlanRDVCR[] | IPlanRDVPrep[], uid: number): Promise<IPlanRDVCR[] | IPlanRDVPrep[]> {
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (ModuleAccessPolicyServer.getInstance().checkAccessSync(this.programplan_shared_module.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam(datatable: ModuleTable<IPlanRDVCR | IPlanRDVPrep>, vos: IPlanRDVCR[] | IPlanRDVPrep[], uid: number): Promise<IPlanRDVCR[] | IPlanRDVPrep[]> {
        let res = [];

        let rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<IPlanRDV>(this.programplan_shared_module.rdv_type_id)
        );
        for (let i in vos) {
            let vo = vos[i];
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

            let crs: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(this.programplan_shared_module.rdv_cr_type_id, 'rdv_id', [rdv.id]);

            let cr = crs ? crs[0] : null;

            let prep = null;
            if (!!this.programplan_shared_module.rdv_prep_type_id) {
                let preps: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(this.programplan_shared_module.rdv_prep_type_id, 'rdv_id', [rdv.id]);
                prep = preps ? preps[0] : null;
            }

            let state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

            if (rdv.state != state) {
                rdv.state = state;
                await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
            }
        }

        return true;
    }

    private async handleTriggerPreCreateCr(cr: IPlanRDVCR): Promise<boolean> {

        if (!cr) {
            return true;
        }

        let rdv: IPlanRDV = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.programplan_shared_module.rdv_type_id, cr.rdv_id);

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let prep = null;
        if (!!this.programplan_shared_module.rdv_prep_type_id) {
            let preps: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(this.programplan_shared_module.rdv_prep_type_id, 'rdv_id', [rdv.id]);

            prep = preps ? preps[0] : null;
        }

        let state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
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

        let rdv: IPlanRDV = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.programplan_shared_module.rdv_type_id, prep.rdv_id);

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let crs: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(this.programplan_shared_module.rdv_cr_type_id, 'rdv_id', [rdv.id]);

        let cr = crs ? crs[0] : null;

        let state = this.programplan_shared_module.getRDVState(rdv, prep, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
        }

        return true;
    }

    private async handleTriggerPreDeleteCr(cr: IPlanRDVCR): Promise<boolean> {
        if ((!cr) || (!cr.id)) {
            return true;
        }

        let rdv: IPlanRDV = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.programplan_shared_module.rdv_type_id, cr.rdv_id);

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let prep = null;

        if (!!this.programplan_shared_module.rdv_prep_type_id) {
            let preps: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(this.programplan_shared_module.rdv_prep_type_id, 'rdv_id', [rdv.id]);

            prep = preps ? preps[0] : null;
        }

        let state = this.programplan_shared_module.getRDVState(rdv, prep, null);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
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

        let rdv: IPlanRDV = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.programplan_shared_module.rdv_type_id, prep.rdv_id);

        if ((!rdv) || (!rdv.id)) {
            return true;
        }

        let crs: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(this.programplan_shared_module.rdv_cr_type_id, 'rdv_id', [rdv.id]);

        let cr = crs ? crs[0] : null;

        let state = this.programplan_shared_module.getRDVState(rdv, null, cr);

        if (rdv.state != state) {
            rdv.state = state;
            await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
        }

        return true;
    }
}