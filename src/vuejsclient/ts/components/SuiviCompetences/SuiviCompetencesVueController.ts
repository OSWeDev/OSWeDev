import TableFieldTypesManager from "../../../../shared/modules/TableFieldTypes/TableFieldTypesManager";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import SuiviCompetencesIndicateurReadComponent from './fields/read_component/SuiviCompetencesIndicateurReadComponent';
import SuiviCompetencesIndicateurCreateUpdateComponent from './fields/create_update_component/SuiviCompetencesIndicateurCreateUpdateComponent';
import Vue from "vue";
import TableWidgetController from "../dashboard_builder/widgets/table_widget/TableWidgetController";
import ComponentDatatableFieldVO from "../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO";
import VOsTypesManager from "../../../../shared/modules/VO/manager/VOsTypesManager";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";

export default class SuiviCompetencesVueController {
    public static initialize() {
        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(
            SuiviCompetencesIndicateurTableFieldTypeController.getInstance().name,
            SuiviCompetencesIndicateurReadComponent,
            SuiviCompetencesIndicateurCreateUpdateComponent
        );

        Vue.component('Suivicompetencesdownloadrapportcomponent', async () => (await import('./download_rapport/SuiviCompetencesDownloadRapportComponent')));
        TableWidgetController.register_component(
            ComponentDatatableFieldVO.createNew(
                'suivi_competences_download_rapport',
                'Suivicompetencesdownloadrapportcomponent',
                'id'
            ).setModuleTable(VOsTypesManager.moduleTables_by_voType[SuiviCompetencesRapportVO.API_TYPE_ID])
        );
    }
}