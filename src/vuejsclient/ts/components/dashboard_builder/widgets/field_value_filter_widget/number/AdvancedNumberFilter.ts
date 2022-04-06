export default class AdvancedNumberFilter {

    public static FILTER_TYPE_LABELS: string[] = [
        'adv_number_fltr.inf',
        'adv_number_fltr.infeq',
        'adv_number_fltr.sup',
        'adv_number_fltr.supeq',
        'adv_number_fltr.est_null',
        'adv_number_fltr.nest_pas_null'
    ];
    public static FILTER_TYPE_INF: number = 0;
    public static FILTER_TYPE_INFEQ: number = 1;
    public static FILTER_TYPE_SUP: number = 2;
    public static FILTER_TYPE_SUPEQ: number = 3;
    public static FILTER_TYPE_EST_NULL: number = 4;
    public static FILTER_TYPE_NEST_PAS_NULL: number = 5;

    public static LINK_TYPE_LABELS: string[] = [
        'adv_number_fltr.et',
        'adv_number_fltr.ou',
    ];
    public static LINK_TYPE_ET: number = 0;
    public static LINK_TYPE_OU: number = 1;

    public filter_type: number;
    public filter_content: number;
    public link_type: number;

    public constructor() {
        this.filter_type = AdvancedNumberFilter.FILTER_TYPE_INF;
        this.filter_content = null;
        this.link_type = AdvancedNumberFilter.LINK_TYPE_ET;
    }
}