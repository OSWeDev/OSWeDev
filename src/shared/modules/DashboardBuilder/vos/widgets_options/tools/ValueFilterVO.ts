import { field_names } from "../../../../../tools/ObjectHandler";
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
        [ValueFilterVO.FILTER_TYPE_HOUR]: [
            field_names<ValueFilterVO>().hour_rounded,
            field_names<ValueFilterVO>().hour_negative_value,
            field_names<ValueFilterVO>().hour_positive_sign,
            field_names<ValueFilterVO>().hour_formatted,
            field_names<ValueFilterVO>().hour_arrondi_minutes,
        ],
        [ValueFilterVO.FILTER_TYPE_TSTZ]: [
            field_names<ValueFilterVO>().tstz_segment_type,
            field_names<ValueFilterVO>().tstz_localized,
        ],
        [ValueFilterVO.FILTER_TYPE_AMOUNT]: [
            field_names<ValueFilterVO>().amount_fractional_digits,
            field_names<ValueFilterVO>().amount_k,
            field_names<ValueFilterVO>().amount_only_positive,
            field_names<ValueFilterVO>().amount_humanize,
            field_names<ValueFilterVO>().amount_currency,
        ],
        [ValueFilterVO.FILTER_TYPE_PERCENT]: [
            field_names<ValueFilterVO>().percent_fractional_digits,
            field_names<ValueFilterVO>().percent_pts,
            field_names<ValueFilterVO>().percent_explicit_sign,
            field_names<ValueFilterVO>().percent_evol_from_prct,
            field_names<ValueFilterVO>().percent_treat_999_as_infinite,
        ],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED]: [
            field_names<ValueFilterVO>().fixed_fractional_digits,
            field_names<ValueFilterVO>().fixed_rounded,
            field_names<ValueFilterVO>().fixed_rounded_type,
            field_names<ValueFilterVO>().fixed_only_positive,
            field_names<ValueFilterVO>().fixed_dot_decimal_marker,
        ],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_CEIL]: [
            field_names<ValueFilterVO>().fixed_fractional_digits,
            field_names<ValueFilterVO>().fixed_rounded,
            field_names<ValueFilterVO>().fixed_only_positive,
            field_names<ValueFilterVO>().fixed_dot_decimal_marker,
        ],
        [ValueFilterVO.FILTER_TYPE_TO_FIXED_FLOOR]: [
            field_names<ValueFilterVO>().fixed_fractional_digits,
            field_names<ValueFilterVO>().fixed_rounded,
            field_names<ValueFilterVO>().fixed_only_positive,
            field_names<ValueFilterVO>().fixed_dot_decimal_marker,
        ],
        [ValueFilterVO.FILTER_TYPE_BOOLEAN]: [],
        [ValueFilterVO.FILTER_TYPE_PAD_HOUR]: [
            field_names<ValueFilterVO>().hour_rounded,
            field_names<ValueFilterVO>().hour_negative_value,
            field_names<ValueFilterVO>().hour_positive_sign,
            field_names<ValueFilterVO>().hour_formatted,
        ],
        [ValueFilterVO.FILTER_TYPE_HIDE_ZERO]: [],
        [ValueFilterVO.FILTER_TYPE_BIG_NUM]: [
            field_names<ValueFilterVO>().fixed_fractional_digits,
            field_names<ValueFilterVO>().fixed_rounded,
            field_names<ValueFilterVO>().fixed_rounded_type,
            field_names<ValueFilterVO>().fixed_only_positive,
            field_names<ValueFilterVO>().fixed_dot_decimal_marker,
        ],
        [ValueFilterVO.FILTER_TYPE_POSITIVE_NUMBER]: [
            field_names<ValueFilterVO>().fixed_fractional_digits,
            field_names<ValueFilterVO>().fixed_rounded,
            field_names<ValueFilterVO>().fixed_rounded_type,
            field_names<ValueFilterVO>().fixed_only_positive,
            field_names<ValueFilterVO>().fixed_dot_decimal_marker,
        ],
        [ValueFilterVO.FILTER_TYPE_TRUNCATE]: [
            field_names<ValueFilterVO>().truncate_nb_chars,
        ],
    };

    public static ROUNDED_TYPE_CEIL: number = 0;
    public static ROUNDED_TYPE_FLOOR: number = 1;
    public static ROUNDED_TYPE_ROUND: number = 2;
    public static ROUNDED_TYPE_NONE: number = 3;
    public static ROUNDED_TYPE_LABELS: { [rounded_type: number]: string } = {
        [ValueFilterVO.ROUNDED_TYPE_CEIL]: "ValueFilterVO.ROUNDED_TYPE_CEIL",
        [ValueFilterVO.ROUNDED_TYPE_FLOOR]: "ValueFilterVO.ROUNDED_TYPE_FLOOR",
        [ValueFilterVO.ROUNDED_TYPE_ROUND]: "ValueFilterVO.ROUNDED_TYPE_ROUND",
        [ValueFilterVO.ROUNDED_TYPE_NONE]: "ValueFilterVO.ROUNDED_TYPE_NONE",
    };

    public static API_TYPE_ID: string = "value_filter";

    public id: number;
    public _type: string = ValueFilterVO.API_TYPE_ID;

    public filter_type: number;

    // Champs pour chaque type de filtre

    //#region HOUR

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

    //#endregion

    //#region TSTZ
    public tstz_segment_type: number;
    public tstz_localized: boolean;
    //#endregion

    //#region AMOUNT
    public amount_fractional_digits: number;
    public amount_k: boolean;
    public amount_only_positive: boolean;
    public amount_humanize: boolean;
    public amount_currency: string;
    //#endregion

    //#region PERCENT
    public percent_fractional_digits: number;
    public percent_pts: boolean;
    public percent_explicit_sign: boolean;
    public percent_evol_from_prct: boolean;
    public percent_treat_999_as_infinite: boolean;
    //#endregion

    //#region TO FIXED / CEIL / FLOOR
    public fixed_fractional_digits: number;

    /**
     * Arrondi à quelle échelle (0.1, 0.01, 10, ...) si 0 arrondi à l'entier, si null on arrondi pas sauf si fixed_rounded_type est fixé à ceil ou floor ou round et du coup dans ce cas ça utilise le fixed_fractional_digits pour savoir à quelle échelle arrondir
     */
    public fixed_rounded: number;

    /**
     * Enumération pour le type d'arrondi
     */
    public fixed_rounded_type: number;
    public fixed_only_positive: boolean;
    public fixed_dot_decimal_marker: boolean;
    //#endregion

    //#region TRUNCATE
    public truncate_nb_chars: number;
    //#endregion

}