import { Moment } from 'moment';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IPlanRDV from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import ProgramSegmentParamVO from '../../../shared/modules/ProgramPlan/vos/ProgramSegmentParamVO';
import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModulesManagerServer from '../ModulesManagerServer';
import IPlanRDVPrep from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import IPlanFacilitator from '../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import IPlanManager from '../../../shared/modules/ProgramPlan/interfaces/IPlanManager';

export default abstract class ModuleProgramPlanServerBase extends ModuleServerBase {

    public static getInstance() {
        return ModuleProgramPlanServerBase.instance;
    }

    private static instance: ModuleProgramPlanServerBase = null;

    protected constructor(name: string) {
        super(name);
        ModuleProgramPlanServerBase.instance = this;
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProgramPlanBase.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT, this.getRDVsOfProgramSegment.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProgramPlanBase.APINAME_GET_CRS_OF_PROGRAM_SEGMENT, this.getCRsOfProgramSegment.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProgramPlanBase.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT, this.getPrepsOfProgramSegment.bind(this));
    }

    public registerAccessHooks(): void {

        // IPlanManager
        // id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(
            ModuleProgramPlanBase.getInstance().manager_type_id,
            ModuleDAOServer.DAO_ACCESS_TYPE_READ,
            this.filterManagerByIdByAccess.bind(this));

        // IPlanFacilitator
        // manager_id
        // READ team ou tous
        ModuleDAOServer.getInstance().registerAccessHook(
            ModuleProgramPlanBase.getInstance().facilitator_type_id,
            ModuleDAOServer.DAO_ACCESS_TYPE_READ,
            this.filterIPlanFacilitatorByManagerByAccess.bind(this));

        // IPlanRDV
        // facilitator_id
        // READ team ou tous(en fonction du manager lié au facilitator_id du RDV ...)
        ModuleDAOServer.getInstance().registerAccessHook(
            ModuleProgramPlanBase.getInstance().rdv_type_id,
            ModuleDAOServer.DAO_ACCESS_TYPE_READ,
            this.filterRDVsByFacilitatorIdByAccess.bind(this));
        // et CREATE / UPDATE / DELETE own / team / tous => on part du principe que c'est l'interface qui bloque à ce niveau

        // IPlanRDVCR => en fonction du IPlanRDV sur CRUD
        ModuleDAOServer.getInstance().registerAccessHook(
            ModuleProgramPlanBase.getInstance().rdv_cr_type_id,
            ModuleDAOServer.DAO_ACCESS_TYPE_READ,
            this.filterRDVCRPrepsByFacilitatorIdByAccess.bind(this));

        // IPlanRDVPrep => en fonction du IPlanRDV sur CRUD
        ModuleDAOServer.getInstance().registerAccessHook(
            ModuleProgramPlanBase.getInstance().rdv_prep_type_id,
            ModuleDAOServer.DAO_ACCESS_TYPE_READ,
            this.filterRDVCRPrepsByFacilitatorIdByAccess.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleProgramPlanBase.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'ProgramPlan'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleProgramPlanBase.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration du ProgramPlan'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleProgramPlanBase.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Accès au ProgramPlan'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));


        let fo_edit: AccessPolicyVO = new AccessPolicyVO();
        fo_edit.group_id = group.id;
        fo_edit.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_edit.translatable_name = ModuleProgramPlanBase.POLICY_FO_EDIT;
        fo_edit = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_edit, new DefaultTranslation({
            fr: 'Edition du ProgramPlan'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = fo_edit.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        await this.registerFrontVisibilityAccessPolicies(group, fo_access);
        await this.registerFrontEditionAccessPolicies(group, fo_edit);
    }

    public async getPrepsOfProgramSegment(params: ProgramSegmentParamVO): Promise<IPlanRDVPrep[]> {
        let rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(params);
        if (!rdvs) {
            return null;
        }

        let ids: number[] = [];
        for (let i in rdvs) {
            ids.push(rdvs[i].id);
        }
        return await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(ModuleProgramPlanBase.getInstance().rdv_prep_type_id, 'rdv_id', ids);
    }

    public async getCRsOfProgramSegment(params: ProgramSegmentParamVO): Promise<IPlanRDVCR[]> {
        let rdvs: IPlanRDV[] = await this.getRDVsOfProgramSegment(params);
        if (!rdvs) {
            return null;
        }

        let ids: number[] = [];
        for (let i in rdvs) {
            ids.push(rdvs[i].id);
        }
        return await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, 'rdv_id', ids);
    }

    public async getRDVsOfProgramSegment(params: ProgramSegmentParamVO): Promise<IPlanRDV[]> {
        let program_id: number = params.program_id;
        let timeSegment: TimeSegment = params.timeSegment;

        if (!timeSegment) {
            return null;
        }

        let start_time: Moment = TimeSegmentHandler.getInstance().getStartTimeSegment(timeSegment);
        let end_time: Moment = TimeSegmentHandler.getInstance().getEndTimeSegment(timeSegment);

        if (!ModuleProgramPlanBase.getInstance().program_type_id) {

            return await ModuleDAOServer.getInstance().selectAll<IPlanRDV>(
                ModuleProgramPlanBase.getInstance().rdv_type_id,
                ' where start_time < $2 and end_time >= $1',
                [DateHandler.getInstance().formatDateTimeForBDD(start_time), DateHandler.getInstance().formatDateTimeForBDD(end_time)]);
        }

        return await ModuleDAOServer.getInstance().selectAll<IPlanRDV>(
            ModuleProgramPlanBase.getInstance().rdv_type_id,
            ' where start_time < $2 and end_time >= $1 and program_id = $3',
            [DateHandler.getInstance().formatDateTimeForBDD(start_time), DateHandler.getInstance().formatDateTimeForBDD(end_time), program_id]);
    }

    private async registerFrontVisibilityAccessPolicies(group: AccessPolicyGroupVO, fo_access: AccessPolicyVO) {
        let see_own_team: AccessPolicyVO = new AccessPolicyVO();
        see_own_team.group_id = group.id;
        see_own_team.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        see_own_team.translatable_name = ModuleProgramPlanBase.POLICY_FO_SEE_OWN_TEAM;
        see_own_team = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_own_team, new DefaultTranslation({
            fr: 'Voir son équipe'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = see_own_team.id;
        front_access_dependency.depends_on_pol_id = fo_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let see_all_teams: AccessPolicyVO = new AccessPolicyVO();
        see_all_teams.group_id = group.id;
        see_all_teams.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        see_all_teams.translatable_name = ModuleProgramPlanBase.POLICY_FO_SEE_ALL_TEAMS;
        see_all_teams = await ModuleAccessPolicyServer.getInstance().registerPolicy(see_all_teams, new DefaultTranslation({
            fr: 'Voir toutes les équipes'
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
        edit_own_rdvs.translatable_name = ModuleProgramPlanBase.POLICY_FO_EDIT_OWN_RDVS;
        edit_own_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_rdvs, new DefaultTranslation({
            fr: 'Modifier ses propres RDVs'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let front_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        front_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        front_access_dependency.src_pol_id = edit_own_rdvs.id;
        front_access_dependency.depends_on_pol_id = fo_edit.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(front_access_dependency);

        let edit_own_team_rdvs: AccessPolicyVO = new AccessPolicyVO();
        edit_own_team_rdvs.group_id = group.id;
        edit_own_team_rdvs.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        edit_own_team_rdvs.translatable_name = ModuleProgramPlanBase.POLICY_FO_EDIT_OWN_TEAM_RDVS;
        edit_own_team_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_own_team_rdvs, new DefaultTranslation({
            fr: 'Modifier les RDVs de son équipe'
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
        edit_all_teams_rdvs.translatable_name = ModuleProgramPlanBase.POLICY_FO_EDIT_ALL_RDVS;
        edit_all_teams_rdvs = await ModuleAccessPolicyServer.getInstance().registerPolicy(edit_all_teams_rdvs, new DefaultTranslation({
            fr: 'Modifier tous les RDVs'
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
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterIPlanFacilitatorByManagerByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterManagerByIdByAccess(datatable: ModuleTable<IPlanManager>, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterManagerByIdByAccess_own_team(datatable, vos, uid);
        }
        return null;
    }

    private async filterManagerByIdByAccess_own_team(datatable: ModuleTable<IPlanManager>, vos: IPlanManager[], uid: number): Promise<IPlanManager[]> {

        if (!ModuleProgramPlanBase.getInstance().manager_type_id) {
            return null;
        }

        let loggedUser: UserVO = await ModuleAccessPolicyServer.getInstance().getLoggedUser();
        if (!loggedUser) {
            return null;
        }

        let is_own_users: boolean = true;
        for (let i in vos) {
            let vo: IPlanManager = vos[i];

            if ((!vo) || (vo.user_id != loggedUser.id)) {
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
            ModuleProgramPlanBase.getInstance().manager_type_id, 'user_id', [loggedUser.id]);
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
            ModuleProgramPlanBase.getInstance().facilitator_type_id, 'user_id', [loggedUser.id]);

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

        if (!ModuleProgramPlanBase.getInstance().manager_type_id) {
            return null;
        }

        if (!vos) {
            return null;
        }

        let loggedUser: UserVO = await ModuleAccessPolicyServer.getInstance().getLoggedUser();
        if (!loggedUser) {
            return null;
        }

        let is_own_users: boolean = true;
        for (let i in vos) {
            let vo: IPlanFacilitator = vos[i];

            if ((!vo) || (vo.user_id != loggedUser.id)) {
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
            ModuleProgramPlanBase.getInstance().manager_type_id, 'user_id', [loggedUser.id]);
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
            ModuleProgramPlanBase.getInstance().facilitator_type_id, 'user_id', [loggedUser.id]);

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
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVsByFacilitatorIdByAccess_ownTeam(datatable: ModuleTable<IPlanRDV>, vos: IPlanRDV[], uid: number): Promise<IPlanRDV[]> {
        let res: IPlanRDV[] = [];

        let facilitators_by_ids: { [id: number]: IPlanFacilitator } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<IPlanFacilitator>(ModuleProgramPlanBase.getInstance().facilitator_type_id)
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
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_ALL_TEAMS)) {
            return vos;
        }
        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_SEE_OWN_TEAM)) {
            return await this.filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam(datatable, vos, uid);
        }
        return null;
    }

    private async filterRDVCRPrepsByFacilitatorIdByAccess_ownTeam(datatable: ModuleTable<IPlanRDVCR | IPlanRDVPrep>, vos: IPlanRDVCR[] | IPlanRDVPrep[], uid: number): Promise<IPlanRDVCR[] | IPlanRDVPrep[]> {
        let res = [];

        let rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id)
        );
        for (let i in vos) {
            let vo = vos[i];
            if ((!!vo) && (!!vo.rdv_id) && (!!rdvs_by_ids[vo.rdv_id])) {
                res.push(vo as any);
            }
        }
        return res;
    }
}