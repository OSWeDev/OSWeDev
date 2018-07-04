import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class DataRendererVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_data_renderer";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataRendererVO): DataRendererVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e._type = DataRendererVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataRendererVO[]): DataRendererVO[] {
        for (let i in es) {
            es[i] = DataRendererVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataRendererVO.API_TYPE_ID;

    public renderer_name: string;
    public render_handler_module: string;
}