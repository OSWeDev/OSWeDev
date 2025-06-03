import IDistantVOBase from "../../../../IDistantVOBase";

export default class ValueFilterVO implements IDistantVOBase {


    public static FILTER_TYPE_NONE = 0;
    public static FILTER_TYPE_HOUR = 1;
    public static FILTER_TYPE_TSTZ = 2;
    public static FILTER_TYPE_AMOUNT = 3;
    public static FILTER_TYPE_PERCENT = 4;
    public static FILTER_TYPE_TO_FIXED = 5;
    public static FILTER_TYPE_TO_FIXED_CEIL = 6;
    public static FILTER_TYPE_TO_FIXED_FLOOR = 7;
    public static FILTER_TYPE_BOOLEAN = 8;
    public static FILTER_TYPE_PAD_HOUR = 9;
    public static FILTER_TYPE_HIDE_ZERO = 10;
    public static FILTER_TYPE_BIG_NUM = 11;
    public static FILTER_TYPE_POSITIVE_NUMBER = 12;
    public static FILTER_TYPE_TRUNCATE = 13;

    public static FILTER_TYPE_LABELS: { [filter_type: number]: string } = {
        [ValueFilterVO.FILTER_TYPE_NONE]: "ValueFilterVO.FILTER_TYPE_NONE",
        [ValueFilterVO.FILTER_TYPE_HOUR]: "ValueFilterVO.FILTER_TYPE_HOUR",
        [ValueFilterVO.FILTER_TYPE_TSTZ]: "ValueFilterVO.FILTER_TYPE_TSTZ",
        [ValueFilterVO.FILTER_TYPE_AMOUNT]: "ValueFilterVO.FILTER_TYPE_AMOUNT",
        [ValueFilterVO.FILTER_TYPE_PERCENT]: "ValueFilterVO.FILTER_TYPE_PERCENT",
        [ValueFilterVO.FILTER_TYPE_TO_FIXED]: "ValueFilterVO.FILTER_TYPE_TO_FIXED",
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_CEIL]: "ValueFilterVO.FILTER_TYPE_TO_FIXED_CEIL",
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_FLOOR]: "ValueFilterVO.FILTER_TYPE_TO_FIXED_FLOOR",
        [ValueFilterVO.FILTER_TYPE_BOOLEAN]: "ValueFilterVO.FILTER_TYPE_BOOLEAN",
        [ValueFilterVO.FILTER_TYPE_PAD_HOUR]: "ValueFilterVO.FILTER_TYPE_PAD_HOUR",
        [ValueFilterVO.FILTER_TYPE_HIDE_ZERO]: "ValueFilterVO.FILTER_TYPE_HIDE_ZERO",
        [ValueFilterVO.FILTER_TYPE_BIG_NUM]: "ValueFilterVO.FILTER_TYPE_BIG_NUM",
        [ValueFilterVO.FILTER_TYPE_POSITIVE_NUMBER]: "ValueFilterVO.FILTER_TYPE_POSITIVE_NUMBER",
        [ValueFilterVO.FILTER_TYPE_TRUNCATE]: "ValueFilterVO.FILTER_TYPE_TRUNCATE"
    };

    // Correspondance entre filtre et champs utilisés
    public static FILTER_PARAMS_MAPPING: { [filter_type: number]: Array<keyof ValueFilterVO> } = {
        [ValueFilterVO.FILTER_TYPE_HOUR]: ['hour_rounded', 'hour_negativeValue', 'hour_positiveSign', 'hour_formatted', 'hour_arrondiMinutes'],
        [ValueFilterVO.FILTER_TYPE_TSTZ]: ['tstz_segment_type', 'tstz_localized'],
        [ValueFilterVO.FILTER_TYPE_AMOUNT]: ['amount_fractional_digits', 'amount_k', 'amount_only_positive', 'amount_humanize', 'amount_currency'],
        [ValueFilterVO.FILTER_TYPE_PERCENT]: ['percent_fractional_digits', 'percent_pts', 'percent_explicit_sign', 'percent_evol_from_prct', 'percent_treat_999_as_infinite'],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED]: ['fixed_fractional_digits', 'fixed_rounded', 'fixed_rounded_type', 'fixed_only_positive', 'fixed_dot_decimal_marker'],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_CEIL]: ['fixed_fractional_digits', 'fixed_rounded', 'fixed_only_positive', 'fixed_dot_decimal_marker'],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_FLOOR]: ['fixed_fractional_digits', 'fixed_rounded', 'fixed_only_positive', 'fixed_dot_decimal_marker'],
        [ValueFilterVO.FILTER_TYPE_TRUNCATE]: ['truncate_nbChars']
    };

    public static API_TYPE_ID: string = "value_filter";

    public id: number;
    public _type: string = ValueFilterVO.API_TYPE_ID;

    public filter_type: number;

    // Champs optionnels pour chaque type de filtre

    //on déclare une région HOUR
    TODO
    //region HOUR


    /**
     * Arrondir à l'heure
     */
    public hour_rounded: boolean;

    /**
     * Pour afficher les heures négatives ou non
     * Si c'est non, on renvoie 0 pour les heures négatives
     */
    public hour_negative_value: boolean;

    /**
     * Ajouter un signe positif devant les heures
     */
    public hour_positive_sign: boolean;

    /**
     * Pour afficher un 0 devant les heures si entre 0 et 9 inclus
     */
    public hour_formatted: boolean;

    /**
     * Arrondi des minutes à 5, 10, x minutes près
     */
    public hour_arrondi_minutes: number; // Anciennement true == 5 pour la migration

    // TSTZ
    public tstz_segment_type?: number;
    public tstz_localized?: boolean;

    // AMOUNT
    public amount_fractional_digits?: number;
    public amount_k?: boolean;
    public amount_only_positive?: boolean;
    public amount_humanize?: boolean;
    public amount_currency?: string;

    // PERCENT
    public percent_fractional_digits?: number;
    public percent_pts?: boolean;
    public percent_explicit_sign?: boolean;
    public percent_evol_from_prct?: boolean;
    public percent_treat_999_as_infinite?: boolean;

    // TO FIXED / CEIL / FLOOR
    public fixed_fractional_digits?: number;
    public fixed_rounded?: boolean | number;
    public fixed_rounded_type?: number;
    public fixed_only_positive?: boolean;
    public fixed_dot_decimal_marker?: boolean;

    // TRUNCATE
    public truncate_nbChars?: number;

}