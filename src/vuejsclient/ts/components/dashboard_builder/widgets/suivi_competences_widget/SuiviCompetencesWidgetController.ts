import UserVO from "../../../../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import Dates from "../../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import SuiviCompetencesRapportVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import EnvHandler from "../../../../../../shared/tools/EnvHandler";
import { field_names } from "../../../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../../../shared/tools/PromisePipeline/PromisePipeline";
import TemplateHandlerClient from "../../../../../../shared/tools/TemplateHandlerClient";
import VueAppBase from "../../../../../VueAppBase";
import VueAppController from "../../../../../VueAppController";
import GeneratePDFClientController from "../../../../modules/GeneratePDF/GeneratePDFClientController";
import export_suivi_competences_rapport_html_template from './export_suivi_competences_rapport_html_template';

export default class SuiviCompetencesWidgetController {
    public static CREATE_ACTION_RAPPORT: number = 1;
    public static DUPLICATE_ACTION_RAPPORT: number = 2;
    public static EDIT_ACTION_RAPPORT: number = 3;

    public static default_rapport_id: number = null;
    public static default_action_rapport: number = null;
    public static default_vo_init_rapport: SuiviCompetencesRapportVO = null;

    public static async download_rapport_pdf(rapport_id: number) {

        let limit = EnvHandler.MAX_POOL / 2; // front
        let promise_pipeline = new PromisePipeline(limit);

        let rapport: SuiviCompetencesRapportVO = null;
        let user: UserVO = null;

        await promise_pipeline.push(async () => {
            rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(rapport_id).select_vo<SuiviCompetencesRapportVO>();
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

        let vars = {
            base_url: VueAppController.getInstance().base_url,
            logo_url: EnvHandler.LOGO_PATH,
            user_name: user?.name,
            date: Dates.format(rapport.date, 'DD/MM/YYYY', false),
            name: rapport.name,
            points_cles: rapport.points_cles,
            objectif_prochaine_visite: rapport.objectif_prochaine_visite,
            groupe_1_name: "GROUPE 1",
            groupe_1_rowspan: "3",
        };

        let html_content: string = TemplateHandlerClient.getInstance().prepareHTML(
            export_suivi_competences_rapport_html_template,
            {},
            vars,
            VueAppBase.getInstance().vueInstance.t
        );

        return await GeneratePDFClientController.getInstance().generatePDF(
            sous_rep,
            file_name,
            html_content,
            true,
        );
    }
}