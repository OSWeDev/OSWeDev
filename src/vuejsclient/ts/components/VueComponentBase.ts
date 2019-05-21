import * as moment from "moment";
import { unitOfTime, Moment } from "moment";
import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleAjaxCache from "../../../shared/modules/AjaxCache/ModuleAjaxCache";
import ModuleDataExport from "../../../shared/modules/DataExport/ModuleDataExport";
import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import LocaleManager from "../../../shared/tools/LocaleManager";
import * as screenfull from "screenfull";
import { Vue } from "vue-property-decorator";
import { alerteCheckFilter, amountFilter, bignumFilter, booleanFilter, hideZeroFilter, hourAndMinutesFilter, hourFilter, padHourFilter, percentFilter, planningCheckFilter, toFixedFilter, truncateFilter } from '../../../shared/tools/Filters';
import VueAppController from "../../VueAppController";
import AppVuexStoreManager from "../store/AppVuexStoreManager";
import IDeclareVueComponent from "./IDeclareVueComponent";
import DateHandler from '../../../shared/tools/DateHandler';
import CRUDHandler from '../../../shared/tools/CRUDHandler';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ISimpleNumberVarData from '../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';

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

export default class VueComponentBase extends Vue
    implements IDeclareVueComponent {

    public static const_filters = {
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

    public $snotify: any;

    public segment_type_rolling_year_month_start: number = TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
    public segment_type_year: number = TimeSegment.TYPE_YEAR;
    public segment_type_month: number = TimeSegment.TYPE_MONTH;
    public segment_type_week: number = TimeSegment.TYPE_WEEK;
    public segment_type_day: number = TimeSegment.TYPE_DAY;

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

    protected fullscreen = screenfull.isFullscreen;

    // TRANSLATION MIXIN
    public t(txt, params = {}): string {
        if (!txt) {
            return txt;
        }

        if (VueAppController.getInstance().has_access_to_onpage_translation) {
            AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/registerPageTranslation', {
                translation_code: txt,
                missing: false
            });
        }

        return LocaleManager.getInstance().t(txt, params);
    }

    public label(txt, params = {}): string {
        return this.t(
            txt + DefaultTranslation.DEFAULT_LABEL_EXTENSION,
            params
        );
    }

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


    protected getCRUDLink(API_TYPE_ID: string): string {
        return CRUDHandler.getCRUDLink(API_TYPE_ID);
    }

    protected getCRUDCreateLink(API_TYPE_ID: string): string {
        return CRUDHandler.getCreateLink(API_TYPE_ID);
    }

    protected getCRUDUpdateLink(API_TYPE_ID: string, vo_id: number): string {
        return CRUDHandler.getUpdateLink(API_TYPE_ID, vo_id);
    }

    protected getCRUDDeleteLink(API_TYPE_ID: string, vo_id: number): string {
        return CRUDHandler.getDeleteLink(API_TYPE_ID, vo_id);
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
            return ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(
                numberToFormat,
                1
            );
        }
        return numberToFormat;
    }

    protected formatNumber_2decimal(numberToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(
                numberToFormat,
                2
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

    //EDITION MIXIN
    get editionMode() {
        return AppVuexStoreManager.getInstance().appVuexStore.state.editionMode;
    }

    protected varif_simplenumber_boolean_condition(value: ISimpleNumberVarData) {
        return (!!value) && (!!value.value);
    }

    protected simple_var_div(values: ISimpleNumberVarData[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        if (!values[1].value) {
            return null;
        }

        return values[0].value / values[1].value;
    }

    protected simple_var_add(values: ISimpleNumberVarData[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        return values[0].value + values[1].value;
    }

    protected simple_var_sub(values: ISimpleNumberVarData[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        return values[0].value - values[1].value;
    }

    protected simple_var_times(values: ISimpleNumberVarData[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        return values[0].value * values[1].value;
    }

    protected simple_var_evolution(datas: ISimpleNumberVarData[]) {

        try {

            let a: number = datas[0].value;
            let b: number = datas[1].value;

            return b ? (a - b) / b : null;
        } catch (error) {
        }
        return null;
    }

    protected activateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("activateEdition");
    }
    protected deactivateEdition() {
        AppVuexStoreManager.getInstance().appVuexStore.commit("deactivateEdition");
    }

    get isPrintable(): boolean {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.printable;
    }
    get onprint(): () => void {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.onprint;
    }
    get isExportableToXLSX(): boolean {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.exportableToXLSX;
    }
    get printComponent(): any {
        return AppVuexStoreManager.getInstance().appVuexStore.getters.print_component;
    }

    protected async export_to_xlsx() {
        if (this.isExportableToXLSX) {
            // this.startLoading();
            await ModuleDataExport.getInstance().exportDataToXLSX(
                await AppVuexStoreManager.getInstance().appVuexStore.getters.hook_export_data_to_XLSX()
            );
            // this.stopLoading();
        }
    }

    protected humanizeDurationTo(date: Date): string {
        return DateHandler.getInstance().humanizeDurationTo(moment(date));
    }

    protected routeExists(url: string): boolean {

        let resolved = this.$router.resolve(url);
        if (resolved.route.name != '404') {
            return true;
        }
        return false;
    }
}
