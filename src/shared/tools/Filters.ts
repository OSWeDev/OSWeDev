
import ModuleFormatDatesNombres from '../modules/FormatDatesNombres/ModuleFormatDatesNombres';
import TypesHandler from './TypesHandler';
import Humanizer from './Humanizer';
import Durations from '../modules/FormatDatesNombres/Dates/Durations';
import HourSegment from '../modules/DataRender/vos/HourSegment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import Dates from '../modules/FormatDatesNombres/Dates/Dates';

export default class FilterObj<T, U, K> {

    // readToHourFilter = (
    //     value: number | string,
    //     rounded: boolean = false,
    //     negativeValue: boolean = false,
    //     positiveSign: boolean = false,
    //     formatted: boolean = false,
    //     arrondiMinutes: boolean | number = null)
    public static FILTER_TYPE_hour = 'hour';

    public static FILTER_TYPE_tstz = 'tstz';

    // readToAmountFilter = (value: number | string, fractional_digits: number = 0, k: boolean = false, only_positive: boolean = false)
    public static FILTER_TYPE_amount = 'amount';

    // readToPercentFilter = (
    //     value: number | string,
    //     fractional_digits: number = 0,
    //     pts: boolean = false,
    //     explicit_sign: boolean = false,
    //     evol_from_prct: boolean = false,
    //     treat_999_as_infinite: boolean = true)
    public static FILTER_TYPE_percent = 'percent';

    // readToFixed = (
    //     value: number | string,
    //     fractional_digits: number = 0,
    //     rounded: boolean | number = false,
    //     rounded_type: number = ARRONDI_TYPE_ROUND,
    //     only_positive: boolean = false,
    //     dot_decimal_marker: boolean = false
    // )
    // readToFixedCeilFilter = (value: number, fractional_digits: number, rounded: number | boolean = false)
    // readToFixedFloorFilter = (value: number, fractional_digits: number, rounded: number | boolean = false)
    public static FILTER_TYPE_toFixed = 'toFixed';
    public static FILTER_TYPE_toFixedCeil = 'toFixedCeil';
    public static FILTER_TYPE_toFixedFloor = 'toFixedFloor';


    // readToBooleanFilter = (value: boolean)
    public static FILTER_TYPE_boolean = 'boolean';

    // readToPadHour = (value: number)
    public static FILTER_TYPE_padHour = 'padHour';
    // readToHideZeroFilter = (value: number)
    public static FILTER_TYPE_hideZero = 'hideZero';
    // readToTruncateFilter = (value: string, nbChars: number)

    public static FILTER_TYPE_bignum = 'bignum';
    public static FILTER_TYPE_positiveNumber = 'positiveNumber';
    public static FILTER_TYPE_truncate = 'truncate';

    public static createNew<T, U, K>(
        read: T,
        write: U,
        toObject?: K,
        type?: string,
    ): FilterObj<T, U, K> {
        const res: FilterObj<T, U, K> = new FilterObj<T, U, K>();

        res.read = read;
        res.write = write;
        res.type = type;
        res.toObject = toObject;

        return res;
    }

    public read: T;
    public write: U;
    public toObject: K;
    public type: string;
}
// // FILTERS MIXIN
// function FilterObj<T>(read: T, write) {
//     this.read = read;
//     this.write = write;
// }


const readToTstzFilter = (
    value: number | string,
    segment_type: number = TimeSegment.TYPE_DAY,
    localized: boolean = true,
): string => {
    if (value == null || typeof value == "undefined") {
        return null;
    }

    if (typeof value == 'string') {
        const date_format = Dates.find_date_format(value);
        if (date_format) {
            value = Dates.parse(value, date_format);
        }
    }

    value = parseInt(value.toString());

    if (value <= 0) {
        return null;
    }

    return Dates.format_segment(value, segment_type, localized);
};

const writeToTstzFilter = (value: string | number): number => {

    if ((value == null) || (typeof value === "undefined")) {
        return null;
    }

    value = value.toString();

    throw new Error("Not implemented");
};

const readToHourFilter = (
    value: number | string,
    rounded: boolean = false,
    negativeValue: boolean = false,
    positiveSign: boolean = false,
    formatted: boolean = false,
    arrondiMinutes: boolean | number = null
): string => {
    if (value == null || typeof value == "undefined") {
        return null;
    }

    value = parseFloat(value.toString());

    if (value <= 0 && !negativeValue) {
        if (formatted) {
            return "00h00";
        }
        return "0h";
    }

    // Refonte.....
    if (rounded) {
        value = Math.round(value);
    }
    const duration = Math.abs(value * 60 * 60);
    let heures = Math.floor(Durations.as(duration, HourSegment.TYPE_HOUR));
    let minutes = Math.round(Durations.as(duration, HourSegment.TYPE_MINUTE) - heures * 60);

    if (arrondiMinutes) {
        if (arrondiMinutes === true) {
            arrondiMinutes = 5;
        }

        minutes = Math.round(minutes / arrondiMinutes) * arrondiMinutes;
    }

    while (minutes >= 60) {
        minutes = minutes - 60;
        heures++;
    }

    let heuresTxt = heures.toString();
    if (formatted) {
        if (value < 0 && heures >= 0 && heures < 10) {
            heuresTxt = "-0" + heuresTxt.toString();
        } else if (heures >= 0 && heures < 10) {
            heuresTxt = "0" + heures;
        }
    }

    let prefixSign = (positiveSign && (value > 0)) ? "+" : "";

    if (value < 0) {
        if (!((minutes == 0) && (heuresTxt == '0'))) {
            prefixSign = "-";
        }
    }

    return (
        prefixSign +
        heuresTxt +
        "h" +
        (minutes == 0 ? "" : minutes < 10 ? "0" + minutes : minutes)
    );
};

const writeToHourFilter = (value: string | number): number => {

    if ((value == null) || (typeof value === "undefined")) {
        return null;
    }

    value = value.toString();

    if (!/[0-9]+([.,hH:]([0-9]+)?)?/.test(value)) {
        return null;
    }

    if (/[0-9]+[.,]([0-9]{2})?/.test(value)) {
        return parseFloat(value);
    }

    const parts = value.split(/[:hH]/);
    const minutes = parts[1];
    if (!minutes) {
        return parseFloat(parts[0]);
    }

    return parseFloat(parts[0]) + ((parseFloat(minutes) + 0.0) / 60);
};

export const hourFilter = FilterObj.createNew(
    readToHourFilter,
    writeToHourFilter,
    null,
    FilterObj.FILTER_TYPE_hour,
);

export const tstzFilter = FilterObj.createNew(
    readToTstzFilter,
    writeToTstzFilter,
    null,
    FilterObj.FILTER_TYPE_tstz,
);

const readToPlanningCheckFilter = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value == 1 ? "OUI" : "NON";
};

const writeToPlanningCheckFilter = (value: string): number => {
    if (value == null) {
        return (null);
    }
    return value == "OUI" ? 1 : -1;
};

export const planningCheckFilter = FilterObj.createNew(
    readToPlanningCheckFilter,
    writeToPlanningCheckFilter,
    null,
    null,
);


const readToAlerteCheckFilter = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value == 1 ? "ALERTE" : "";
};

const writeToAlerteCheckFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    return value == "ALERTE" ? 1 : -1;
};

export const alerteCheckFilter = FilterObj.createNew(
    readToAlerteCheckFilter,
    writeToAlerteCheckFilter,
    null,
    null,
);

export interface IAmountFilter {
    value: number | string;
    fractional_digits: number;
    k: boolean;
    only_positive: boolean;
    humanize: boolean;
    currency: string;
}

const readToAmountFilter = (
    value: number | string,
    fractional_digits: number = 0,
    k: boolean = false,
    only_positive: boolean = false,
    humanize: boolean = false,
    currency = "€"
): string => {

    const currencyTab = {
        "€": 1,
        "$": 1.08,
        "£": 0.85,
        "¥": 169.69,
        "AU$": 1.63,
        "CA$": 1.48,
        "CHF": 0.99,
        "CN¥": 7.857464,
        "HK$": 8.46,
        "NZ$": 1.78
    };


    if ((value === null) || (typeof value === "undefined")) {
        return null;
    }

    // FIXME k devient probablement inutile avec humanize (même si le rendu est fondamentalement différent)
    if (humanize) {
        k = false;
    }

    value = parseFloat(value.toString());
    if (!isFinite(value) || (!value && value !== 0)) {
        return null;
    }

    if (only_positive && value < 0) {
        value = 0;
    }

    let stringified;
    let decalageComa;
    let _int;

    // On récupère le séparateur en fonction de la langue

    if (k) {
        currency = "k€";
        value = value / 1000;
    }

    if (currencyTab[currency]) {
        value = value * currencyTab[currency];
    }

    if (humanize) {
        return Humanizer.humanize_number(value, fractional_digits, currency);
    }

    if (fractional_digits !== null) {
        decalageComa = fractional_digits ? -(fractional_digits + 1) : 0;
        stringified = Math.abs(value).toFixed(fractional_digits);
    } else {
        decalageComa = -3;
        stringified = Math.abs(value).toFixed(2);
    }

    if (decalageComa) {
        _int = stringified.slice(0, decalageComa);
    } else {
        _int = stringified;
    }

    return currency + ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(value, fractional_digits);
};

const writeToAmountFilter = (value: string | number): number => {

    if ((value === null) || (typeof value === "undefined")) {
        return null;
    }

    const currency = "€";
    const result = value.toString()
        .replace(currency, "")
        .replace(/,/g, ".")
        .replace(/[^-0-9.]/g, "");

    const res = parseFloat(result);
    if (isNaN(res)) {
        return 0;
    }
    return res;
};

const amontFilterToObject = (
    value: number | string,
    fractional_digits: number = 0,
    k: boolean = false,
    only_positive: boolean = false,
    humanize: boolean = false,
    currency = "€"
): IAmountFilter => {

    return {
        value,
        fractional_digits,
        k,
        only_positive,
        humanize,
        currency,
    };
};

export const amountFilter = FilterObj.createNew(
    readToAmountFilter,
    writeToAmountFilter,
    amontFilterToObject,
    FilterObj.FILTER_TYPE_amount,
);

/**
 * Interface for Percent Filter
 */
export interface IPercentFilter {
    value: number | string;
    fractional_digits: number;
    pts: boolean;
    explicit_sign: boolean;
    evol_from_prct: boolean;
    treat_999_as_infinite: boolean;
}

/**
 * @param evol_from_prct Renvoie 2,2% au lieu de 102.2% pour indiquer une évolution plutôt qu'un rapport simple entre 2 éléments par exemple
 * @param explicit_sign Renvoie +2,2% au lieu de 2,2% pour indiquer le signe de façon explicit même quand il est positif
 */

const readToPercentFilter = (
    value: number | string,
    fractional_digits: number = 0,
    pts: boolean = false,
    explicit_sign: boolean = false,
    evol_from_prct: boolean = false,
    treat_999_as_infinite: boolean = true
): string => {

    if (value == undefined) {
        return null;
    }

    let number_value: number = parseFloat(value.toString());

    if (!isFinite(number_value) || isNaN(number_value)) {
        return null;
    }

    const returns_infinity: boolean = (treat_999_as_infinite && (number_value >= 999)) || (treat_999_as_infinite && (number_value <= -999));

    if ((!!evol_from_prct) && (!returns_infinity)) {
        number_value -= 1;
    }

    number_value *= 100;
    let pourcentage: string = "%";

    if (typeof pts != "undefined" && pts == true) {
        pourcentage = "pts";
    }

    let res: string = returns_infinity ?
        ((number_value < 0) ? '-&infin;' : '&infin;') :
        ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(number_value, fractional_digits) + " " + pourcentage;

    if (explicit_sign) {
        if (number_value > 0) {
            res = '+' + res;
        }
    }

    return res;
};

const writeToPercentFilter = (value: string): number => {
    if (value == null) {
        return (null);
    }

    const result: number = parseFloat(value
        .replace("%", "")
        .replace(",", ".")
        .replace(/[^-0-9.]/g, ""));

    if (isNaN(result)) {
        return 0;
    }

    return result / 100.0;
};

const percentFilterToObject = (
    value: number | string,
    fractional_digits: number = 0,
    pts: boolean = false,
    explicit_sign: boolean = false,
    evol_from_prct: boolean = false,
    treat_999_as_infinite: boolean = true
): IPercentFilter => {

    return {
        value,
        fractional_digits,
        pts,
        explicit_sign,
        evol_from_prct,
        treat_999_as_infinite,
    };
};

export const percentFilter = FilterObj.createNew(
    readToPercentFilter,
    writeToPercentFilter,
    percentFilterToObject,
    FilterObj.FILTER_TYPE_percent,
);

export const ARRONDI_TYPE_CEIL: number = 0;
export const ARRONDI_TYPE_FLOOR: number = 1;
export const ARRONDI_TYPE_ROUND: number = 2;

/**
 * Interface For IFixed
 */
export interface IFixed {
    value: number | string;
    fractional_digits: number;
    rounded: boolean | number;
    rounded_type: number;
    only_positive: boolean;
    dot_decimal_marker: boolean;
}

const writeToFixed = (value: string): number => {
    if (TypesHandler.getInstance().isNull(value)) {
        return null;
    }
    value = value.replace(",", ".");
    return value && value.length ? parseFloat(value) : 0;
};

const readToFixed = (
    value: number | string,
    fractional_digits: number = 0,
    rounded: boolean | number = false,
    rounded_type: number = ARRONDI_TYPE_ROUND,
    only_positive: boolean = false,
    dot_decimal_marker: boolean = false
): string => {

    let result: string = null;

    if (!value || (fractional_digits < 0)) {
        return TypesHandler.getInstance().isNumber(value) ? value.toString().replace(".", ",") : null;
    }

    let number_value: number = parseFloat(value.toString());
    if (only_positive && (number_value < 0)) {
        number_value = 0;
    }

    result = number_value.toString();

    if ((!rounded) && (rounded_type != ARRONDI_TYPE_ROUND) && (fractional_digits !== null)) {
        // si pas de parametre d'arrondui, mais rounded_type n'est pas round,
        // il faut appliquer une rounded par defaut avec le rounded_type selon le nbr de decimal
        rounded = 1 / (10 ** fractional_digits);
    }

    if (rounded) {
        result = ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(
            parseFloat(result),
            rounded,
            rounded_type
        );
    }

    if (TypesHandler.getInstance().isNumber(fractional_digits) && (fractional_digits >= 0)) {
        result = ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(parseFloat(result), fractional_digits);
    }

    return dot_decimal_marker ? result.replace(",", ".") : result.replace(".", ",");
};

const fixedFilterToObject = (
    value: number | string,
    fractional_digits: number = 0,
    rounded: boolean | number = false,
    rounded_type: number = ARRONDI_TYPE_ROUND,
    only_positive: boolean = false,
    dot_decimal_marker: boolean = false,
): IFixed => {

    return {
        value,
        fractional_digits,
        rounded,
        rounded_type,
        only_positive,
        dot_decimal_marker,
    };
};

export const toFixedFilter = FilterObj.createNew(
    readToFixed,
    writeToFixed,
    fixedFilterToObject,
    FilterObj.FILTER_TYPE_toFixed,
);

// let readToFixedCeilAndFloor = (value: number | string, fractional_digits: number = 0, rounded_type: number = null): string => {
//     if (!value && value !== 0) {
//         return null;
//     }

//     if (value == null || fractional_digits == null) {
//         return null;
//     }

//     if (value == 0) {
//         return "0";
//     }

//     if (fractional_digits < 0) {
//         return String(value);
//     }

//     let floorPositiveCeilNegative = (valeur: number): number => {
//         let valeurString: string;
//         valeurString = String(valeur * (10 ** fractional_digits));
//         let res: number = parseInt(valeurString.substring(0, valeurString.length - 1));
//         res = res / (10 ** fractional_digits);
//         return res;
//     };

//     let ceilPositiveFloorNegative = (valeur: number): number => {

//         let valeurString: string;
//         valeurString = String(valeur * (10 ** fractional_digits));
//         let res: number = parseInt(valeurString.substring(0, valeurString.length - 1)) + 1;
//         res = res / (10 ** fractional_digits);
//         return res;
//     };

//     let value_number: number = parseFloat(value.toString());

//     if (rounded_type == ARRONDI_TYPE_FLOOR) {
//         if (value > 0) {
//             value = floorPositiveCeilNegative(value_number);
//         } else {
//             value = value_number * (-1);
//             value = ceilPositiveFloorNegative(value);
//             value = value * (-1);
//         }
//     }

//     if (rounded_type == ARRONDI_TYPE_CEIL) {
//         if (value > 0) {
//             value = ceilPositiveFloorNegative(value_number);
//         } else {
//             value = value_number * (-1);
//             value = floorPositiveCeilNegative(value);
//             value = value * (-1);
//         }
//     }

//     return String(value).replace(".", ",");
// };


const readToFixedCeilFilter = (value: number, fractional_digits: number, rounded: number | boolean = false, only_positive: boolean = false, dot_decimal_marker: boolean = false): string => {
    return readToFixed(value, fractional_digits, rounded, ARRONDI_TYPE_CEIL, only_positive, dot_decimal_marker);
};

export const toFixedCeilFilter = FilterObj.createNew(
    readToFixedCeilFilter,
    writeToFixed,
    null,
    FilterObj.FILTER_TYPE_toFixedCeil,
);

const readToFixedFloorFilter = (value: number, fractional_digits: number, rounded: number | boolean = false, only_positive: boolean = false, dot_decimal_marker: boolean = false): string => {
    return readToFixed(value, fractional_digits, rounded, ARRONDI_TYPE_FLOOR, only_positive, dot_decimal_marker);
};

export const toFixedFloorFilter = FilterObj.createNew(
    readToFixedFloorFilter,
    writeToFixed,
    null,
    FilterObj.FILTER_TYPE_toFixedFloor,
);

const readToHideZeroFilter = (value: number): string => {
    return !value ? "" : String(value);
};

const writeToHideZeroFilter = (value: string | number): number => {
    if (value == null) {
        return null;
    }

    return (value == "") ? 0 : parseFloat(value.toString());
};

export const hideZeroFilter = FilterObj.createNew(
    readToHideZeroFilter,
    writeToHideZeroFilter,
    null,
    FilterObj.FILTER_TYPE_hideZero,
);

const readToBooleanFilter = (value: boolean): string => {
    if (value == null) {
        return null;
    }
    return value ? "OUI" : "";
};

const writeToBooleanFilter = (value: string): boolean => {
    if (value == null) {
        return null;
    }
    return value == "OUI";

};
export const booleanFilter = FilterObj.createNew(
    readToBooleanFilter,
    writeToBooleanFilter,
    null,
    FilterObj.FILTER_TYPE_boolean,
);


const readToPadHour = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value < 10 ? "0" + value : "" + value;
};

const writeToPadHour = (value: string): number => {
    if (value == null) {
        return null;
    }
    return value && value.length ? parseFloat(value.replace(",", ".")) : 0;
};

export const padHourFilter = FilterObj.createNew(
    readToPadHour,
    writeToPadHour,
    null,
    FilterObj.FILTER_TYPE_padHour,
);

const readToTruncateFilter = (value: string, nbChars: number): string => {
    if (nbChars == null) {
        return null;
    }
    return value ? value.substring(0, nbChars) : null;
};

const writeToTruncateFilter = (value: string): string => {
    return value;
};

export const truncateFilter = FilterObj.createNew(
    readToTruncateFilter,
    writeToTruncateFilter,
    null,
    FilterObj.FILTER_TYPE_truncate,
);

const digitsRE = /(\d{3})(?=\d)/g;

const readToBignumFilter = (value: number | string): string => {
    if ((!value && value !== 0) || !isFinite(parseFloat(value.toString()))) {
        return null;
    }
    value = parseFloat(value.toString());
    const stringified = Math.abs(value).toFixed(2);
    const _int = stringified.slice(0, -3);
    const i = _int.length % 3;
    const head = i > 0 ? _int.slice(0, i) + (_int.length > 3 ? "," : "") : "";
    const _float = stringified.slice(-3);
    const sign = value < 0 ? "-" : "";
    return sign + head + _int.slice(i).replace(digitsRE, "$1,") + _float;
};

const writeToBignumFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    const result = ("" + value)
        //.replace(/,/g, ".")
        .replace(/[^-0-9.]/g, "");
    return value && value.length ? parseFloat(result) : 0;
};

export const bignumFilter = FilterObj.createNew(
    readToBignumFilter,
    writeToBignumFilter,
    null,
    FilterObj.FILTER_TYPE_bignum,
);

const readTopositiveNumberFilter = (value: number | string): string => {
    if (value == null) {
        return (null);
    }

    let res: number = null;
    if (typeof value == 'string') {
        res = parseFloat(value);
    } else {
        res = value;
    }
    if (res > 0) {
        return (res.toString());
    }
    return "0";
};

const writeTopositiveNumberFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    return parseFloat(value);
};

export const positiveNumberFilter = FilterObj.createNew(
    readTopositiveNumberFilter,
    writeTopositiveNumberFilter,
    null,
    FilterObj.FILTER_TYPE_positiveNumber,
);

export const filter_by_name = {
    amount: amountFilter,
    percent: percentFilter,
    toFixed: toFixedFilter,
    toFixedCeil: toFixedCeilFilter,
    toFixedFloor: toFixedFloorFilter,
    hideZero: hideZeroFilter,
    boolean: booleanFilter,
    padHour: padHourFilter,
    truncate: truncateFilter,
    bignum: bignumFilter,
    hour: hourFilter,
    planningCheck: planningCheckFilter,
    alerteCheck: alerteCheckFilter,
    tstz: tstzFilter
};
