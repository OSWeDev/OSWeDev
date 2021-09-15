export default class AdvancedStringFilter {

    public static FILTER_TYPE_LABELS: string[] = [
        'adv_str_fltr.contient',
        'adv_str_fltr.contient_pas',
        'adv_str_fltr.commence',
        'adv_str_fltr.commence_pas',
        'adv_str_fltr.est',
        'adv_str_fltr.nest_pas',
        'adv_str_fltr.est_vide',
        'adv_str_fltr.nest_pas_vide',
        'adv_str_fltr.est_null',
        'adv_str_fltr.nest_pas_null'
    ];
    public static FILTER_TYPE_CONTIENT: number = 0;
    public static FILTER_TYPE_CONTIENT_PAS: number = 1;
    public static FILTER_TYPE_COMMENCE: number = 2;
    public static FILTER_TYPE_COMMENCE_PAS: number = 3;
    public static FILTER_TYPE_EST: number = 4;
    public static FILTER_TYPE_NEST_PAS: number = 5;
    public static FILTER_TYPE_EST_VIDE: number = 6;
    public static FILTER_TYPE_NEST_PAS_VIDE: number = 7;
    public static FILTER_TYPE_EST_NULL: number = 8;
    public static FILTER_TYPE_NEST_PAS_NULL: number = 9;

    public static LINK_TYPE_LABELS: string[] = [
        'adv_str_fltr.et',
        'adv_str_fltr.ou',
    ];
    public static LINK_TYPE_ET: number = 0;
    public static LINK_TYPE_OU: number = 1;

    public filter_type: number;
    public filter_content: string;
    public link_type: number;

    public constructor() {
        this.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT;
        this.filter_content = '';
        this.link_type = AdvancedStringFilter.LINK_TYPE_ET;
    }
}