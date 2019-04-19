import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';

export default class UpdateRDVStatesCronWorker implements ICronWorker {

    public static getInstance() {
        if (!UpdateRDVStatesCronWorker.instance) {
            UpdateRDVStatesCronWorker.instance = new UpdateRDVStatesCronWorker();
        }
        return UpdateRDVStatesCronWorker.instance;
    }

    private static instance: UpdateRDVStatesCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "UpdateRDVStatesCronWorker";
    }

    public async work() {
        let rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVos<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id);

        for (let i in rdvs) {

            let rdv: IPlanRDV = rdvs[i];

            let crs: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, 'rdv_id', [rdv.id]);

            let cr = crs ? crs[0] : null;

            let state = ModuleProgramPlanBase.getInstance().getRDVState(rdv, null, cr);

            if (rdv.state != state) {
                rdv.state = state;
                await ModuleDAO.getInstance().insertOrUpdateVO(rdv);
            }
        }
    }
}