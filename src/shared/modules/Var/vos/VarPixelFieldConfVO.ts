import IDistantVOBase from '../../IDistantVOBase';

export default class VarPixelFieldConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_pixel_field_conf";

    public id: number;
    public _type: string = VarPixelFieldConfVO.API_TYPE_ID;

    /**
     * Pour faire le lien avec le field sur lequel la pixellisation a lieu (approche contextFilters)
     */
    public pixel_vo_api_type_id: string;
    public pixel_vo_field_id: string;

    /**
     * Pour faire le lien avec le field_id du vardatabasevo (approche classique vardatabasevo)
     */
    public pixel_param_field_id: string;

    /**
     * Les informations liées au range type, et surtout à la segmentation (typiquement sur un pixel de type tsrange)
     */
    public pixel_range_type: number;
    public pixel_segmentation_type: number;
}