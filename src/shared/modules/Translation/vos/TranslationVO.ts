import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class TranslationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_translation";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: TranslationVO): TranslationVO {
        if (!e) {
            return null;
        }

        e.lang_id = ConversionHandler.getInstance().forceNumber(e.lang_id);
        e.text_id = ConversionHandler.getInstance().forceNumber(e.text_id);
        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e._type = TranslationVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: TranslationVO[]): TranslationVO[] {
        for (let i in es) {
            es[i] = TranslationVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = TranslationVO.API_TYPE_ID;
    public lang_id: number;
    public text_id: number;
    public translated: string;
}