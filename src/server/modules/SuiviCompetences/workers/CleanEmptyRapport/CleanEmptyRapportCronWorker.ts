
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SuiviCompetencesItemRapportVO from '../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO';
import SuiviCompetencesRapportVO from '../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';

export default class CleanEmptyRapportCronWorker implements ICronWorker {

    private static instance: CleanEmptyRapportCronWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "CleanEmptyRapportCronWorker";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!CleanEmptyRapportCronWorker.instance) {
            CleanEmptyRapportCronWorker.instance = new CleanEmptyRapportCronWorker();
        }
        return CleanEmptyRapportCronWorker.instance;
    }

    // On va supprimer tous les rapports qui n'ont pas d'item associés
    public async work() {
        await query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .filter_by_id_not_in(
                query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
                    .field(field_names<SuiviCompetencesItemRapportVO>().rapport_id)
                    .exec_as_server()
            )
            .exec_as_server()
            .delete_vos();
    }
}