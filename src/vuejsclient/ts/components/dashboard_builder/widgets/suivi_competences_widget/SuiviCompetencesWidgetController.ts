import UserVO from "../../../../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import Dates from "../../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import SuiviCompetencesGrilleVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO";
import SuiviCompetencesRapportVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import EnvHandler from "../../../../../../shared/tools/EnvHandler";
import { field_names } from "../../../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../../../shared/tools/PromisePipeline/PromisePipeline";
import VueAppController from "../../../../../VueAppController";
import GeneratePDFClientController from "../../../../modules/GeneratePDF/GeneratePDFClientController";
let export_style = require('./export_style.scss');

export default class SuiviCompetencesWidgetController {
    public static CREATE_ACTION_RAPPORT: number = 1;
    public static DUPLICATE_ACTION_RAPPORT: number = 2;
    public static EDIT_ACTION_RAPPORT: number = 3;

    public static default_rapport_id: number = null;
    public static default_action_rapport: number = null;
    public static default_vo_init_rapport: SuiviCompetencesRapportVO = null;

    public static async download_rapport_pdf(rapport_id: number) {

        return new Promise(async (resolve, reject) => {

            let timeOut = setInterval(async () => {
                if ($('.suivi_competences_widget_component_container').find('.groupe_name').length > 0) {
                    clearInterval(timeOut);

                    let html_content: string = $('.suivi_competences_widget_component_container')[0].outerHTML;
                    let limit = EnvHandler.MAX_POOL / 2; // front
                    let promise_pipeline = new PromisePipeline(limit);

                    let rapport: SuiviCompetencesRapportVO = null;
                    let user: UserVO = null;
                    let grille: SuiviCompetencesGrilleVO = null;

                    await promise_pipeline.push(async () => {
                        rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(rapport_id).select_vo<SuiviCompetencesRapportVO>();
                    });
                    await promise_pipeline.push(async () => {
                        grille = await query(SuiviCompetencesGrilleVO.API_TYPE_ID)
                            .filter_by_id_in(
                                query(SuiviCompetencesRapportVO.API_TYPE_ID)
                                    .field(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id)
                                    .filter_by_id(rapport_id)
                            )
                            .select_vo<SuiviCompetencesGrilleVO>();
                    });
                    await promise_pipeline.push(async () => {
                        user = await query(UserVO.API_TYPE_ID)
                            .filter_by_id_in(
                                query(SuiviCompetencesRapportVO.API_TYPE_ID)
                                    .field(field_names<SuiviCompetencesRapportVO>().user_id)
                                    .filter_by_id(rapport_id)
                            )
                            .select_vo<UserVO>();
                    });

                    await promise_pipeline.end();

                    let sous_rep: string = 'SUIVI_COMPETENCES';
                    let file_name: string = 'SUIVI_COMPETENCES_' + Dates.format(rapport.date, 'DD-MM-YYYY', false) + '_' + user.id + '.pdf';

                    let logo_html: string =
                        '<div class="logo">' +
                        (grille?.logo?.length ? '<img class="logo_grille" src="' + (VueAppController.getInstance().base_url + grille.logo) + '">' : '') +
                        ('<img class="logo_app" src="' + (VueAppController.getInstance().base_url + EnvHandler.LOGO_PATH) + '">') +
                        '</div>';
                    html_content = "<style>" + export_style.css + "</style>" + "<div class='suivi_competences_rapport_pdf'>" + logo_html + html_content + "</div>";

                    resolve(await GeneratePDFClientController.getInstance().generatePDF(
                        sous_rep,
                        file_name,
                        html_content,
                        true,
                    ));
                }
            }, 50);
        });
    }
}