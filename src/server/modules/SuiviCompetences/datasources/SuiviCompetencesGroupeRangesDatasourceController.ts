import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SuiviCompetencesUserDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesUserDataRangesVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";


export default class SuiviCompetencesGroupeRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesGroupeRangesDatasourceController {
        if (!SuiviCompetencesGroupeRangesDatasourceController.instance) {
            SuiviCompetencesGroupeRangesDatasourceController.instance = new SuiviCompetencesGroupeRangesDatasourceController(
                'SuiviCompetencesGroupeRangesDatasourceController',
                [SuiviCompetencesGroupeVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Groupe' }
            );
        }
        return SuiviCompetencesGroupeRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesGroupeRangesDatasourceController = null;

    public async get_data(param: SuiviCompetencesUserDataRangesVO): Promise<SuiviCompetencesGroupeVO[]> {
        return await query(SuiviCompetencesGroupeVO.API_TYPE_ID).select_vos<SuiviCompetencesGroupeVO>();
    }
}