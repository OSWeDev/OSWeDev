
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class SurveyVO implements IVersionedVO {
    public static API_TYPE_ID: string = "survey";

    public static SURVEY_TYPE_LABELS: string[] = ['survey.SURVEY_TYPE.VERY_GOOD', 'survey.SURVEY_TYPE.GOOD', 'survey.SURVEY_TYPE.MEDIOCRE', 'survey.SURVEY_TYPE.BAD', 'survey.SURVEY_TYPE.VERY_BAD'];
    public static SURVEY_TYPE_ENHANCEMENT_REQUEST: number = 0;
    public static SURVEY_TYPE_BUG: number = 1;
    public static SURVEY_TYPE_INCIDENT: number = 2;
    public static SURVEY_TYPE_NOT_SET: number = 3;

    public id: number;
    public _type: string = SurveyVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public phone: string;
    public title: string;
    public message: string;

    public user_id: number;
    public is_impersonated: boolean;
    public impersonated_from_user_id: number;

    public trello_ref: string;

    // When user opened the survey window to start a survey
    public feedback_start_date: number;
    // When user sent the survey
    public feedback_end_date: number;

    // User connection date (according to the last load => server session)
    public user_connection_date: number;
    // User connection date (according to the last load => server session)
    public impersonated_from_user_connection_date: number;
    // User login date (according to the last login => server session)
    public user_login_date: number;
    // User login date (according to the last login => server session)
    public impersonated_from_user_login_date: number;

    public feedback_type: number;

    public screen_capture_1_id: number;
    public screen_capture_2_id: number;
    public screen_capture_3_id: number;

    public file_attachment_1_id: number;
    public file_attachment_2_id: number;
    public file_attachment_3_id: number;

    // URL (with Query) when the user opened the survey tool
    public feedback_start_url: string;
    // URL (with Query) when the user sent the survey
    public feedback_end_url: string;

    // Routes fullpaths
    public routes_fullpaths: string[];

    // Every api requests, formatted as LightWeightSendableRequestVO, and in json
    public apis_log_json: string;

    // Every console_logs we could get
    public console_logs: string[];

    public wish_be_called: boolean;
    public preferred_times_called: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}