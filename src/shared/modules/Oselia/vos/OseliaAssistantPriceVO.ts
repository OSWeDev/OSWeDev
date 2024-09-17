import NumRange from '../../DataRender/vos/NumRange';
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaAssistantPriceVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_assistant_price";

    public id: number;
    public _type: string = OseliaAssistantPriceVO.API_TYPE_ID;

    /**
     * Les modèles associés
     */
    public model_id_ranges: NumRange[];

    /**
     * Plage de dates de validité de ce prix
     */
    public ts_range: TSRange;

    public code_interpreter_session_price: number;
    public file_search_gibibyte_daily_price: number;

    public partner_code_interpreter_session_base_price: number;
    public partner_file_search_gibibyte_daily_base_price: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}