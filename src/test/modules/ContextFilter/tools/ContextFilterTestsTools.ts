import RoleVO from "../../../../shared/modules/AccessPolicy/vos/RoleVO";
import UserRoleVO from "../../../../shared/modules/AccessPolicy/vos/UserRoleVO";
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import AnonymizationFieldConfVO from "../../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO";
import AnonymizationUserConfVO from "../../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import ModuleTable from "../../../../shared/modules/ModuleTable";
import ModuleTableField from "../../../../shared/modules/ModuleTableField";
import DefaultTranslation from "../../../../shared/modules/Translation/vos/DefaultTranslation";
import LangVO from "../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../shared/modules/Translation/vos/TranslationVO";
import VOsTypesManager from "../../../../shared/modules/VOsTypesManager";

export default class ContextFilterTestsTools {
    public static getInstance(): ContextFilterTestsTools {
        if (!ContextFilterTestsTools.instance) {
            ContextFilterTestsTools.instance = new ContextFilterTestsTools();
        }
        return ContextFilterTestsTools.instance;
    }

    private static instance: ContextFilterTestsTools = null;

    private constructor() { }

    public declare_modultables() {

        this.declare_LangVO_modultable();
        this.declare_TranslatableTextVO_modultable();
        this.declare_TranslationVO_modultable();
        this.declare_UserVO_modultable();
        this.initializeRole();
        this.initializeUserRoles();
        this.initializeAnonymizationFieldConfVO();
        this.initializeAnonymizationUserConfVO();
    }

    private initializeAnonymizationFieldConfVO() {

        let datatable_fields = [
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'API TYPE ID', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'FIELD ID', true),
            new ModuleTableField('anonymizer_type', ModuleTableField.FIELD_TYPE_enum, 'Fonction', true).setEnumValues(AnonymizationFieldConfVO.TYPE_ANONYMIZER_LABELS),
        ];

        let datatable = new ModuleTable(null, AnonymizationFieldConfVO.API_TYPE_ID, () => new AnonymizationFieldConfVO(), datatable_fields, null, "Anonymisation").define_default_label_function((vo: AnonymizationFieldConfVO) => vo.vo_type + "." + vo.field_id, null);
        datatable.set_bdd_ref('ref', AnonymizationFieldConfVO.API_TYPE_ID);
    }

    private initializeAnonymizationUserConfVO() {
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let anon_field_id = new ModuleTableField('anon_field_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Champs anonymisé', true);
        let datatable_fields = [
            user_id,
            anon_field_id
        ];
        let datatable = new ModuleTable(null, AnonymizationUserConfVO.API_TYPE_ID, () => new AnonymizationUserConfVO(), datatable_fields, null, "Lien anonymisation/utilisateur");
        anon_field_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[AnonymizationFieldConfVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', AnonymizationUserConfVO.API_TYPE_ID);
    }

    private initializeRole() {
        let label_field = new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_translatable_text, 'Nom', true);
        let parent_role_id = new ModuleTableField('parent_role_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Rôle parent');

        let datatable_fields = [
            label_field,
            parent_role_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable: ModuleTable<any> = new ModuleTable(null, RoleVO.API_TYPE_ID, () => new RoleVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Rôles" }));
        parent_role_id.donotCascadeOnDelete();
        parent_role_id.addManyToOneRelation(datatable);
        datatable.set_bdd_ref('ref', RoleVO.API_TYPE_ID);
    }

    private initializeUserRoles() {
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true, true, 0);
        let field_role_id = new ModuleTableField('role_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        let datatable_fields = [
            field_user_id,
            field_role_id,
        ];

        let datatable: ModuleTable<any> = new ModuleTable(null, UserRoleVO.API_TYPE_ID, () => new UserRoleVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': "Rôles des utilisateurs" }));
        field_user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_role_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[RoleVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', UserRoleVO.API_TYPE_ID);
    }

    private declare_LangVO_modultable() {
        let label_field = new ModuleTableField('code_lang', ModuleTableField.FIELD_TYPE_string, 'Code de la langue', true).unique();
        let datatable_fields = [
            label_field,
            new ModuleTableField('code_flag', ModuleTableField.FIELD_TYPE_string, 'Code du drapeau', false),
            new ModuleTableField('code_phone', ModuleTableField.FIELD_TYPE_string, 'Indicatif (+33)', false),
        ];
        let datatable: ModuleTable<any> = new ModuleTable(null, LangVO.API_TYPE_ID, () => new LangVO(), datatable_fields, label_field, "Langues");
        datatable.set_bdd_ref('ref', LangVO.API_TYPE_ID);
    }

    private declare_TranslatableTextVO_modultable() {
        let label_field = new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'Id du text', true).unique();
        let datatable_fields = [
            label_field
        ];
        let datatable: ModuleTable<any> = new ModuleTable(null, TranslatableTextVO.API_TYPE_ID, () => new TranslatableTextVO(), datatable_fields, label_field, "Codes");
        datatable.set_bdd_ref('ref', TranslatableTextVO.API_TYPE_ID);
    }

    private declare_TranslationVO_modultable() {
        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Langue', true);
        let field_text_id = new ModuleTableField('text_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Text', true);
        let label_field = new ModuleTableField('translated', ModuleTableField.FIELD_TYPE_string, 'Texte traduit', true);
        let datatable_fields = [
            field_lang_id,
            field_text_id,
            label_field
        ];

        let datatable: ModuleTable<any> = new ModuleTable(null, TranslationVO.API_TYPE_ID, () => new TranslationVO(), datatable_fields, label_field, "Traductions");
        field_lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
        field_text_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', TranslationVO.API_TYPE_ID);
    }

    private declare_UserVO_modultable() {

        let field_lang_id = new ModuleTableField('lang_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ 'fr-fr': 'Langue' }), true);
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Nom' }), true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Prénom' }), false),
            new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Nom' }), false),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_email, new DefaultTranslation({ 'fr-fr': 'E-mail' }), true),
            new ModuleTableField('phone', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Téléphone' })),
            new ModuleTableField('blocked', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Compte bloqué' }), true, true, false),
            new ModuleTableField('password', ModuleTableField.FIELD_TYPE_password, new DefaultTranslation({ 'fr-fr': 'Mot de passe' }), true),
            new ModuleTableField('password_change_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Date de changement du mot de passe' }), false),
            new ModuleTableField('reminded_pwd_1', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Premier rappel envoyé' }), true, true, false),
            new ModuleTableField('reminded_pwd_2', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Second rappel envoyé' }), true, true, false),
            new ModuleTableField('invalidated', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Mot de passe expiré' }), true, true, false),
            field_lang_id,
            new ModuleTableField('recovery_challenge', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Challenge de récupération' }), false, true, ""),
            new ModuleTableField('recovery_expiration', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Expiration du challenge' }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('logged_once', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': 'Connecté au moins 1 fois' }), true, true, false),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': 'Date de création' })).set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        let datatable: ModuleTable<any> = new ModuleTable(null, UserVO.API_TYPE_ID, () => new UserVO(), datatable_fields, label_field, new DefaultTranslation({ 'fr-fr': "Utilisateurs" }));
        field_lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', UserVO.API_TYPE_ID);
    }
}