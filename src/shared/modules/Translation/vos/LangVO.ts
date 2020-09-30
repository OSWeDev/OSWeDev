import IDistantVOBase from '../../IDistantVOBase';

export default class LangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "lang";

    public id: number;
    public _type: string = LangVO.API_TYPE_ID;

    public code_lang: string;
    public code_flag: string;
    public code_phone: string;
}