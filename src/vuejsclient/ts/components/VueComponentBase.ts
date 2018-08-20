import * as moment from "moment";
import { unitOfTime } from "moment";
import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleAjaxCache from "../../../shared/modules/AjaxCache/ModuleAjaxCache";
import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import LocaleManager from "../../../shared/tools/LocaleManager";
import * as screenfull from "screenfull";
import { Vue } from "vue-property-decorator";
import ModuleDataExport from "../../../shared/modules/DataExport/ModuleDataExport";
import VueAppController from "../../VueAppController";
import IDeclareVueComponent from "./IDeclareVueComponent";
import AppVuexStoreManager from "../store/AppVuexStoreManager";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import { ModuleDAOAction } from "./dao/store/DaoStore";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import Datatable from "./datatable/vos/Datatable";
import DatatableField from "./datatable/vos/DatatableField";
import SimpleDatatableField from "./datatable/vos/SimpleDatatableField";
import ManyToOneReferenceDatatableField from "./datatable/vos/ManyToOneReferenceDatatableField";
import OneToManyReferenceDatatableField from "./datatable/vos/OneToManyReferenceDatatableField";
import ManyToManyReferenceDatatableField from "./datatable/vos/ManyToManyReferenceDatatableField";
import ReferenceDatatableField from "./datatable/vos/ReferenceDatatableField";

// MONTHS MIXIN
let months = [
    "label.month.janvier",
    "label.month.fevrier",
    "label.month.mars",
    "label.month.avril",
    "label.month.mai",
    "label.month.juin",
    "label.month.juillet",
    "label.month.aout",
    "label.month.septembre",
    "label.month.octobre",
    "label.month.novembre",
    "label.month.decembre"
];

let days = [
    "label.day.dimanche",
    "label.day.lundi",
    "label.day.mardi",
    "label.day.mercredi",
    "label.day.jeudi",
    "label.day.vendredi",
    "label.day.samedi"
];

// FILTERS MIXIN
function FilterObj(read, write) {
    this.read = read;
    this.write = write;
}

let lang = LocaleManager.getInstance().getDefaultLocale();
function GetSeparateurParLangue() {
    if (!lang) {
        lang = LocaleManager.getInstance().getDefaultLocale();
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

let hourFilter = new FilterObj(
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
    value => {
        return value.toString().replace("h", ".");
    }
);
let planningCheckFilter = new FilterObj(
    value => {
        if (value == null) {
            return value;
        }

        return value == 1 ? "OUI" : "NON";
    },
    value => {
        return value == "OUI" ? 1 : -1;
    }
);
let alerteCheckFilter = new FilterObj(
    value => {
        if (value == null) {
            return value;
        }

        return value == 1 ? "ALERTE" : "";
    },
    value => {
        return value == "ALERTE" ? 1 : -1;
    }
);

let amountFilter = new FilterObj(
    function (value, fractionalDigits, k) {
        value = parseFloat(value);
        if (!isFinite(value) || (!value && value !== 0)) {
            return "";
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
            (!fractionalDigits || fractionalDigits == 1 || fractionalDigits == 2)
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

let percentFilter = new FilterObj(
    function (value, fractionalDigits, pts) {
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
            (!fractionalDigits || fractionalDigits == 1 || fractionalDigits == 2)
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

let toFixedFilter = new FilterObj(
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

let hideZeroFilter = new FilterObj(
    function (value) {
        return value == 0 ? "" : value;
    },
    function (value) {
        return value == "" ? 0 : value;
    }
);

let booleanFilter = new FilterObj(
    function (value) {
        return value ? "OUI" : "";
    },
    function (value) {
        return value == "OUI";
    }
);

let padHourFilter = new FilterObj(
    function (value, nbChars) {
        return value < 10 ? "0" + value : "" + value;
    },
    function (value) {
        return value && value.length ? parseFloat(value) : 0;
    }
);

let truncateFilter = new FilterObj(
    function (value, nbChars) {
        return value ? value.substring(0, nbChars) : null;
    },
    function (value) {
        return value;
    }
);

let digitsRE = /(\d{3})(?=\d)/g;
let bignumFilter = new FilterObj(
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

let hourAndMinutesFilter = new FilterObj(
    function (value) {
        let hours = Math.floor(value);
        let minutes = Math.round((value - hours) * 60);
        let minutesTxt = minutes.toString();

        if (minutes < 10) {
            minutesTxt = "0" + minutesTxt;
        }

        return hours + ":" + minutesTxt;
    },
    function (value) {
        if (!value) {
            return 0;
        }

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

export function FiltersHandler() {
    this.filter_amount = false;
    this.filter_amount_n = undefined;
    this.filter_amount_k = undefined;
    this.filter_percent = false;
    this.filter_percent_n = undefined;
    this.filter_percent_pts = undefined;
    this.filter_toFixed = false;
    this.filter_toFixed_n = undefined;
    this.filter_hideZero = false;
    this.filter_bignum = false;
    this.filter_truncate = false;
    this.filter_truncate_n = undefined;
    this.filter_boolean = false;
    this.filter_padHour = false;
    this.filter_padHour_n = undefined;
    this.filter_hour = false;
    this.filter_hour_arrondi = false;
    this.filter_hour_negative = false;
    this.filter_hour_positive_sign = false;
    this.filter_hour_formatted = false;
    this.filter_hour_arrondi_minutes = false;
    this.filter_planningCheck = false;
    this.filter_alerteCheck = false;
    this.filter_hourAndMinutesFilter = false;

    this.setAmountFilter = function (active = true, n = undefined, k = undefined) {
        this.filter_amount = active;
        this.filter_amount_n = n;
        this.filter_amount_k = k;
        return this;
    };
    this.setPercentFilter = function (
        active = true,
        n = undefined,
        pts = undefined
    ) {
        this.filter_percent = active;
        this.filter_percent_n = n;
        this.filter_percent_pts = pts;
        return this;
    };
    this.setToFixedFilter = function (active = true, n = undefined) {
        this.filter_toFixed = active;
        this.filter_toFixed_n = n;
        return this;
    };
    this.setHideZeroFilter = function (active = true) {
        this.filter_hideZero = active;
        return this;
    };
    this.setBigNumFilter = function (active = true, n = undefined) {
        this.filter_bignum = active;
        return this;
    };
    this.setTruncateFilter = function (active = true, n = undefined) {
        this.filter_truncate = active;
        this.filter_truncate_n = n;
        return this;
    };
    this.setBooleanFilter = function (active = true) {
        this.filter_boolean = active;
        return this;
    };
    this.setPadHourFilter = function (active = true, n = undefined) {
        this.filter_padHour = active;
        this.filter_padHour_n = n;
        return this;
    };
    this.setHourFilter = function (
        active = true,
        arrondi = false,
        negative = false,
        positiveSign = false,
        formatted = false,
        arrondi_minutes = false
    ) {
        this.filter_hour = active;
        this.filter_hour_arrondi = arrondi;
        this.filter_hour_negative = negative;
        this.filter_hour_positive_sign = positiveSign;
        this.filter_hour_formatted = formatted;
        this.filter_hour_arrondi_minutes = arrondi_minutes;
        return this;
    };
    this.setPlanningCheckFilter = function (active = true) {
        this.filter_planningCheck = active;
        return this;
    };
    this.setAlerteCheckFilter = function (active = true) {
        this.filter_alerteCheck = active;
        return this;
    };
    this.setHourAndMinutesFilter = function (active = true) {
        this.filter_hourAndMinutesFilter = active;
        return this;
    };

    this.applyWrite = function (value) {
        if (this.filter_amount) {
            value = amountFilter.write(value);
        }
        if (this.filter_percent) {
            value = percentFilter.write(value);
        }
        if (this.filter_toFixed) {
            value = toFixedFilter.write(value);
        }
        if (this.filter_hideZero) {
            value = hideZeroFilter.write(value);
        }
        if (this.filter_boolean) {
            value = booleanFilter.write(value);
        }
        if (this.filter_padHour) {
            value = padHourFilter.write(value);
        }
        if (this.filter_truncate) {
            value = truncateFilter.write(value);
        }
        if (this.filter_bignum) {
            value = bignumFilter.write(value);
        }
        if (this.filter_hour) {
            value = hourFilter.write(value);
        }
        if (this.filter_planningCheck) {
            value = planningCheckFilter.write(value);
        }
        if (this.filter_alerteCheck) {
            value = alerteCheckFilter.write(value);
        }
        if (this.filter_hourAndMinutesFilter) {
            value = hourAndMinutesFilter.write(value);
        }
        return value;
    };

    this.applyRead = function (value) {
        if (this.filter_amount) {
            value = amountFilter.read(
                value,
                this.filter_amount_n,
                this.filter_amount_k
            );
        }
        if (this.filter_percent) {
            value = percentFilter.read(
                value,
                this.filter_percent_n,
                this.filter_percent_pts
            );
        }
        if (this.filter_toFixed) {
            value = toFixedFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_hideZero) {
            value = hideZeroFilter.read(value);
        }
        if (this.filter_boolean) {
            value = booleanFilter.read(value);
        }
        if (this.filter_padHour) {
            value = padHourFilter.read(value, this.filter_padHour_n);
        }
        if (this.filter_truncate) {
            value = truncateFilter.read(value, this.filter_truncate_n);
        }
        if (this.filter_bignum) {
            value = bignumFilter.read(value);
        }
        if (this.filter_hour) {
            value = hourFilter.read(
                value,
                this.filter_hour_arrondi,
                this.filter_hour_negative,
                this.filter_hour_positive_sign,
                this.filter_hour_formatted,
                this.filter_hour_arrondi_minutes
            );
        }
        if (this.filter_planningCheck) {
            value = planningCheckFilter.read(value);
        }
        if (this.filter_alerteCheck) {
            value = alerteCheckFilter.read(value);
        }
        if (this.filter_hourAndMinutesFilter) {
            value = hourAndMinutesFilter.read(value);
        }
        return value;
    };
}

export default abstract class VueComponentBase extends Vue
    implements IDeclareVueComponent {
    public $snotify: any;

    @ModuleDAOAction
    public storeDatas: (
        infos: { API_TYPE_ID: string; vos: IDistantVOBase[] }
    ) => void;

    protected data_user = VueAppController.getInstance().data_user;

    // FILTERS MIXIN
    protected const_filters = {
        amount: amountFilter,
        percent: percentFilter,
        toFixed: toFixedFilter,
        hideZero: hideZeroFilter,
        boolean: booleanFilter,
        padHour: padHourFilter,
        truncate: truncateFilter,
        bignum: bignumFilter,
        hour: hourFilter,
        planningCheck: planningCheckFilter,
        alerteCheck: alerteCheckFilter,
        hourAndMinutes: hourAndMinutesFilter
    };

    // LOADING MIXIN
    protected isLoading = true;
    protected loadingProgression: number = 0;
    protected nbLoadingSteps: number = 5;

    protected access_table: {
        [group_name: string]: { [policy_name: string]: boolean };
    } = {};

    protected fullscreen = screenfull.isFullscreen;

    protected toggleFullscreen() {
        screenfull.toggle();
    }

    protected onFullscreenChange() {
        this.fullscreen = screenfull.isFullscreen;
    }

    // SNOTIFY
    get snotify() {
        return this.$snotify;
    }

    // Handle Loading of stored data

    protected loadDatasFromDatatable(
        datatable: Datatable<IDistantVOBase>
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        res.push(
            (async () => {
                let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                    IDistantVOBase
                    >(datatable.API_TYPE_ID);
                self.storeDatas({
                    API_TYPE_ID: datatable.API_TYPE_ID,
                    vos: vos
                });
            })()
        );

        for (let i in datatable.fields) {
            let field = datatable.fields[i];

            res = res.concat(this.loadDatasFromDatatableField(field));
        }

        return res;
    }

    protected loadDatasFromDatatableField(
        load_from_datatable_field: DatatableField<any, any>
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (load_from_datatable_field.type == SimpleDatatableField.FIELD_TYPE) {
            return res;
        }

        if (
            load_from_datatable_field.type ==
            ManyToOneReferenceDatatableField.FIELD_TYPE ||
            load_from_datatable_field.type ==
            OneToManyReferenceDatatableField.FIELD_TYPE ||
            load_from_datatable_field.type ==
            ManyToManyReferenceDatatableField.FIELD_TYPE
        ) {
            let reference: ReferenceDatatableField<
                any
                > = load_from_datatable_field as ReferenceDatatableField<any>;
            res.push(
                (async () => {
                    let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                        IDistantVOBase
                        >(reference.targetModuleTable.vo_type);
                    self.storeDatas({
                        API_TYPE_ID: reference.targetModuleTable.vo_type,
                        vos: vos
                    });
                })()
            );

            for (let i in reference.sortedTargetFields) {
                res = res.concat(
                    this.loadDatasFromDatatableField(reference.sortedTargetFields[i])
                );
            }
        }

        if (
            load_from_datatable_field.type ==
            ManyToManyReferenceDatatableField.FIELD_TYPE
        ) {
            let reference: ManyToManyReferenceDatatableField<
                any,
                any
                > = load_from_datatable_field as ManyToManyReferenceDatatableField<
                any,
                any
                >;

            res.push(
                (async () => {
                    let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                        IDistantVOBase
                        >(reference.interModuleTable.vo_type);
                    self.storeDatas({
                        API_TYPE_ID: reference.targetModuleTable.vo_type,
                        vos: vos
                    });
                })()
            );
        }

        return res;
    }

    // Permet de savoir si un module est actif ou pas
    protected moduleIsActive(nom_module) {
        let module: Module = ModulesManager.getInstance().getModuleByNameAndRole(
            nom_module,
            Module.SharedModuleRoleName
        ) as Module;

        return module && module.actif;
    }

    // Le mixin du module format_dates_nombres
    protected formatDate_MonthDay(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatDate_Fullyear(dateToFormat) {
        if (!dateToFormat) {
            return "";
        }
        return moment(dateToFormat).format("YYYY");
    }

    protected formatDate_FullyearMonth(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatDate_FullyearMonthDay(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(
                dateToFormat
            );
        }
        return dateToFormat;
    }

    protected formatNumber_nodecimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(
                numberToFormat
            );
        }
        return numberToFormat;
    }

    protected formatNumber_1decimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_1decimal(
                numberToFormat
            );
        }
        return numberToFormat;
    }

    protected formatNumber_2decimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_2decimal(
                numberToFormat
            );
        }
        return numberToFormat;
    }

    protected invalidateCache() {
        ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(
            new RegExp(".*", "i")
        );
    }

    // DATE MIXIN
    protected parseDateWithFormat(date, format = "d-m-y") {
        var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        var month =
            date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1;
        var year = date.getFullYear();

        return format
            .replace("d", day)
            .replace("m", month)
            .replace("y", year);
    }

    protected parseDateFR(date, separateur = "-") {
        return (
            (date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1) +
            separateur +
            date.getFullYear()
        );
    }
    protected parseDateEN(date) {
        return (
            date.getFullYear() +
            "-" +
            (date.getMonth() + 1 < 10
                ? "0" + (date.getMonth() + 1)
                : date.getMonth() + 1) +
            "-" +
            (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
        );
    }

    // FILTERS MIXIN
    protected newFilter() {
        return new FiltersHandler();
    }

    // LOADING MIXIN
    protected startLoading() {
        this.isLoading = true;
        this.loadingProgression = 0;
    }
    protected nextLoadingStep() {
        if (this.loadingProgression < 0) {
            this.loadingProgression = 0;
        }
        if (this.loadingProgression >= 100) {
            console.debug("this.loadingProgression > 100");
        }
        this.loadingProgression =
            this.loadingProgression + 100 / this.nbLoadingSteps;
        if (this.loadingProgression > 100) {
            this.loadingProgression = 100;
        }
    }
    protected stopLoading() {
        this.isLoading = false;
        this.loadingProgression = 100;
    }

    // MOMENT MIXIN
    protected getNbWeekInMonth(month) {
        let month_tmp = moment(month);
        let res = moment(
            moment(month_tmp)
                .endOf("month")
                .startOf("isoweek" as unitOfTime.StartOf)
        );
        return (
            res.diff(
                moment(month_tmp)
                    .startOf("month")
                    .startOf("isoweek" as unitOfTime.StartOf),
                "weeks"
            ) + 1
        );
    }
    protected getWeekOfMonth(month) {
        if (!month) {
            return null;
        }

        let weeks = [];
        let week = moment(month)
            .startOf("month")
            .startOf("isoweek" as unitOfTime.StartOf);
        let format_date = "YYYY-MM-DD";

        weeks.push({
            date: week.format(format_date),
            iso: week.isoWeek()
        });

        for (var i = 1; i < this.getNbWeekInMonth(month); i++) {
            week.add(1, "week");
            weeks.push({
                date: week.format(format_date),
                iso: week.isoWeek()
            });
        }

        return weeks;
    }

    // MONTHS MIXIN
    protected getMonthName(month_number) {
        return months[month_number];
    }
    protected getMonthInTexte(month) {
        return this.getMonthName(moment(month).get("month"));
    }
    protected getJourInText(jour_iso) {
        return days[jour_iso];
    }

    // MOMENT for .pug usage
    protected moment(...args) {
        return moment(...args);
    }

    // SMALL MIXINS
    protected filterMultiple(x, xs, strict?) {
        return (xs.length == 0 && !strict) || xs.indexOf(x) != -1;
    }

    // TRANSLATION MIXIN
    protected t(txt, params = {}): string {
        if (!txt) {
            return txt;
        }
        let res = LocaleManager.getInstance().i18n.t(txt, params);
        return res ? res.toString() : null;
    }

    protected label(txt, params = {}): string {
        let res = LocaleManager.getInstance().i18n.t(
            txt + DefaultTranslation.DEFAULT_LABEL_EXTENSION,
            params
        );
        return res ? res.toString() : null;
    }

    //EDITION MIXIN
    get editionMode() {
        return AppVuexStoreManager.getInstance().appVuexStore.state.editionMode;
    }

    protected activateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("activateEdition");
    }
    protected deactivateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("deactivateEdition");
    }

    get isPrintable() {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.printable;
    }
    get isExportableToXLSX() {
        return AppVuexStoreManager.getInstance().appVuexStore.getters
            .exportableToXLSX;
    }

    protected async export_to_xlsx() {
        if (this.isExportableToXLSX) {
            this.startLoading();
            await ModuleDataExport.getInstance().exportDataToXLSX(
                await AppVuexStoreManager.getInstance().appVuexStore.getters.hook_export_data_to_XLSX()
            );
            this.stopLoading();
        }
    }

    protected async updateAccessTable(group_name: string, policy_name: string) {
        let granted: boolean = ModuleAccessPolicy.getInstance().actif
            ? await ModuleAccessPolicy.getInstance().checkAccess(
                group_name,
                policy_name
            )
            : true;
        Vue.set(this.access_table[group_name], policy_name, granted);
    }

    protected hasAccessTo(group_name: string, policy_name: string) {
        // On doit passer par une table locale qui sera mise à jour si besoin en async
        if (!this.access_table[group_name]) {
            Vue.set(this.access_table, group_name, {});
        }
        if (!this.access_table[group_name][policy_name]) {
            Vue.set(this.access_table[group_name], policy_name, false);
            this.updateAccessTable(group_name, policy_name);
        }

        return this.access_table[group_name][policy_name];
    }
}
