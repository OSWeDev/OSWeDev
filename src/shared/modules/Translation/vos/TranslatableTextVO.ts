import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class TranslatableTextVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_translatable_text";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: TranslatableTextVO): TranslatableTextVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = TranslatableTextVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: TranslatableTextVO[]): TranslatableTextVO[] {
        for (let i in es) {
            es[i] = TranslatableTextVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = TranslatableTextVO.API_TYPE_ID;

    public code_text: string;
}