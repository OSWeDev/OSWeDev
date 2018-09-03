import * as moment from 'moment';
import ModuleFormatDatesNombres from '../modules/FormatDatesNombres/ModuleFormatDatesNombres';
import LocaleManager from './LocaleManager';

let lang = LocaleManager.getInstance().getDefaultLocale();
function GetSeparateurParLangue() {
    if (!lang) {
        lang = LocaleManager.getInstance().getDefaultLocale();
    }
    if (!lang) {
        lang = "fr";
    }
    let separateur = [];

    separateur["millier"] = ",";
    separateur["decimal"] = ".";
    if (lang.toLowerCase() == "de") {
        separateur["millier"] = ".";
        separateur["decimal"] = ",";
    }

    return separateur;
}

// FILTERS MIXIN
function FilterObj(read, write) {
    this.read = read;
    this.write = write;
}

export let hourFilter = new FilterObj(
    function (
        value,
        arrondi: boolean,
        negativeValue,
        positiveSign,
        formatted,
        arrondiMinutes
    ) {
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

        let prefixSign = positiveSign && value > 0 ? "+" : "";

        if (value < 0) {
            prefixSign = "-";
        }

        return (
            prefixSign +
            heuresTxt +
            "h" +
            (minutes == 0 ? "" : minutes < 10 ? "0" + minutes : minutes)
        );
    },
    (value) => {

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
    }
);

export let planningCheckFilter = new FilterObj(
    (value) => {
        if (value == null) {
            return value;
        }

        return value == 1 ? "OUI" : "NON";
    },
    (value) => {
        return value == "OUI" ? 1 : -1;
    }
);

export let alerteCheckFilter = new FilterObj(
    (value) => {
        if (value == null) {
            return value;
        }

        return value == 1 ? "ALERTE" : "";
    },
    (value) => {
        return value == "ALERTE" ? 1 : -1;
    }
);

export let amountFilter = new FilterObj(
    function (value, fractionalDigits, k) {

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
        let separateur = GetSeparateurParLangue();
        let currency = "€";

        if (typeof k !== "undefined") {
            let currency = "k€";
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

        if (
            ModuleFormatDatesNombres.getInstance().actif &&
            ((!fractionalDigits) || (fractionalDigits == 1) || (fractionalDigits == 2))
        ) {
            if (!fractionalDigits) {
                return (
                    currency +
                    ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(value)
                );
            }
            if (fractionalDigits == 1) {
                return (
                    currency +
                    ModuleFormatDatesNombres.getInstance().formatNumber_1decimal(value)
                );
            }
            if (fractionalDigits == 2) {
                return (
                    currency +
                    ModuleFormatDatesNombres.getInstance().formatNumber_2decimal(value)
                );
            }
        } else {
            let sign = value < 0 ? "-" : "";
            let res = "";
            let i = 0;

            while (_int.length > i + 3) {
                if (i > 0) {
                    res = "," + _int.slice(-i - 3, -i) + res;
                } else {
                    res = "," + _int.slice(-i - 3) + res;
                }
                i += 3;
            }

            if (i > 0) {
                res = _int.slice(0, -i) + res;
            } else {
                res = _int + res;
            }

            let _float = stringified.slice(decalageComa + 1);

            return currency + sign + res + (decalageComa ? "." + _float : "");
        }
    },
    function (value) {

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
    }
);

export let percentFilter = new FilterObj(
    function (value, fractionalDigits, pts = false) {
        if (value == undefined) {
            return value;
        }

        value *= 100;
        let pourcentage;

        if (typeof pts != "undefined" && pts == true) {
            pourcentage = "pts";
        } else {
            pourcentage = "%";
        }

        if (!isFinite(value) || isNaN(value)) {
            return "";
        }

        if (
            ModuleFormatDatesNombres.getInstance().actif &&
            ((!fractionalDigits) || (fractionalDigits == 1) || (fractionalDigits == 2))
        ) {
            if (!fractionalDigits) {
                return (
                    ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(value) +
                    " " +
                    pourcentage
                );
            }
            if (fractionalDigits == 1) {
                return (
                    ModuleFormatDatesNombres.getInstance().formatNumber_1decimal(value) +
                    " " +
                    pourcentage
                );
            }
            if (fractionalDigits == 2) {
                return (
                    ModuleFormatDatesNombres.getInstance().formatNumber_2decimal(value) +
                    " " +
                    pourcentage
                );
            }
        } else {
            if (typeof fractionalDigits !== "undefined") {
                value = Number(value).toFixed(fractionalDigits);
                // value = Math.round(value * Math.pow(10, fractionalDigits)) / Math.pow(10, fractionalDigits);
            }
            return value + " " + pourcentage;
        }
        let separateur = GetSeparateurParLangue();
        let value_render = value.replace(".", separateur["decimal"]);

        return !isFinite(value) || isNaN(value)
            ? ""
            : value_render + " " + pourcentage;
    },
    function (value) {
        let result = value
            .replace("%", "")
            .replace(",", ".")
            .replace(/[^-0-9.]/g, "");
        result = parseFloat(result);

        if (isNaN(result)) {
            return 0;
        }
        return result / 100.0;
    }
);

export let toFixedFilter = new FilterObj(
    function (value, fractionalDigits) {
        if (!value) {
            return value;
        }

        if (
            ModuleFormatDatesNombres.getInstance().actif &&
            (!fractionalDigits || fractionalDigits == 1 || fractionalDigits == 2)
        ) {
            if (!fractionalDigits) {
                return ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(
                    value
                );
            }
            if (fractionalDigits == 1) {
                return ModuleFormatDatesNombres.getInstance().formatNumber_1decimal(
                    value
                );
            }
            if (fractionalDigits == 2) {
                return ModuleFormatDatesNombres.getInstance().formatNumber_2decimal(
                    value
                );
            }
        } else {
            let value_fixed = Number(value).toFixed(fractionalDigits);

            // On récupère le séparateur en fonction de la langue
            let separateur = GetSeparateurParLangue();
            return value_fixed.replace(".", separateur["decimal"]);
        }
    },
    function (value) {
        value = value.replace(",", "");
        return value && value.length ? parseFloat(value) : 0;
    }
);

export let hideZeroFilter = new FilterObj(
    function (value) {
        return value == 0 ? "" : value;
    },
    function (value) {
        return value == "" ? 0 : value;
    }
);

export let booleanFilter = new FilterObj(
    function (value) {
        return value ? "OUI" : "";
    },
    function (value) {
        return value == "OUI";
    }
);

export let padHourFilter = new FilterObj(
    function (value, nbChars) {
        return value < 10 ? "0" + value : "" + value;
    },
    function (value) {
        return value && value.length ? parseFloat(value) : 0;
    }
);

export let truncateFilter = new FilterObj(
    function (value, nbChars) {
        return value ? value.substring(0, nbChars) : null;
    },
    function (value) {
        return value;
    }
);

let digitsRE = /(\d{3})(?=\d)/g;
export let bignumFilter = new FilterObj(
    function (value) {
        value = parseFloat(value);
        if (!isFinite(value) || (!value && value !== 0)) {
            return "";
        }
        let stringified = Math.abs(value).toFixed(2);
        let _int = stringified.slice(0, -3);
        let i = _int.length % 3;
        let head = i > 0 ? _int.slice(0, i) + (_int.length > 3 ? "," : "") : "";
        let _float = stringified.slice(-3);
        let sign = value < 0 ? "-" : "";
        return sign + head + _int.slice(i).replace(digitsRE, "$1,") + _float;
    },
    function (value) {
        return value && value.length ? parseFloat(value) : 0;
    }
);

export let hourAndMinutesFilter = new FilterObj(
    function (value) {

        if ((value == null) || (typeof value === "undefined")) {
            return null;
        }

        if (!value) {
            return "0:00";
        }

        value = parseFloat(value.toString());

        let hours = Math.floor(value);
        let minutes = Math.round((value - hours) * 60);

        while (minutes >= 60) {
            minutes -= 60;
            hours++;
        }

        let minutesTxt = minutes.toString();

        if (minutes < 10) {
            minutesTxt = "0" + minutesTxt;
        }

        return hours + ":" + minutesTxt;
    },
    function (value) {

        if ((value == null) || (typeof value === "undefined")) {
            return null;
        }

        if (!value) {
            return 0;
        }

        value = value.toString();

        if (value.search(/:/) == -1) {
            return parseFloat(value);
        }

        if (!value.match(/^[0-9]{1,2}:[0-9]{2}$/)) {
            let trygethours = value.split(":")[0];
            let res = parseInt(trygethours);

            if (isNaN(res)) {
                return 0;
            }

            return res;
        }

        let splitted = value.split(":");
        let hours = parseInt(splitted[0]);
        let minutes = parseInt(splitted[1]);

        if (isNaN(hours) || isNaN(minutes)) {
            return 0;
        }

        return hours + minutes / 60;
    }
);