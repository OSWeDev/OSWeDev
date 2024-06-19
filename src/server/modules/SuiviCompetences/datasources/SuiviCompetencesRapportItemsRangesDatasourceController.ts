import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../shared/modules/ContextFilter/vos/SortByVO";
import SuiviCompetencesRapportItemDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportItemDataRangesVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesRapportItemsRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesRapportItemsRangesDatasourceController {
        if (!SuiviCompetencesRapportItemsRangesDatasourceController.instance) {
            SuiviCompetencesRapportItemsRangesDatasourceController.instance = new SuiviCompetencesRapportItemsRangesDatasourceController(
                'SuiviCompetencesRapportItemsRangesDatasourceController',
                [SuiviCompetencesRapportVO.API_TYPE_ID, SuiviCompetencesItemRapportVO.API_TYPE_ID],
                { 'fr-fr': 'SuiviCompetences Items Rapport' });
        }
        return SuiviCompetencesRapportItemsRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesRapportItemsRangesDatasourceController = null;

    public async get_data(param: SuiviCompetencesRapportItemDataRangesVO): Promise<{ [rapport_id: number]: SuiviCompetencesItemRapportVO[] }> {
        let res: { [rapport_id: number]: SuiviCompetencesItemRapportVO[] } = {};

        let items: SuiviCompetencesItemRapportVO[] = await query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesItemRapportVO>().rapport_id, param.suivi_comp_rapport_id_ranges)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesItemRapportVO>().suivi_comp_item_id, param.suivi_comp_item_id_ranges)
            .filter_by_date_x_ranges(field_names<SuiviCompetencesRapportVO>().date, param.ts_ranges, SuiviCompetencesRapportVO.API_TYPE_ID)
            .set_sort(new SortByVO(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().date, false))
            .select_vos<SuiviCompetencesItemRapportVO>();

        for (let i in items) {
            let item: SuiviCompetencesItemRapportVO = items[i];

            if (!res[item.rapport_id]) {
                res[item.rapport_id] = [];
            }

            res[item.rapport_id].push(item);
        }

        return res;
    }
}