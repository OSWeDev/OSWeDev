import ContextQueryVO, { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../shared/modules/ContextFilter/vos/SortByVO";
import SuiviCompetencesGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesGroupeUserTsRangesDataRangesVO";
import SuiviCompetencesSousGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesSousGroupeUserTsRangesDataRangesVO";
import SuiviCompetencesUserDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesUserDataRangesVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesRapportByUserRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    protected static instance: SuiviCompetencesRapportByUserRangesDatasourceController = null;

    public static getInstance(): SuiviCompetencesRapportByUserRangesDatasourceController {
        if (!SuiviCompetencesRapportByUserRangesDatasourceController.instance) {
            SuiviCompetencesRapportByUserRangesDatasourceController.instance = new SuiviCompetencesRapportByUserRangesDatasourceController(
                'SuiviCompetencesRapportByUserRangesDatasourceController',
                [SuiviCompetencesRapportVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Rapport par user' });
        }
        return SuiviCompetencesRapportByUserRangesDatasourceController.instance;
    }

    public async get_data(param: SuiviCompetencesUserDataRangesVO | SuiviCompetencesGroupeUserTsRangesDataRangesVO | SuiviCompetencesSousGroupeUserTsRangesDataRangesVO): Promise<{ [user_id: number]: SuiviCompetencesRapportVO[] }> {
        let res: { [user_id: number]: SuiviCompetencesRapportVO[] } = {};

        let rapport_query: ContextQueryVO = query(SuiviCompetencesRapportVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesRapportVO>().user_id, param.user_id_ranges)
            .exec_as_server()
            .set_sort(new SortByVO(SuiviCompetencesRapportVO.API_TYPE_ID, field_names<SuiviCompetencesRapportVO>().date, false));

        if (
            (param._type == SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID) ||
            (param._type == SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID)
        ) {
            rapport_query.filter_by_date_x_ranges(field_names<SuiviCompetencesRapportVO>().date, (param as SuiviCompetencesGroupeUserTsRangesDataRangesVO).ts_ranges);
            rapport_query.filter_by_num_x_ranges(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id, (param as SuiviCompetencesGroupeUserTsRangesDataRangesVO).suivi_comp_grille_id_ranges);
        }

        let rapports: SuiviCompetencesRapportVO[] = await rapport_query
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