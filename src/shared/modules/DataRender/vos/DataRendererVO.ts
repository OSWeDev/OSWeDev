import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class DataRendererVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_renderer";

    public id: number;
    public _type: string = DataRendererVO.API_TYPE_ID;

    public renderer_name: string;
    public render_handler_module: string;
}