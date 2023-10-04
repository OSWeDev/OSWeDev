export default class AdvancedRefFieldFilter {

    public static FILTER_TYPE_LABELS: string[] = [
        'adv_ref_field_fltr.eq',
        'adv_ref_field_fltr.not_eq',
        'adv_ref_field_fltr.inf',
        'adv_ref_field_fltr.infeq',
        'adv_ref_field_fltr.sup',
        'adv_ref_field_fltr.supeq',
        'adv_ref_field_fltr.est_null',
        'adv_ref_field_fltr.nest_pas_null',
    ];
    public static FILTER_TYPE_EQ: number = 0;
    public static FILTER_TYPE_NOTEQ: number = 1;
    public static FILTER_TYPE_INF: number = 2;
    public static FILTER_TYPE_INFEQ: number = 3;
    public static FILTER_TYPE_SUP: number = 4;
    public static FILTER_TYPE_SUPEQ: number = 5;
    public static FILTER_TYPE_EST_NULL: number = 6;
    public static FILTER_TYPE_NEST_PAS_NULL: number = 7;

    public static LINK_TYPE_LABELS: string[] = [
        'adv_ref_field_fltr.et',
        'adv_ref_field_fltr.ou',
    ];
    public static LINK_TYPE_ET: number = 0;
    public static LINK_TYPE_OU: number = 1;

    public filter_type: number;
    public filter_content: number;
    public link_type: number;

    public constructor() {
        this.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_INF;
        this.filter_content = null;
        this.link_type = AdvancedRefFieldFilter.LINK_TYPE_ET;
    }
}