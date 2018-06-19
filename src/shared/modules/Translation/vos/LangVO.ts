import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class LangVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_lang";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: LangVO): LangVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = LangVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: LangVO[]): LangVO[] {
        for (let i in es) {
            es[i] = LangVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = LangVO.API_TYPE_ID;

    public code_lang: string;
}