
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


    public survey_type: number;

    // URL (with Query) when the user opened the survey tool
    public survey_start_url: string;
    // URL (with Query) when the user sent the survey
    public survey_end_url: string;

    // Routes fullpaths
    public routes_fullpaths: string[];

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}