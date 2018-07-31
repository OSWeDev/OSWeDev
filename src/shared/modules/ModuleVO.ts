import IDistantVOBase from './IDistantVOBase';
import ConversionHandler from '../tools/ConversionHandler';

export default class ModuleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "modules";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: ModuleVO): ModuleVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e._type = ModuleVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: ModuleVO[]): ModuleVO[] {
        for (let i in es) {
            es[i] = ModuleVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = ModuleVO.API_TYPE_ID;

    public name: string;
    public actif: boolean;
}