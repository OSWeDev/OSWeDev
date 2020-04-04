import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentTagLangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dt_lang";

    public id: number;
    public _type: string = DocumentTagLangVO.API_TYPE_ID;

    public lang_id: number;
    public dt_id: number;
}