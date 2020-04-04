import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentLangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "d_lang";

    public id: number;
    public _type: string = DocumentLangVO.API_TYPE_ID;

    public lang_id: number;
    public d_id: number;
}