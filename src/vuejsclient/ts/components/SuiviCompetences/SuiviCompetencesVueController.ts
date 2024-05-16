import Vue from "vue";
import ModuleTableController from "../../../../shared/modules/DAO/ModuleTableController";
import ComponentDatatableFieldVO from "../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import TableFieldTypesManager from "../../../../shared/modules/TableFieldTypes/TableFieldTypesManager";
import TableWidgetController from "../dashboard_builder/widgets/table_widget/TableWidgetController";
import SuiviCompetencesIndicateurCreateUpdateComponent from './fields/create_update_component/SuiviCompetencesIndicateurCreateUpdateComponent';
import SuiviCompetencesIndicateurReadComponent from './fields/read_component/SuiviCompetencesIndicateurReadComponent';

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
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[SuiviCompetencesRapportVO.API_TYPE_ID])
        );
    }
}