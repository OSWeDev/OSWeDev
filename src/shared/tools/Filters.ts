import * as moment from 'moment';
import ModuleFormatDatesNombres from '../modules/FormatDatesNombres/ModuleFormatDatesNombres';
import TypesHandler from './TypesHandler';

// FILTERS MIXIN
function FilterObj(read, write) {
    this.read = read;
    this.write = write;
}

let readToHourFilter = (value, arrondi: boolean, negativeValue, positiveSign, formatted, arrondiMinutes) => {
    if (value == null || typeof value == "undefined") {
        return value;
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
    let duration = moment.duration(Math.abs(value * 1000 * 60 * 60));
    let heures = Math.floor(duration.asHours());
    let minutes = Math.round(duration.asMinutes() - heures * 60);

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

let writeToHourFilter = (value) => {

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

export let hourFilter = new FilterObj(
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

export let planningCheckFilter = new FilterObj(
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

export let alerteCheckFilter = new FilterObj(
    readToAlerteCheckFilter,
    writeToAlerteCheckFilter
);

let readToAmountFilter = function (value, fractionalDigits, k): string {

    if ((value == null) || (typeof value === "undefined")) {
        return null;
    }

    value = parseFloat(value);
    if (!isFinite(value) || (!value && value !== 0)) {
        return null;
    }
    let stringified;
    let decalageComa;
    let _int;

    // On récupère le séparateur en fonction de la langue
    let currency = "€";

    if (typeof k !== "undefined") {
        currency = "k€";
        value = value / 1000;
    }

    if (typeof fractionalDigits !== "undefined") {
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

let writeToAmountFilter = function (value: string): number {

    if ((value == null) || (typeof value === "undefined")) {
        return null;
    }

    let currency = "€";
    let result = ("" + value)
        .replace(currency, "")
        .replace(/,/g, ".")
        .replace(/[^-0-9.]/g, "");

    let res = parseFloat(result);
    if (isNaN(res)) {
        return 0;
    }
    return res;
};

export let amountFilter = new FilterObj(

    readToAmountFilter,
    writeToAmountFilter
);

/**
 * @param evol_from_prct Renvoie 2,2% au lieu de 102.2% pour indiquer une évolution plutôt qu'un rapport simple entre 2 éléments par exemple
 * @param explicit_sign Renvoie +2,2% au lieu de 2,2% pour indiquer le signe de façon explicit même quand il est positif
 */

let readToPercentFilter = (value: number, fractionalDigits: number, pts: boolean = false, explicit_sign: boolean = false, evol_from_prct: boolean = false, treat_999_as_infinite: boolean = true) => {
    if (value == undefined) {
        return value;
    }

    if (!isFinite(value) || isNaN(value)) {
        return null;
    }

    let returns_infinity: boolean = (treat_999_as_infinite && value >= 999) || (treat_999_as_infinite && value <= -999);

    if ((!!evol_from_prct) && (!returns_infinity)) {
        value -= 1;
    }

    value *= 100;
    let pourcentage;

    if (typeof pts != "undefined" && pts == true) {
        pourcentage = "pts";
    } else {
        pourcentage = "%";
    }

    let res = returns_infinity ? ((value < 0) ? '-&infin;' : '&infin;') : ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(value, fractionalDigits) + " " + pourcentage;

    if (explicit_sign) {
        if (value > 0) {
            res = '+' + res;
        }
    }

    return res;
};

let writeToPercentFilter = function (value): number {
    if (value == null) {
        return (null);
    }
    let result = value
        .replace("%", "")
        .replace(",", ".")
        .replace(/[^-0-9.]/g, "");
    result = parseFloat(result);

    if (isNaN(result)) {
        return 0;
    }
    return result / 100.0;
};

export let percentFilter = new FilterObj(
    readToPercentFilter,
    writeToPercentFilter
);

export let ARRONDI_TYPE_CEIL: number = 0;
export let ARRONDI_TYPE_FLOOR: number = 1;
export let ARRONDI_TYPE_ROUND: number = 2;

let readToFixedBase = (value, fractionalDigits, arrondi = false, arrondi_type: number = ARRONDI_TYPE_ROUND): string => {
    if (!value && value !== 0) {
        return value;
    }

    if (value == null) {
        return null;
    }

    if (value == 0) {
        return "0";
    }

    let floorPositiveCeilNegative = (valeur): number => {
        valeur = String(valeur * (10 ** fractionalDigits));
        valeur = parseInt(valeur.substring(0, valeur.length - 1));
        valeur = valeur / (10 ** fractionalDigits);
        return valeur;
    };

    let ceilPositiveFloorNegative = (valeur): number => {

        valeur = String(valeur * (10 ** fractionalDigits));
        valeur = parseInt(valeur.substring(0, valeur.length - 1)) + 1;
        valeur = valeur / (10 ** fractionalDigits);
        return valeur;
    };

    if (arrondi) {
        if (arrondi_type == ARRONDI_TYPE_FLOOR) {
            if (value > 0) {
                value = floorPositiveCeilNegative(value);
            } else {
                value = value * (-1);
                value = ceilPositiveFloorNegative(value);
                value = value * (-1);
            }
        }

        if (arrondi_type == ARRONDI_TYPE_CEIL) {
            if (value > 0) {
                value = ceilPositiveFloorNegative(value);
            } else {
                value = value * (-1);
                value = floorPositiveCeilNegative(value);
                value = value * (-1);
            }
        }
    }

    if (TypesHandler.getInstance().isNumber(fractionalDigits) && fractionalDigits >= 0) {
        value = ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(value, fractionalDigits, arrondi_type);
    }

    return String(value).replace(".", ",");
};

let writeToFixed = (value) => {
    if (TypesHandler.getInstance().isNull(value)) {
        return null;
    }
    value = value.replace(",", ".");
    return value && value.length ? parseFloat(value) : 0;
};

let readToFixed = (value, fractionalDigits, arrondi = false): string => {
    return readToFixedBase(value, fractionalDigits, arrondi, ARRONDI_TYPE_ROUND);
};

export let toFixedFilter = new FilterObj(
    readToFixed,
    writeToFixed
);

let readToFixedCeilFilter = (value, fractionalDigits, arrondi = true): string => {
    return readToFixedBase(value, fractionalDigits, true, ARRONDI_TYPE_CEIL);
};

export let toFixedCeilFilter = new FilterObj(
    readToFixedCeilFilter,
    writeToFixed
);

let readToFixedFloorFilter = function (value, fractionalDigits, arrondi = true): string {
    return readToFixedBase(value, fractionalDigits, true, ARRONDI_TYPE_FLOOR);
};

export let toFixedFloorFilter = new FilterObj(
    readToFixedFloorFilter,
    writeToFixed
);

let readToHideZeroFilter = (value: number) => {
    return value == 0 ? "" : value;
};

let writeToHideZeroFilter = (value: string) => {
    return value == "" ? 0 : value;
};

export let hideZeroFilter = new FilterObj(
    readToHideZeroFilter,
    writeToHideZeroFilter
);

let readToBooleanFilter = function (value: boolean): string {
    if (value == null) {
        return null;
    }
    return value ? "OUI" : "";
};

let writeToBooleanFilter = function (value: string): boolean {
    if (value == null) {
        return null;
    }
    return value == "OUI";

};
export let booleanFilter = new FilterObj(
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
    return value && value.length ? parseFloat(value) : 0;
};

export let padHourFilter = new FilterObj(
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

export let truncateFilter = new FilterObj(
    readToTruncateFilter,
    writeToTruncateFilter
);

let digitsRE = /(\d{3})(?=\d)/g;

let readToBignumFilter = (value): string => {
    value = parseFloat(value);
    if (!isFinite(value) || (!value && value !== 0)) {
        return null;
    }
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

export let bignumFilter = new FilterObj(
    readToBignumFilter,
    writeToBignumFilter
);

