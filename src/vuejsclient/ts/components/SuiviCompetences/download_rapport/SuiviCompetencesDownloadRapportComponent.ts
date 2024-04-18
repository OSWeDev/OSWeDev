import { Component, Prop } from 'vue-property-decorator';
import TableColumnDescVO from '../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VueComponentBase from '../../VueComponentBase';
import SuiviCompetencesWidgetController from '../../dashboard_builder/widgets/suivi_competences_widget/SuiviCompetencesWidgetController';
import "./SuiviCompetencesDownloadRapportComponent.scss";

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

        this.is_downloading = true;

        this.$snotify.async(this.label('generate_pdf.en_cours'), () => new Promise(async (resolve, reject) => {
            await SuiviCompetencesWidgetController.download_rapport_pdf(parseInt(this.vo.__crud_actions));

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