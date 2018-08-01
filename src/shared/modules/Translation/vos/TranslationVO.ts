import IDistantVOBase from '../../IDistantVOBase';

export default class TranslationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "translation";

    public id: number;
    public _type: string = TranslationVO.API_TYPE_ID;
    public lang_id: number;
    public text_id: number;
    public translated: string;
}