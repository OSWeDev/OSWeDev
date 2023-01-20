
import ModuleFormatDatesNombres from '../modules/FormatDatesNombres/ModuleFormatDatesNombres';
import TypesHandler from './TypesHandler';
import { stringify } from 'querystring';
import Humanizer from './Humanizer';
import Durations from '../modules/FormatDatesNombres/Dates/Durations';
import HourSegment from '../modules/DataRender/vos/HourSegment';

export default class FilterObj<T, U> {

    // readToHourFilter = (
    //     value: number | string,
    //     arrondi: boolean = false,
    //     negativeValue: boolean = false,
    //     positiveSign: boolean = false,
    //     formatted: boolean = false,
    //     arrondiMinutes: boolean | number = null)
    public static FILTER_TYPE_hour = 'hour';

    // readToAmountFilter = (value: number | string, fractionalDigits: number = 0, k: boolean = false, onlyPositive: boolean = false)
    public static FILTER_TYPE_amount = 'amount';

    // readToPercentFilter = (
    //     value: number | string,
    //     fractionalDigits: number = 0,
    //     pts: boolean = false,
    //     explicit_sign: boolean = false,
    //     evol_from_prct: boolean = false,
    //     treat_999_as_infinite: boolean = true)
    public static FILTER_TYPE_percent = 'percent';

    // readToFixed = (
    //     value: number | string,
    //     fractionalDigits: number = 0,
    //     arrondi: boolean | number = false,
    //     arrondi_type: number = ARRONDI_TYPE_ROUND,
    //     onlyPositive: boolean = false,
    //     dot_decimal_marker: boolean = false
    // )
    // readToFixedCeilFilter = (value: number, fractionalDigits: number, arrondi: number | boolean = false)
    // readToFixedFloorFilter = (value: number, fractionalDigits: number, arrondi: number | boolean = false)
    public static FILTER_TYPE_toFixed = 'toFixed';
    public static FILTER_TYPE_toFixedCeil = 'toFixedCeil';
    public static FILTER_TYPE_toFixedFloor = 'toFixedFloor';


    // readToBooleanFilter = (value: boolean)
    public static FILTER_TYPE_boolean = 'boolean';

    // readToPadHour = (value: number)
    // readToHideZeroFilter = (value: number)
    // readToTruncateFilter = (value: string, nbChars: number)

    public static createNew<T, U>(
        read: T,
        write: U
    ): FilterObj<T, U> {
        let res: FilterObj<T, U> = new FilterObj<T, U>();

        res.read = read;
        res.write = write;

        return res;
    }

    public read: T;
    public write: U;
}
// // FILTERS MIXIN
// function FilterObj<T>(read: T, write) {
//     this.read = read;
//     this.write = write;
// }

let readToHourFilter = (
    value: number | string,
    arrondi: boolean = false,
    negativeValue: boolean = false,
    positiveSign: boolean = false,
    formatted: boolean = false,
    arrondiMinutes: boolean | number = null): string => {
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
    if (arrondi) {
        value = Math.round(value);
    }
    let duration = Math.abs(value * 60 * 60);
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

let writeToHourFilter = (value: string | number): number => {

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

    let parts = value.split(/[:hH]/);
    let minutes = parts[1];
    if (!minutes) {
        return parseFloat(parts[0]);
    }

    return parseFloat(parts[0]) + ((parseFloat(minutes) + 0.0) / 60);
};

export let hourFilter = FilterObj.createNew(
    readToHourFilter,
    writeToHourFilter
);

let readToPlanningCheckFilter = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value == 1 ? "OUI" : "NON";
};

let writeToPlanningCheckFilter = (value: string): number => {
    if (value == null) {
        return (null);
    }
    return value == "OUI" ? 1 : -1;
};

export let planningCheckFilter = FilterObj.createNew(
    readToPlanningCheckFilter,
    writeToPlanningCheckFilter
);


let readToAlerteCheckFilter = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value == 1 ? "ALERTE" : "";
};

let writeToAlerteCheckFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    return value == "ALERTE" ? 1 : -1;
};

export let alerteCheckFilter = FilterObj.createNew(
    readToAlerteCheckFilter,
    writeToAlerteCheckFilter
);

let readToAmountFilter = (
    value: number | string,
    fractionalDigits: number = 0,
    k: boolean = false,
    onlyPositive: boolean = false,
    humanize: boolean = false,
    currency = "€"
): string => {

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

    if (onlyPositive && value < 0) {
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

    if (humanize) {
        return Humanizer.humanize_number(value, fractionalDigits, currency);
    }

    if (fractionalDigits !== null) {
        decalageComa = fractionalDigits ? -(fractionalDigits + 1) : 0;
        stringified = Math.abs(value).toFixed(fractionalDigits);
    } else {
        decalageComa = -3;
        stringified = Math.abs(value).toFixed(2);
    }

    if (decalageComa) {
        _int = stringified.slice(0, decalageComa);
    } else {
        _int = stringified;
    }

    return currency + ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(value, fractionalDigits);
};

let writeToAmountFilter = (value: string | number): number => {

    if ((value === null) || (typeof value === "undefined")) {
        return null;
    }

    let currency = "€";
    let result = value.toString()
        .replace(currency, "")
        .replace(/,/g, ".")
        .replace(/[^-0-9.]/g, "");

    let res = parseFloat(result);
    if (isNaN(res)) {
        return 0;
    }
    return res;
};

export let amountFilter = FilterObj.createNew(

    readToAmountFilter,
    writeToAmountFilter
);

/**
 * @param evol_from_prct Renvoie 2,2% au lieu de 102.2% pour indiquer une évolution plutôt qu'un rapport simple entre 2 éléments par exemple
 * @param explicit_sign Renvoie +2,2% au lieu de 2,2% pour indiquer le signe de façon explicit même quand il est positif
 */

let readToPercentFilter = (
    value: number | string,
    fractionalDigits: number = 0,
    pts: boolean = false,
    explicit_sign: boolean = false,
    evol_from_prct: boolean = false,
    treat_999_as_infinite: boolean = true): string => {

    if (value == undefined) {
        return null;
    }

    let number_value: number = parseFloat(value.toString());

    if (!isFinite(number_value) || isNaN(number_value)) {
        return null;
    }

    let returns_infinity: boolean = (treat_999_as_infinite && value >= 999) || (treat_999_as_infinite && value <= -999);

    if ((!!evol_from_prct) && (!returns_infinity)) {
        number_value -= 1;
    }

    number_value *= 100;
    let pourcentage: string = "%";

    if (typeof pts != "undefined" && pts == true) {
        pourcentage = "pts";
    }

    let res: string = returns_infinity ? ((value < 0) ? '-&infin;' : '&infin;') : ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(number_value, fractionalDigits) + " " + pourcentage;

    if (explicit_sign) {
        if (number_value > 0) {
            res = '+' + res;
        }
    }

    return res;
};

let writeToPercentFilter = (value: string): number => {
    if (value == null) {
        return (null);
    }
    let result: number = parseFloat(value
        .replace("%", "")
        .replace(",", ".")
        .replace(/[^-0-9.]/g, ""));

    if (isNaN(result)) {
        return 0;
    }
    return result / 100.0;
};

export let percentFilter = FilterObj.createNew(
    readToPercentFilter,
    writeToPercentFilter
);

export let ARRONDI_TYPE_CEIL: number = 0;
export let ARRONDI_TYPE_FLOOR: number = 1;
export let ARRONDI_TYPE_ROUND: number = 2;


let writeToFixed = (value: string): number => {
    if (TypesHandler.getInstance().isNull(value)) {
        return null;
    }
    value = value.replace(",", ".");
    return value && value.length ? parseFloat(value) : 0;
};

let readToFixed = (
    value: number | string,
    fractionalDigits: number = 0,
    arrondi: boolean | number = false,
    arrondi_type: number = ARRONDI_TYPE_ROUND,
    onlyPositive: boolean = false,
    dot_decimal_marker: boolean = false
): string => {

    let result: string = null;

    if (!value || (fractionalDigits < 0)) {
        return TypesHandler.getInstance().isNumber(value) ? value.toString().replace(".", ",") : null;
    }

    if (onlyPositive && value < 0) {
        value = 0;
    }

    result = value.toString();

    if ((!arrondi) && (arrondi_type != ARRONDI_TYPE_ROUND) && (fractionalDigits !== null)) {
        // si pas de parametre d'arrondui, mais arrondi_type n'est pas round,
        // il faut appliquer une arrondi par defaut avec le arrondi_type selon le nbr de decimal
        arrondi = 1 / (10 ** fractionalDigits);
    }

    if (arrondi) {
        result = ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(
            parseFloat(result),
            arrondi,
            arrondi_type
        );
    }

    if (TypesHandler.getInstance().isNumber(fractionalDigits) && (fractionalDigits >= 0)) {
        result = ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(parseFloat(result), fractionalDigits);
    }

    return dot_decimal_marker ? result.replace(",", ".") : result.replace(".", ",");
};

export let toFixedFilter = FilterObj.createNew(
    readToFixed,
    writeToFixed
);

// let readToFixedCeilAndFloor = (value: number | string, fractionalDigits: number = 0, arrondi_type: number = null): string => {
//     if (!value && value !== 0) {
//         return null;
//     }

//     if (value == null || fractionalDigits == null) {
//         return null;
//     }

//     if (value == 0) {
//         return "0";
//     }

//     if (fractionalDigits < 0) {
//         return String(value);
//     }

//     let floorPositiveCeilNegative = (valeur: number): number => {
//         let valeurString: string;
//         valeurString = String(valeur * (10 ** fractionalDigits));
//         let res: number = parseInt(valeurString.substring(0, valeurString.length - 1));
//         res = res / (10 ** fractionalDigits);
//         return res;
//     };

//     let ceilPositiveFloorNegative = (valeur: number): number => {

//         let valeurString: string;
//         valeurString = String(valeur * (10 ** fractionalDigits));
//         let res: number = parseInt(valeurString.substring(0, valeurString.length - 1)) + 1;
//         res = res / (10 ** fractionalDigits);
//         return res;
//     };

//     let value_number: number = parseFloat(value.toString());

//     if (arrondi_type == ARRONDI_TYPE_FLOOR) {
//         if (value > 0) {
//             value = floorPositiveCeilNegative(value_number);
//         } else {
//             value = value_number * (-1);
//             value = ceilPositiveFloorNegative(value);
//             value = value * (-1);
//         }
//     }

//     if (arrondi_type == ARRONDI_TYPE_CEIL) {
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


let readToFixedCeilFilter = (value: number, fractionalDigits: number, arrondi: number | boolean = false, onlyPositive: boolean = false, dot_decimal_marker: boolean = false): string => {
    return readToFixed(value, fractionalDigits, arrondi, ARRONDI_TYPE_CEIL, onlyPositive, dot_decimal_marker);
};

export let toFixedCeilFilter = FilterObj.createNew(
    readToFixedCeilFilter,
    writeToFixed
);

let readToFixedFloorFilter = (value: number, fractionalDigits: number, arrondi: number | boolean = false, onlyPositive: boolean = false, dot_decimal_marker: boolean = false): string => {
    return readToFixed(value, fractionalDigits, arrondi, ARRONDI_TYPE_FLOOR, onlyPositive, dot_decimal_marker);
};

export let toFixedFloorFilter = FilterObj.createNew(
    readToFixedFloorFilter,
    writeToFixed
);

let readToHideZeroFilter = (value: number): string => {
    return !value ? "" : String(value);
};

let writeToHideZeroFilter = (value: string | number): number => {
    if (value == null) {
        return null;
    }

    return (value == "") ? 0 : parseFloat(value.toString());
};

export let hideZeroFilter = FilterObj.createNew(
    readToHideZeroFilter,
    writeToHideZeroFilter
);

let readToBooleanFilter = (value: boolean): string => {
    if (value == null) {
        return null;
    }
    return value ? "OUI" : "";
};

let writeToBooleanFilter = (value: string): boolean => {
    if (value == null) {
        return null;
    }
    return value == "OUI";

};
export let booleanFilter = FilterObj.createNew(
    readToBooleanFilter,
    writeToBooleanFilter
);


let readToPadHour = (value: number): string => {
    if (value == null) {
        return null;
    }
    return value < 10 ? "0" + value : "" + value;
};

let writeToPadHour = (value: string): number => {
    if (value == null) {
        return null;
    }
    return value && value.length ? parseFloat(value.replace(",", ".")) : 0;
};

export let padHourFilter = FilterObj.createNew(
    readToPadHour,
    writeToPadHour
);

let readToTruncateFilter = (value: string, nbChars: number): string => {
    if (nbChars == null) {
        return null;
    }
    return value ? value.substring(0, nbChars) : null;
};

let writeToTruncateFilter = (value: string): string => {
    return value;
};

export let truncateFilter = FilterObj.createNew(
    readToTruncateFilter,
    writeToTruncateFilter
);

let digitsRE = /(\d{3})(?=\d)/g;

let readToBignumFilter = (value: number | string): string => {
    if ((!value && value !== 0) || !isFinite(parseFloat(value.toString()))) {
        return null;
    }
    value = parseFloat(value.toString());
    let stringified = Math.abs(value).toFixed(2);
    let _int = stringified.slice(0, -3);
    let i = _int.length % 3;
    let head = i > 0 ? _int.slice(0, i) + (_int.length > 3 ? "," : "") : "";
    let _float = stringified.slice(-3);
    let sign = value < 0 ? "-" : "";
    return sign + head + _int.slice(i).replace(digitsRE, "$1,") + _float;
};

let writeToBignumFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    let result = ("" + value)
        //.replace(/,/g, ".")
        .replace(/[^-0-9.]/g, "");
    return value && value.length ? parseFloat(result) : 0;
};

export let bignumFilter = FilterObj.createNew(
    readToBignumFilter,
    writeToBignumFilter
);

let readTopositiveNumberFilter = (value: number | string): string => {
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

let writeTopositiveNumberFilter = (value: string): number => {
    if (value == null) {
        return null;
    }
    return parseFloat(value);
};

export let positiveNumberFilter = FilterObj.createNew(
    readTopositiveNumberFilter,
    writeTopositiveNumberFilter
);