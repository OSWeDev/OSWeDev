import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import IDistantVOBase from "../../IDistantVOBase";


export default class ModuleTableCompositePartialIndexVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "module_table_composite_partial_index";

    public id: number;
    public _type: string = ModuleTableCompositePartialIndexVO.API_TYPE_ID;

    // public table_id: number; inutile pour le moment on a pas créé les tables en bdd
    public vo_type: string;

    // public field_id_num_ranges: NumRange[]; inutile pour le moment on a pas créé les fields en bdd
    public field_names: string[];

    /**
     * Pour créer des indexs composites partiels, donc avec filtrages
     */
    public context_filters: ContextFilterVO[];

    get index_name(): string {
        return this.vo_type + '__' + this.field_names.join('_') + (this.context_filters ? ('__' + this.context_filters.map((cf) => cf.field_name + '_' + cf.filter_type).join('_')) : '');
    }
}