import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import FeedbackStateVO from './vos/FeedbackStateVO';
import FeedbackVO from './vos/FeedbackVO';

export default class ModuleFeedback extends Module {

    public static MODULE_NAME: string = 'Feedback';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleFeedback.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFeedback.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFeedback.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_feedback: string = "feedback";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFeedback {
        if (!ModuleFeedback.instance) {
            ModuleFeedback.instance = new ModuleFeedback();
        }
        return ModuleFeedback.instance;
    }

    private static instance: ModuleFeedback = null;

    public feedback: (feedback: FeedbackVO) => Promise<FeedbackVO> = APIControllerWrapper.sah(ModuleFeedback.APINAME_feedback);

    private constructor() {

        super("feedback", ModuleFeedback.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOParamVO, FeedbackVO>(
            ModuleFeedback.POLICY_FO_ACCESS,
            ModuleFeedback.APINAME_feedback,
            [FeedbackVO.API_TYPE_ID],
            APISimpleVOParamVOStatic
        ));
    }

    public initialize() {

        this.initializeFeedbackStateVO();
        this.initializeFeedbackVO();
    }

    private initializeFeedbackStateVO() {
        const name = ModuleTableFieldController.create_new(FeedbackStateVO.API_TYPE_ID, field_names<FeedbackStateVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();

        const fields = [
            name,
            ModuleTableFieldController.create_new(FeedbackStateVO.API_TYPE_ID, field_names<FeedbackStateVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', false),
            ModuleTableFieldController.create_new(FeedbackStateVO.API_TYPE_ID, field_names<FeedbackStateVO>().is_default_state, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Etat par défaut', true, true, false),
        ];

        const table = new ModuleTableVO(this, FeedbackStateVO.API_TYPE_ID, () => new FeedbackStateVO(), fields, name, 'Feedbacks - Etats');
        this.datatables.push(table);
    }

    private initializeFeedbackVO() {
        const user_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const state_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().state_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Etat', false);
        const confirmation_mail_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().confirmation_mail_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Mail de confirmation', false);
        const impersonated_from_user_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().impersonated_from_user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Si LogAs: Admin', false);
        const screen_capture_1_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().screen_capture_1_id, ModuleTableFieldVO.FIELD_TYPE_image_ref, 'Capture écran 1', true).not_add_to_crud();
        const screen_capture_2_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().screen_capture_2_id, ModuleTableFieldVO.FIELD_TYPE_image_ref, 'Capture écran 2', false).not_add_to_crud();
        const screen_capture_3_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().screen_capture_3_id, ModuleTableFieldVO.FIELD_TYPE_image_ref, 'Capture écran 3', false).not_add_to_crud();
        const file_attachment_1_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().file_attachment_1_id, ModuleTableFieldVO.FIELD_TYPE_file_ref, 'Pièce jointe 1', false).not_add_to_crud();
        const file_attachment_2_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().file_attachment_2_id, ModuleTableFieldVO.FIELD_TYPE_file_ref, 'Pièce jointe 2', false).not_add_to_crud();
        const file_attachment_3_id = ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().file_attachment_3_id, ModuleTableFieldVO.FIELD_TYPE_file_ref, 'Pièce jointe 3', false).not_add_to_crud();

        const fields = [
            user_id,
            impersonated_from_user_id,
            state_id,
            confirmation_mail_id,
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Weight', true, true, 0),
            screen_capture_1_id,
            screen_capture_2_id,
            screen_capture_3_id,
            file_attachment_1_id,
            file_attachment_2_id,
            file_attachment_3_id,

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().feedback_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début du Feedback', true).set_segmentation_type(TimeSegment.TYPE_SECOND).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().feedback_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Fin du Feedback', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().user_connection_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début navigation utilisateur', true).set_segmentation_type(TimeSegment.TYPE_SECOND).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().impersonated_from_user_connection_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début navigation admin', false).set_segmentation_type(TimeSegment.TYPE_SECOND).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().user_login_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début session utilisateur', true).set_segmentation_type(TimeSegment.TYPE_SECOND).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().impersonated_from_user_login_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début session admin', false).set_segmentation_type(TimeSegment.TYPE_SECOND).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().trello_ref, ModuleTableFieldVO.FIELD_TYPE_string, 'trello_ref', false).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().email, ModuleTableFieldVO.FIELD_TYPE_email, 'Email', true).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().phone, ModuleTableFieldVO.FIELD_TYPE_string, 'Téléphone', false).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().message, ModuleTableFieldVO.FIELD_TYPE_string, 'Message', true).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().is_impersonated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'LogAs ? ', true, true, false).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().feedback_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de feedback', true, true, FeedbackVO.FEEDBACK_TYPE_NOT_SET).setEnumValues(FeedbackVO.FEEDBACK_TYPE_LABELS),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().feedback_start_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL début Feedback', true),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().feedback_end_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL fin Feedback', true).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().routes_fullpaths, ModuleTableFieldVO.FIELD_TYPE_string, 'Routes - Fullpath', true).hide_from_datatable(),

            // ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().apis_log_json, ModuleTableFieldVO.FIELD_TYPE_string, 'APIs Log - JSON', true).hide_from_datatable(),

            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().console_logs, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Console Logs', false).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().wish_be_called, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Je souhaite être rappelé', false).hide_from_datatable(),
            ModuleTableFieldController.create_new(FeedbackVO.API_TYPE_ID, field_names<FeedbackVO>().preferred_times_called, ModuleTableFieldVO.FIELD_TYPE_string, 'Horaires de préférence', false).hide_from_datatable(),
        ];

        const table = new ModuleTableVO(this, FeedbackVO.API_TYPE_ID, () => new FeedbackVO(), fields, null, 'Feedbacks');
        this.datatables.push(table);

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        impersonated_from_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        confirmation_mail_id.set_many_to_one_target_moduletable_name(MailVO.API_TYPE_ID);
        screen_capture_1_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        screen_capture_2_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        screen_capture_3_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        file_attachment_1_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        file_attachment_2_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        file_attachment_3_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        state_id.set_many_to_one_target_moduletable_name(FeedbackStateVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}