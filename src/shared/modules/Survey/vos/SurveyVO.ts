
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class SurveyVO implements IVersionedVO {
    public static API_TYPE_ID: string = "survey";

    public static SURVEY_TYPE_LABELS: string[] = ['survey.SURVEY_TYPE.NO_OPINION', 'survey.SURVEY_TYPE.BAD', 'survey.SURVEY_TYPE.MEDIOCRE', 'survey.SURVEY_TYPE.GOOD', 'survey.SURVEY_TYPE.VERY_GOOD'];
    public static SURVEY_TYPE_NO_OPINION: number = 0;
    public static SURVEY_TYPE_BAD: number = 1;
    public static SURVEY_TYPE_MEDIOCRE: number = 2;
    public static SURVEY_TYPE_GOOD: number = 3;
    public static SURVEY_TYPE_VERY_GOOD: number = 4;
    public id: number;
    public _type: string = SurveyVO.API_TYPE_ID;

    public message: string;

    public user_id: number;


    public survey_type: number;

    // URL (with Query) when the user sent the survey
    public route_name: string;


    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}