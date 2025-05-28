import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../shared/modules/ContextFilter/vos/SortByVO";
import SuiviCompetencesRapportItemDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportItemDataRangesVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesRapportRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    protected static instance: SuiviCompetencesRapportRangesDatasourceController = null;

    public static getInstance(): SuiviCompetencesRapportRangesDatasourceController {
        if (!SuiviCompetencesRapportRangesDatasourceController.instance) {
            SuiviCompetencesRapportRangesDatasourceController.instance = new SuiviCompetencesRapportRangesDatasourceController(
                'SuiviCompetencesRapportRangesDatasourceController',
                [SuiviCompetencesRapportVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Rapport' });
        }
        return SuiviCompetencesRapportRangesDatasourceController.instance;
    }

    public async get_data(param: SuiviCompetencesRapportItemDataRangesVO): Promise<SuiviCompetencesRapportVO[]> {

        return query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .filter_by_ids(param.suivi_comp_rapport_id_ranges)
            .filter_by_date_x_ranges(field_names<SuiviCompetencesRapportVO>().date, param.ts_ranges)
            .set_sort(new SortByVO(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().date, false))
            .select_vos<SuiviCompetencesRapportVO>();
    }
}