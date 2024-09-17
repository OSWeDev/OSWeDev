import NumRange from '../../DataRender/vos/NumRange';
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaTokenPriceVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_token_price";

    public id: number;
    public _type: string = OseliaTokenPriceVO.API_TYPE_ID;

    /**
     * Les modèles associés
     */
    public model_id_ranges: NumRange[];

    /**
     * Plage de dates de validité de ce prix
     */
    public ts_range: TSRange;

    public million_input_token_price: number;
    public million_output_token_price: number;

    public partner_million_input_token_base_price: number;
    public partner_million_output_token_base_price: number;

    // TODO how to price Code Interpreter and File Search ?

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}