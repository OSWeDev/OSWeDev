/* istanbul ignore file : nothing to test in this VO */

import IDistantVOBase from '../../IDistantVOBase';

export default class VarPixelFieldConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_pixel_field_conf";

    public id: number;
    public _type: string = VarPixelFieldConfVO.API_TYPE_ID;

    /**
     * Pour faire le lien avec le field sur lequel la pixellisation a lieu (approche contextFilters)
     */
    public pixel_vo_api_type_id: string;
    public pixel_vo_field_name: string;

    /**
     * Pour faire le lien avec le field_id du vardatabasevo (approche classique vardatabasevo)
     */
    public pixel_param_field_name: string;

    /**
     * Les informations liées au range type, et surtout à la segmentation (typiquement sur un pixel de type tsrange)
     */
    public pixel_range_type: number;
    public pixel_segmentation_type: number;

    public set_vo_api_type_id(vo_api_type_id: string): VarPixelFieldConfVO {
        this.pixel_vo_api_type_id = vo_api_type_id;
        return this;
    }

    public set_vo_field_name(vo_field_id: string): VarPixelFieldConfVO {
        this.pixel_vo_field_name = vo_field_id;
        return this;
    }

    public set_param_field_name(param_field_name: string): VarPixelFieldConfVO {
        this.pixel_param_field_name = param_field_name;
        return this;
    }

    public set_range_type(range_type: number): VarPixelFieldConfVO {
        this.pixel_range_type = range_type;
        return this;
    }

    public set_segmentation_type(segmentation_type: number): VarPixelFieldConfVO {
        this.pixel_segmentation_type = segmentation_type;
        return this;
    }
}