import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class LangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_lang";

    public id: number;
    public _type: string = LangVO.API_TYPE_ID;

    public code_lang: string;
}