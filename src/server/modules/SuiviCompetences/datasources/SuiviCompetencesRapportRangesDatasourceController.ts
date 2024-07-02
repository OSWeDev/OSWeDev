import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../shared/modules/ContextFilter/vos/SortByVO";
import SuiviCompetencesUserDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesUserDataRangesVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesRapportRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesRapportRangesDatasourceController {
        if (!SuiviCompetencesRapportRangesDatasourceController.instance) {
            SuiviCompetencesRapportRangesDatasourceController.instance = new SuiviCompetencesRapportRangesDatasourceController(
                'SuiviCompetencesRapportRangesDatasourceController', [SuiviCompetencesRapportVO.API_TYPE_ID],
                { 'fr-fr': 'SuiviCompetences Rapport Site' });
        }
        return SuiviCompetencesRapportRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesRapportRangesDatasourceController = null;

    public async get_data(param: SuiviCompetencesUserDataRangesVO): Promise<{ [user_id: number]: SuiviCompetencesRapportVO[] }> {
        let res: { [user_id: number]: SuiviCompetencesRapportVO[] } = {};

        let rapports: SuiviCompetencesRapportVO[] = await query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesRapportVO>().user_id, param.user_id_ranges)
            .set_sort(new SortByVO(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().date, false))
            .select_vos<SuiviCompetencesRapportVO>();

        for (let i in rapports) {
            let rapport: SuiviCompetencesRapportVO = rapports[i];

            if (!res[rapport.user_id]) {
                res[rapport.user_id] = [];
            }

            res[rapport.user_id].push(rapport);
        }

        return res;
    }
}