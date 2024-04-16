import { Component, Prop, Watch } from 'vue-property-decorator';
import "./SuiviCompetencesDownloadRapportComponent.scss";
import VueComponentBase from '../../VueComponentBase';
import TableColumnDescVO from '../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import SuiviCompetencesRapportVO from '../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TemplateHandlerClient from '../../../../../shared/tools/TemplateHandlerClient';
import VueAppBase from '../../../../VueAppBase';
import VueAppController from '../../../../VueAppController';
import EnvHandler from '../../../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../../../shared/tools/PromisePipeline/PromisePipeline';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
// import export_suivi_competences_rapport_html_template from './export_suivi_competences_rapport_html_template.html';

@Component({
    template: require('./SuiviCompetencesDownloadRapportComponent.pug')
})
export default class SuiviCompetencesDownloadRapportComponent extends VueComponentBase {

    @Prop()
    private vo: any;

    @Prop()
    private columns: TableColumnDescVO[];

    private is_downloading: boolean = false;

    private async download_rapport() {
        if (this.is_downloading) {
            return;
        }

        let limit = EnvHandler.MAX_POOL / 2; // front
        let promise_pipeline = new PromisePipeline(limit);

        this.is_downloading = true;
        let rapport: SuiviCompetencesRapportVO = null;
        let user: UserVO = null;

        await promise_pipeline.push(async () => {
            rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(this.vo.id).select_vo<SuiviCompetencesRapportVO>();
        });
        await promise_pipeline.push(async () => {
            user = await query(UserVO.API_TYPE_ID)
                .filter_by_id_in(
                    query(SuiviCompetencesRapportVO.API_TYPE_ID)
                        .field(field_names<SuiviCompetencesRapportVO>().user_id)
                        .filter_by_id(this.vo.id)
                )
                .select_vo<UserVO>();
        });

        await promise_pipeline.end();

        // let vars = {
        //     base_url: VueAppController.getInstance().base_url,
        //     logo_url: EnvHandler.LOGO_PATH,
        //     user_name: user?.name,
        //     date: Dates.format(rapport.date, 'DD/MM/YYYY', false),
        //     name: rapport.name,
        //     points_cles: rapport.points_cles,
        //     objectif_prochaine_visite: rapport.objectif_prochaine_visite,
        // };

        // let html_content: string = TemplateHandlerClient.getInstance().prepareHTML(
        //     export_suivi_competences_rapport_html_template,
        //     {},
        //     vars,
        //     VueAppBase.getInstance().vueInstance.t
        // );

        this.is_downloading = false;
    }
}