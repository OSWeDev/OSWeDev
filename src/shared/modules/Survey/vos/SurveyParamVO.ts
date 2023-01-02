
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class SurveyParamVO implements IVersionedVO {
    public static API_TYPE_ID: string = "survey_param";

    public id: number;
    public _type: string = SurveyParamVO.API_TYPE_ID;
    public route_name: string;
    public pop_up: boolean;
    public time_before_pop_up: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}