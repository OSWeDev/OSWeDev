import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import AnonymizationFieldConfVO from './vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from './vos/AnonymizationUserConfVO';
import ModuleTableController from '../DAO/ModuleTableController';

export default class ModuleAnonymization extends Module {

    public static MODULE_NAME: string = "Anonymization";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAnonymization.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnonymization.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
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
        let datatable_fields = [
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'API TYPE ID', true),
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du champs', true),
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().anonymizer_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Fonction', true).setEnumValues(AnonymizationFieldConfVO.TYPE_ANONYMIZER_LABELS),
        ];

        const datatable = new ModuleTableVO(this, AnonymizationFieldConfVO.API_TYPE_ID, () => new AnonymizationFieldConfVO(), datatable_fields, null, "Anonymisation");
        ModuleTableController.set_label_function(AnonymizationFieldConfVO.API_TYPE_ID, (vo: AnonymizationFieldConfVO) => vo.vo_type + "." + vo.field_name, null);
        this.datatables.push(datatable);

        const user_id = ModuleTableFieldController.create_new(AnonymizationUserConfVO.API_TYPE_ID, field_names<AnonymizationUserConfVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const anon_field_name = ModuleTableFieldController.create_new(AnonymizationUserConfVO.API_TYPE_ID, field_names<AnonymizationUserConfVO>().anon_field_name, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Champs anonymisé', true);
        datatable_fields = [
            user_id,
            anon_field_name
        ];
        const datatable2 = new ModuleTableVO(this, AnonymizationUserConfVO.API_TYPE_ID, () => new AnonymizationUserConfVO(), datatable_fields, null, "Lien anonymisation/utilisateur");
        this.datatables.push(datatable2);
        anon_field_name.set_many_to_one_target_moduletable_name(datatable.vo_type);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}