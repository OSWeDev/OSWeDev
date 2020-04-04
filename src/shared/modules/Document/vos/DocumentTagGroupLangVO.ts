import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentTagGroupLangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dtg_lang";

    public id: number;
    public _type: string = DocumentTagGroupLangVO.API_TYPE_ID;

    public lang_id: number;
    public dtg_id: number;
}