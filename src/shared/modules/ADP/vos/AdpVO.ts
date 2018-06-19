import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class AdpVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_adp";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: AdpVO): AdpVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = AdpVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: AdpVO[]): AdpVO[] {
        for (let i in es) {
            es[i] = AdpVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = AdpVO.API_TYPE_ID;
    public url: string;
    public port: string;
    public login: string;
    public passphrase: string;
    public private_key: string;
    public rep_dist: string;
    public location: string;
    public terminal_identifier: string;
    public id_card_number: string;
    public client: string;
    public accounting_unit: string;
}