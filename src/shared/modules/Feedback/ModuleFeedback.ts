import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APISimpleVOParamVO from '../DAO/vos/APISimpleVOParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VOsTypesManager';
import FeedbackVO from './vos/FeedbackVO';

export default class ModuleFeedback extends Module {

    public static MODULE_NAME: string = 'Feedback';

    public static APINAME_feedback: string = "feedback";

    public static getInstance(): ModuleFeedback {
        if (!ModuleFeedback.instance) {
            ModuleFeedback.instance = new ModuleFeedback();
        }
        return ModuleFeedback.instance;
    }

    private static instance: ModuleFeedback = null;

    private constructor() {

        super("feedback", ModuleFeedback.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<APISimpleVOParamVO, boolean>(
            ModuleFeedback.APINAME_feedback,
            [FeedbackVO.API_TYPE_ID],
            APISimpleVOParamVO.translateCheckAccessParams
        ));
    }

    public async feedback(feedback: FeedbackVO): Promise<boolean> {
        return ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, boolean>(ModuleFeedback.APINAME_feedback, feedback);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeFeedbackVO();
    }

    private initializeFeedbackVO() {
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let impersonated_from_user_id = new ModuleTableField('impersonated_from_user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Si LogAs: Admin', false);
        let screen_capture_1_id = new ModuleTableField('screen_capture_1_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Capture écran 1', true);
        let screen_capture_2_id = new ModuleTableField('screen_capture_2_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Capture écran 2', false);
        let screen_capture_3_id = new ModuleTableField('screen_capture_3_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Capture écran 3', false);
        let file_attachment_1_id = new ModuleTableField('file_attachment_1_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Pièce jointe 1', false);
        let file_attachment_2_id = new ModuleTableField('file_attachment_2_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Pièce jointe 2', false);
        let file_attachment_3_id = new ModuleTableField('file_attachment_3_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Pièce jointe 3', false);

        let fields = [
            user_id,
            impersonated_from_user_id,
            screen_capture_1_id,
            screen_capture_2_id,
            screen_capture_3_id,
            file_attachment_1_id,
            file_attachment_2_id,
            file_attachment_3_id,

            new ModuleTableField('feedback_start_date', ModuleTableField.FIELD_TYPE_tstz, 'Début du Feedback', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('feedback_end_date', ModuleTableField.FIELD_TYPE_tstz, 'Fin du Feedback', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('user_connection_date', ModuleTableField.FIELD_TYPE_tstz, 'Début navigation utilisateur', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('impersonated_from_user_connection_date', ModuleTableField.FIELD_TYPE_tstz, 'Début navigation admin', false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('user_login_date', ModuleTableField.FIELD_TYPE_tstz, 'Début session utilisateur', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('impersonated_from_user_login_date', ModuleTableField.FIELD_TYPE_tstz, 'Début session admin', false).set_segmentation_type(TimeSegment.TYPE_SECOND),

            new ModuleTableField('trello_ref', ModuleTableField.FIELD_TYPE_string, 'trello_ref', false),

            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email', true),
            new ModuleTableField('phone', ModuleTableField.FIELD_TYPE_string, 'Téléphone', false),
            new ModuleTableField('title', ModuleTableField.FIELD_TYPE_string, 'Titre', true),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'Message', true),

            new ModuleTableField('is_impersonated', ModuleTableField.FIELD_TYPE_boolean, 'LogAs ?', true, true, false),

            new ModuleTableField('feedback_type', ModuleTableField.FIELD_TYPE_enum, 'Type de feedback', true, true, FeedbackVO.FEEDBACK_TYPE_NOT_SET).setEnumValues(FeedbackVO.FEEDBACK_TYPE_LABELS),

            new ModuleTableField('feedback_start_url', ModuleTableField.FIELD_TYPE_string, 'URL début Feedback', true),
            new ModuleTableField('feedback_end_url', ModuleTableField.FIELD_TYPE_string, 'URL fin Feedback', true),

            new ModuleTableField('routes_fullpaths', ModuleTableField.FIELD_TYPE_string, 'Routes - Fullpath', true),

            new ModuleTableField('apis_log_json', ModuleTableField.FIELD_TYPE_string, 'APIs Log - JSON', true),

            new ModuleTableField('console_logs', ModuleTableField.FIELD_TYPE_string_array, 'Console Logs', false),
        ];

        let table = new ModuleTable(this, FeedbackVO.API_TYPE_ID, () => new FeedbackVO(), fields, null, 'Feedbacks');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        impersonated_from_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        screen_capture_1_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        screen_capture_2_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        screen_capture_3_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        file_attachment_1_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        file_attachment_2_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        file_attachment_3_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}