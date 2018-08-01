import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class TranslatableTextVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_translatable_text";

    public id: number;
    public _type: string = TranslatableTextVO.API_TYPE_ID;

    public code_text: string;
}