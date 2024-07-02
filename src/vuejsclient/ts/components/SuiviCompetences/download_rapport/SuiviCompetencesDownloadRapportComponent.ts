import { Component, Prop } from 'vue-property-decorator';
import TableColumnDescVO from '../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VueComponentBase from '../../VueComponentBase';
import SuiviCompetencesWidgetController from '../../dashboard_builder/widgets/suivi_competences_widget/SuiviCompetencesWidgetController';
import "./SuiviCompetencesDownloadRapportComponent.scss";
import SuiviCompetencesWidgetContainerComponent from '../../dashboard_builder/widgets/suivi_competences_widget/container/SuiviCompetencesWidgetContainerComponent';
import SuiviCompetencesRapportVO from '../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./SuiviCompetencesDownloadRapportComponent.pug'),
    components: {
        Suivicompetenceswidgetcontainer: SuiviCompetencesWidgetContainerComponent,
    }
})
export default class SuiviCompetencesDownloadRapportComponent extends VueComponentBase {

    @Prop()
    private vo: any;

    @Prop()
    private columns: TableColumnDescVO[];

    private is_downloading: boolean = false;
    private selected_rapport: SuiviCompetencesRapportVO = null;

    private async download_rapport() {
        if (this.is_downloading) {
            return;
        }

        this.is_downloading = true;

        this.$snotify.async(this.label('generate_pdf.en_cours'), () => new Promise(async (resolve, reject) => {
            this.selected_rapport = await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_id(parseInt(this.vo.__crud_actions)).select_vo<SuiviCompetencesRapportVO>();
            await SuiviCompetencesWidgetController.download_rapport_pdf(
                this.selected_rapport.id
            );

            this.is_downloading = false;

            resolve({
                title: this.label('generate_pdf.success'),
                body: '',
                config: {
                    timeout: 2000,
                }
            });
        }));
    }
}