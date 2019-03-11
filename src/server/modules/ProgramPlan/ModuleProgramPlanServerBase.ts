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

        if ((!timeSegment) || (!program_id)) {
            return null;
        }

        let start_time: Moment = TimeSegmentHandler.getInstance().getStartTimeSegment(timeSegment);
        let end_time: Moment = TimeSegmentHandler.getInstance().getEndTimeSegment(timeSegment);

        return await ModuleDAOServer.getInstance().selectAll<IPlanRDV>(
            ModuleProgramPlanBase.getInstance().rdv_type_id,
            ' where start_time < $2 and end_time >= $1 and program_id = $3',
            [DateHandler.getInstance().formatDateTimeForBDD(start_time), DateHandler.getInstance().formatDateTimeForBDD(end_time), program_id]);
    }
}