import RoleVO from "../../../../src/shared/modules/AccessPolicy/vos/RoleVO";
import UserRoleVO from "../../../../src/shared/modules/AccessPolicy/vos/UserRoleVO";
import UserVO from "../../../../src/shared/modules/AccessPolicy/vos/UserVO";
import AnonymizationFieldConfVO from "../../../../src/shared/modules/Anonymization/vos/AnonymizationFieldConfVO";
import AnonymizationUserConfVO from "../../../../src/shared/modules/Anonymization/vos/AnonymizationUserConfVO";
import TimeSegment from "../../../../src/shared/modules/DataRender/vos/TimeSegment";
import ModuleTableVO from "../../../../src/shared/modules/ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../../src/shared/modules/ModuleTableFieldVO";
import DefaultTranslationVO from "../../../../src/shared/modules/Translation/vos/DefaultTranslationVO";
import LangVO from "../../../../src/shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../src/shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../src/shared/modules/Translation/vos/TranslationVO";
import VOsTypesManager from "../../../../src/shared/modules/VO/manager/VOsTypesManager";
import { field_names } from "../../../../src/shared/tools/ObjectHandler";

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
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().vo_type, ModuleTableFieldVO.FIELD_TYPE_string, 'API TYPE ID', true),
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().field_id, ModuleTableFieldVO.FIELD_TYPE_string, 'FIELD ID', true),
            ModuleTableFieldController.create_new(AnonymizationFieldConfVO.API_TYPE_ID, field_names<AnonymizationFieldConfVO>().anonymizer_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Fonction', true).setEnumValues(AnonymizationFieldConfVO.TYPE_ANONYMIZER_LABELS),
        ];

        let datatable = new ModuleTableVO(null, AnonymizationFieldConfVO.API_TYPE_ID, () => new AnonymizationFieldConfVO(), datatable_fields, null, "Anonymisation").define_default_label_function((vo: AnonymizationFieldConfVO) => vo.vo_type + "." + vo.field_id, null);
        datatable.set_bdd_ref('ref', AnonymizationFieldConfVO.API_TYPE_ID);
    }

    private initializeAnonymizationUserConfVO() {
        let user_id = ModuleTableFieldController.create_new(AnonymizationUserConfVO.API_TYPE_ID, field_names<AnonymizationUserConfVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let anon_field_id = ModuleTableFieldController.create_new(AnonymizationUserConfVO.API_TYPE_ID, field_names<AnonymizationUserConfVO>().anon_field_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Champs anonymisé', true);
        let datatable_fields = [
            user_id,
            anon_field_id
        ];
        let datatable = new ModuleTableVO(null, AnonymizationUserConfVO.API_TYPE_ID, () => new AnonymizationUserConfVO(), datatable_fields, null, "Lien anonymisation/utilisateur");
        anon_field_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[AnonymizationFieldConfVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', AnonymizationUserConfVO.API_TYPE_ID);
    }

    private initializeRole() {
        let label_field = ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true);
        let parent_role_id = ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().parent_role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle parent');

        let datatable_fields = [
            label_field,
            parent_role_id,
            ModuleTableFieldController.create_new(RoleVO.API_TYPE_ID, field_names<RoleVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, RoleVO.API_TYPE_ID, () => new RoleVO(), datatable_fields, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Rôles" }));
        parent_role_id.donotCascadeOnDelete();
        parent_role_id.addManyToOneRelation(datatable);
        datatable.set_bdd_ref('ref', RoleVO.API_TYPE_ID);
    }

    private initializeUserRoles() {
        let field_user_id = ModuleTableFieldController.create_new(UserRoleVO.API_TYPE_ID, field_names<UserRoleVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true, true, 0);
        let field_role_id = ModuleTableFieldController.create_new(UserRoleVO.API_TYPE_ID, field_names<UserRoleVO>().role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle', true, true, 0);
        let datatable_fields = [
            field_user_id,
            field_role_id,
        ];

        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, UserRoleVO.API_TYPE_ID, () => new UserRoleVO(), datatable_fields, null, DefaultTranslationVO.create_new({ 'fr-fr': "Rôles des utilisateurs" }));
        field_user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_role_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[RoleVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', UserRoleVO.API_TYPE_ID);
    }

    private declare_LangVO_modultable() {
        let label_field = ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_lang, ModuleTableFieldVO.FIELD_TYPE_string, 'Code de la langue', true).unique();
        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_flag, ModuleTableFieldVO.FIELD_TYPE_string, 'Code du drapeau', false),
            ModuleTableFieldController.create_new(LangVO.API_TYPE_ID, field_names<LangVO>().code_phone, ModuleTableFieldVO.FIELD_TYPE_string, 'Indicatif (+33)', false),
        ];
        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, LangVO.API_TYPE_ID, () => new LangVO(), datatable_fields, label_field, "Langues");
        datatable.set_bdd_ref('ref', LangVO.API_TYPE_ID);
    }

    private declare_TranslatableTextVO_modultable() {
        let label_field = ModuleTableFieldController.create_new(TranslatableTextVO.API_TYPE_ID, field_names<TranslatableTextVO>().code_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Id du text', true).unique();
        let datatable_fields = [
            label_field
        ];
        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, TranslatableTextVO.API_TYPE_ID, () => new TranslatableTextVO(), datatable_fields, label_field, "Codes");
        datatable.set_bdd_ref('ref', TranslatableTextVO.API_TYPE_ID);
    }

    private declare_TranslationVO_modultable() {
        let field_lang_id = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true);
        let field_text_id = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().text_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Text', true);
        let label_field = ModuleTableFieldController.create_new(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().translated, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte traduit', true);
        let datatable_fields = [
            field_lang_id,
            field_text_id,
            label_field
        ];

        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, TranslationVO.API_TYPE_ID, () => new TranslationVO(), datatable_fields, label_field, "Traductions");
        field_lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
        field_text_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', TranslationVO.API_TYPE_ID);
    }

    private declare_UserVO_modultable() {

        let field_lang_id = ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': 'Langue' }), true);
        let label_field = ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), true);
        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().firstname, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Prénom' }), false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().lastname, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().email, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': 'E-mail' }), true),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().phone, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Téléphone' })),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().blocked, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Compte bloqué' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().password, ModuleTableFieldVO.FIELD_TYPE_password, DefaultTranslationVO.create_new({ 'fr-fr': 'Mot de passe' }), true),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().password_change_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Date de changement du mot de passe' }), false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().reminded_pwd_1, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Premier rappel envoyé' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().reminded_pwd_2, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Second rappel envoyé' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().invalidated, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Mot de passe expiré' }), true, true, false),
            field_lang_id,
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().recovery_challenge, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Challenge de récupération' }), false, true, ""),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().recovery_expiration, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Expiration du challenge' }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().logged_once, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Connecté au moins 1 fois' }), true, true, false),
            ModuleTableFieldController.create_new(UserVO.API_TYPE_ID, field_names<UserVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': 'Date de création' })).set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        let datatable: ModuleTableVO<any> = new ModuleTableVO(null, UserVO.API_TYPE_ID, () => new UserVO(), datatable_fields, label_field, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateurs" }));
        field_lang_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID]);
        datatable.set_bdd_ref('ref', UserVO.API_TYPE_ID);
    }
}