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

    // pour forcer un nom d'index avec un param {table_name} qui sera remplacé par le nom de la table (typiquement sur une segmented)
    public overload_index_name_schema: string;

    /**
     * Pour créer des indexs composites partiels, donc avec filtrages
     */
    public context_filters: ContextFilterVO[];

    get index_name(): string {
        if (this.overload_index_name_schema) {
            return this.overload_index_name_schema;
        }
        return this.vo_type + '_' + '{table_name}' + '__' + this.field_names.join('_') + (this.context_filters ? ('__' + this.context_filters.map((cf) => cf.field_name + '_' + cf.filter_type).join('_')) : '');
    }
}