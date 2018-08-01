import IDistantVOBase from '../../IDistantVOBase';

export default class TranslatableTextVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "translatable_text";

    public id: number;
    public _type: string = TranslatableTextVO.API_TYPE_ID;

    public code_text: string;
}