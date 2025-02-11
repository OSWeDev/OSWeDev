import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import KelioEmployeeVO from './vos/KelioEmployeeVO';

export default class ModuleKelio extends Module {

    public static KELIO_LOGIN_PARAM_NAME: string = 'KELIO_LOGIN';
    public static KELIO_PASSWORD_PARAM_NAME: string = 'KELIO_PASSWORD';
    public static KELIO_BASE_URL_PARAM_NAME: string = 'KELIO_BASE_URL';

    public static MODULE_NAME: string = 'Kelio';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleKelio.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleKelio.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleKelio.MODULE_NAME + '.FO_ACCESS';

    private static instance: ModuleKelio = null;

    private constructor() {
        super("kelio", ModuleKelio.MODULE_NAME);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleKelio {
        if (!ModuleKelio.instance) {
            ModuleKelio.instance = new ModuleKelio();
        }
        return ModuleKelio.instance;
    }

    public initialize() {
        this.initializeKelioEmployeeVO();
    }

    private initializeKelioEmployeeVO() {
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().archived_employee, ModuleTableFieldVO.FIELD_TYPE_boolean, "Employé archivé");
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().employee_first_name, ModuleTableFieldVO.FIELD_TYPE_string, "Prénom");
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().employee_identification_number, ModuleTableFieldVO.FIELD_TYPE_string, "Matricule du salarié", true);
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().employee_surname, ModuleTableFieldVO.FIELD_TYPE_string, "Nom");
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().period_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Début du contrat").set_segmentation_type(TimeSegment.TYPE_DAY);
        ModuleTableFieldController.create_new(KelioEmployeeVO.API_TYPE_ID, field_names<KelioEmployeeVO>().period_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Fin du contrat").set_segmentation_type(TimeSegment.TYPE_DAY);

        ModuleTableController.create_new(this.name, KelioEmployeeVO, null, KelioEmployeeVO.API_TYPE_ID);
    }
}