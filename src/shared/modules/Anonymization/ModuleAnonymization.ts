import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import { VOsTypesManager } from '../VO/manager/VOsTypesManager';
import AnonymizationFieldConfVO from './vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from './vos/AnonymizationUserConfVO';

export default class ModuleAnonymization extends Module {

    public static MODULE_NAME: string = "Anonymization";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAnonymization.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnonymization.MODULE_NAME + ".BO_ACCESS";

    public static getInstance(): ModuleAnonymization {
        if (!ModuleAnonymization.instance) {
            ModuleAnonymization.instance = new ModuleAnonymization();
        }
        return ModuleAnonymization.instance;
    }

    private static instance: ModuleAnonymization = null;

    private constructor() {

        super("anonymization", ModuleAnonymization.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let datatable_fields = [
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'API TYPE ID', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'FIELD ID', true),
            new ModuleTableField('anonymizer_type', ModuleTableField.FIELD_TYPE_enum, 'Fonction', true).setEnumValues(AnonymizationFieldConfVO.TYPE_ANONYMIZER_LABELS),
        ];

        let datatable = new ModuleTable(this, AnonymizationFieldConfVO.API_TYPE_ID, () => new AnonymizationFieldConfVO(), datatable_fields, null, "Anonymisation").define_default_label_function((vo: AnonymizationFieldConfVO) => vo.vo_type + "." + vo.field_id, null);
        this.datatables.push(datatable);

        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let anon_field_id = new ModuleTableField('anon_field_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Champs anonymisé', true);
        datatable_fields = [
            user_id,
            anon_field_id
        ];
        let datatable2 = new ModuleTable(this, AnonymizationUserConfVO.API_TYPE_ID, () => new AnonymizationUserConfVO(), datatable_fields, null, "Lien anonymisation/utilisateur");
        this.datatables.push(datatable2);
        anon_field_id.addManyToOneRelation(datatable);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }
}