import TableFieldTypesManager from "../../../../shared/modules/TableFieldTypes/TableFieldTypesManager";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import SuiviCompetencesIndicateurReadComponent from './fields/read_component/SuiviCompetencesIndicateurReadComponent';
import SuiviCompetencesIndicateurCreateUpdateComponent from './fields/create_update_component/SuiviCompetencesIndicateurCreateUpdateComponent';

export default class SuiviCompetencesVueController {
    public static initialize() {
        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(
            SuiviCompetencesIndicateurTableFieldTypeController.getInstance().name,
            SuiviCompetencesIndicateurReadComponent,
            SuiviCompetencesIndicateurCreateUpdateComponent
        );
    }
}