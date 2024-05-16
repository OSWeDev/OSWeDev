import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import ModuleSuiviCompetences from "../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences";
import SuiviCompetencesGroupeResult from "../../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult";
import SuiviCompetencesUserDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesUserDataRangesVO";
import SuiviCompetencesGrilleVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesGrilleRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesGrilleRangesDatasourceController {
        if (!SuiviCompetencesGrilleRangesDatasourceController.instance) {
            SuiviCompetencesGrilleRangesDatasourceController.instance = new SuiviCompetencesGrilleRangesDatasourceController(
                'SuiviCompetencesGrilleRangesDatasourceController',
                [SuiviCompetencesGroupeVO.API_TYPE_ID, SuiviCompetencesSousGroupeVO.API_TYPE_ID, SuiviCompetencesGrilleVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Groupe Result' }
            );
        }
        return SuiviCompetencesGrilleRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesGrilleRangesDatasourceController = null;

    public async get_data(param: SuiviCompetencesUserDataRangesVO): Promise<{ [grille_id: number]: SuiviCompetencesGroupeResult[] }> {
        let grilles: SuiviCompetencesGrilleVO[] = await query(SuiviCompetencesGrilleVO.API_TYPE_ID).select_vos<SuiviCompetencesGrilleVO>();

        let res: { [grille_id: number]: SuiviCompetencesGroupeResult[] } = {};

        for (let i in grilles) {
            res[grilles[i].id] = await ModuleSuiviCompetences.getInstance().get_all_suivi_competences_groupe([RangeHandler.create_single_elt_NumRange(grilles[i].id, NumSegment.TYPE_INT)]);
        }

        return res;
    }
}