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