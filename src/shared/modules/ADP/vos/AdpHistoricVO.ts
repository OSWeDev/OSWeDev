import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class AdpHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_adp_historic";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: AdpHistoricVO): AdpHistoricVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = AdpHistoricVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: AdpHistoricVO[]): AdpHistoricVO[] {
        for (let i in es) {
            es[i] = AdpHistoricVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = AdpHistoricVO.API_TYPE_ID;
    public date: string;
    public url: string;
}