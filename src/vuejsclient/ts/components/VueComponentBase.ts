
import moment from "moment";
import screenfull from "screenfull";
import { Vue } from "vue-property-decorator";
import ContextFilterVO, { filter } from "../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import SortByVO from "../../../shared/modules/ContextFilter/vos/SortByVO";
import ModuleDataExport from "../../../shared/modules/DataExport/ModuleDataExport";
import ExportDataToXLSXParamVO from "../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO";
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import CRUDHandler from '../../../shared/tools/CRUDHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import { alerteCheckFilter, amountFilter, bignumFilter, booleanFilter, hideZeroFilter, hourFilter, padHourFilter, percentFilter, planningCheckFilter, toFixedCeilFilter, toFixedFilter, toFixedFloorFilter, truncateFilter, tstzFilter } from '../../../shared/tools/Filters';
import LocaleManager from "../../../shared/tools/LocaleManager";
import { all_promises } from "../../../shared/tools/PromiseTools";
import VocusHandler from '../../../shared/tools/VocusHandler';
import VueAppController from "../../VueAppController";
import AjaxCacheClientController from "../modules/AjaxCache/AjaxCacheClientController";
import VOEventRegistrationKey from "../modules/PushData/VOEventRegistrationKey";
import VOEventRegistrationsHandler from "../modules/PushData/VOEventRegistrationsHandler";
import AppVuexStoreManager from "../store/AppVuexStoreManager";
import IDeclareVueComponent from "./IDeclareVueComponent";
import IDistantVOBase from "../../../shared/modules/IDistantVOBase";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";

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
    this.setToFixedCeilFilter = function (active = true, n = undefined) {
        this.filter_toFixedCeil = active;
        this.filter_toFixed_n = n;
        return this;
    };
    this.setToFixedFloorFilter = function (active = true, n = undefined) {
        this.filter_toFixedFloor = active;
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
        if (this.filter_toFixedCeil) {
            value = toFixedCeilFilter.write(value);
        }
        if (this.filter_toFixedFloor) {
            value = toFixedFloorFilter.write(value);
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
        if (this.filter_toFixedCeil) {
            value = toFixedCeilFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_toFixedFloor) {
            value = toFixedFloorFilter.read(value, this.filter_toFixed_n);
        }
        if (this.filter_hideZero) {
            value = hideZeroFilter.read(value);
        }
        if (this.filter_boolean) {
            value = booleanFilter.read(value);
        }
        if (this.filter_padHour) {
            value = padHourFilter.read(value);
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
        return value;
    };
}

export default class VueComponentBase extends Vue
    implements IDeclareVueComponent {

    public static const_filters = {
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

    public $snotify: any;

    public segment_type_rolling_year_month_start: number = TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
    public segment_type_year: number = TimeSegment.TYPE_YEAR;
    public segment_type_month: number = TimeSegment.TYPE_MONTH;
    public segment_type_week: number = TimeSegment.TYPE_WEEK;
    public segment_type_day: number = TimeSegment.TYPE_DAY;

    protected data_user = VueAppController.getInstance().data_user;

    /**
     * On ajoute les fonctions d'auto-synchro CRUD via io rooms
     */
    protected vo_events_registration_keys_by_room_id: { [room_id: string]: VOEventRegistrationKey[] } = {};

    // FILTERS MIXIN
    protected const_filters = {
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
            VueAppController.getInstance().throttled_register_translation({
                translation_code: txt,
                missing: false
            });
        }

        return LocaleManager.getInstance().t(txt, params);
    }

    public label(txt, params = {}): string {
        if (!txt) {
            return txt;
        }
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

    protected getVocusLink(API_TYPE_ID: string, vo_id: number): string {
        return VocusHandler.getVocusLink(API_TYPE_ID, vo_id);
    }

    protected getCRUDLink(API_TYPE_ID: string): string {
        return CRUDHandler.getCRUDLink(API_TYPE_ID);
    }

    protected getCRUDCreateLink(API_TYPE_ID: string, embed: boolean): string {
        return CRUDHandler.getCreateLink(API_TYPE_ID, embed);
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

    protected formatDate_Fullyear(dateToFormat) {
        if (ModuleFormatDatesNombres.getInstance().actif) {
            return ModuleFormatDatesNombres.getInstance().formatDate_Fullyear(
                dateToFormat
            );
        }
    }

    protected format_date(date: number, format: string): string {
        if (date == null) {
            return null;
        }
        return Dates.format(date, format);
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
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(
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
    protected getNbWeekInMonth(month: number) {
        let month_tmp = month;
        let res = Dates.startOf(Dates.endOf(month_tmp, TimeSegment.TYPE_MONTH), TimeSegment.TYPE_WEEK);
        return Dates.diff(
            res,
            Dates.startOf(Dates.startOf(month_tmp, TimeSegment.TYPE_MONTH), TimeSegment.TYPE_WEEK),
            TimeSegment.TYPE_WEEK) + 1;
    }

    // MONTHS MIXIN
    protected getMonthName(month_number) {
        return months[month_number];
    }
    protected getMonthInTexte(month: string) {
        return this.getMonthName(moment(month).utc(true).get("month"));
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

    protected varif_simplenumber_boolean_condition(value: VarDataBaseVO) {
        return (!!value) && (!!value.value);
    }

    protected simple_var_div(values: VarDataBaseVO[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        if (!values[1].value) {
            return null;
        }

        return values[0].value / values[1].value;
    }

    protected simple_var_add(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res += value.value;
            }
        }

        return res;
    }

    protected simple_var_mean(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        let length: number = 0;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res += value.value;
            }
            length++;
        }

        if (!length) {
            return null;
        }

        return res / length;
    }

    protected simple_var_supp_zero(var_data: VarDataBaseVO): boolean {
        if ((!var_data) || (var_data.value == null) || (typeof var_data.value == 'undefined')) {
            return false;
        }

        return var_data.value > 0;
    }

    protected simple_var_supp_egal_zero(var_data: VarDataBaseVO): boolean {
        if ((!var_data) || (var_data.value == null) || (typeof var_data.value == 'undefined')) {
            return false;
        }

        return var_data.value >= 0;
    }

    protected simple_var_sub(values: VarDataBaseVO[]): number {
        if ((!values) || (!values[0]) || (!values[1])) {
            return null;
        }

        return values[0].value - values[1].value;
    }

    protected simple_var_times(values: VarDataBaseVO[]): number {
        if ((!values) || (!values.length)) {
            return null;
        }

        let res: number = null;
        for (let i in values) {
            let value = values[i];

            if ((!value) || (value.value == null) || (typeof value.value == 'undefined') || (isNaN(1 + value.value))) {
                continue;
            }

            if (res == null) {
                res = value.value;
            } else {
                res *= value.value;
            }
        }

        return res;
    }

    protected simple_var_evolution(datas: VarDataBaseVO[]) {

        try {

            let a: number = datas[0].value;
            let b: number = datas[1].value;

            return b ? (a - b) / b : null;
        } catch (error) {
        }
        return null;
    }

    protected math_round(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.round(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected math_floor(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.floor(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected math_ceil(value: number, decimals: number = 0, convert_to_prct: boolean = false) {

        try {

            if ((value == null) || (typeof value === 'undefined') || (isNaN(value))) {
                return null;
            }

            let decimals_coef = Math.pow(10, decimals);
            let res = value * decimals_coef;

            return Math.ceil(res) / decimals_coef;
        } catch (error) {
        }
        return null;
    }

    protected addClassName(className: string, el) {
        if (!el.className) {
            el.className = className;
            return;
        }

        let classes = el.className.split(' ');
        if ((!classes) || (!classes.length)) {
            el.className = className;
            return;
        }

        let found = false;
        for (let i in classes) {
            if (classes[i] == className) {
                found = true;
                return;
            }
        }

        if (!found) {
            el.className += ' ' + className;
        }
    }

    protected removeClassName(className: string, el) {
        if (!el.className) {
            return;
        }

        let classes = el.className.split(' ');
        let res = null;
        for (let i in classes) {

            if (classes[i] == className) {
                continue;
            }

            res = (res ? res + ' ' + classes[i] : classes[i]);
        }
        el.className = (res ? res : '');
    }

    protected on_every_update_green_if_supp_zero(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-success', el);

        let className = (simple_value >= 1) ? 'text-success' : '';

        this.addClassName(className, el);
    }

    protected on_every_update_simple_number_sign_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value > 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    protected on_every_update_simple_revert_number_sign_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value < 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    /**
     * Same as on_every_update_simple_number_sign_coloration_handler but revolves around 1 instead of 0. Used for prcts for example where 100% is the middle value
     * @param varData
     * @param el
     * @param binding
     * @param vnode
     */
    protected on_every_update_simple_number_1_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;
        simple_value--;

        this.removeClassName('text-danger', el);
        this.removeClassName('text-success', el);
        this.removeClassName('text-warning', el);

        let className = (!!simple_value) ?
            ['text-danger', 'text-success'][simple_value > 0 ? 1 : 0] : 'text-warning';

        this.addClassName(className, el);
    }

    protected on_every_update_simple_prct_supp_egal_100_coloration_handler(varData: VarDataBaseVO, el, binding, vnode) {
        let simple_value = (!!varData) ? ((varData as VarDataBaseVO).value) : null;

        this.removeClassName('text-success', el);

        if ((!!simple_value) && (simple_value > 1)) {
            this.addClassName('text-success', el);
        }
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
            let param: ExportDataToXLSXParamVO = await AppVuexStoreManager.getInstance().appVuexStore.getters.hook_export_data_to_XLSX();

            if (!!param) {

                await ModuleDataExport.getInstance().exportDataToXLSX(
                    param.filename,
                    param.datas,
                    param.ordered_column_list,
                    param.column_labels,
                    param.api_type_id,
                    param.is_secured,
                    param.file_access_policy_name
                );
            }
            // this.stopLoading();
        }
    }

    protected humanizeDurationTo(date: Date): string {
        return DateHandler.getInstance().humanizeDurationTo(moment(date).utc(true).unix());
    }

    protected routeExists(url: string): boolean {
        if (!url) {
            return false;
        }

        let resolved = this['$router'].resolve(url);
        if (resolved.route.name != '404') {
            return true;
        }
        return false;
    }

    protected async unregister_room_id_vo_event_callbacks(room_id: string) {
        let promises = [];
        for (let j in this.vo_events_registration_keys_by_room_id[room_id]) {
            let vo_event_registration_key = this.vo_events_registration_keys_by_room_id[room_id][j];

            promises.push(VOEventRegistrationsHandler.unregister_vo_event_callback(vo_event_registration_key));
        }
        await all_promises(promises);
        this.vo_events_registration_keys_by_room_id = {};
    }

    protected async unregister_all_vo_event_callbacks() {
        let promises = [];
        for (let i in this.vo_events_registration_keys_by_room_id) {
            promises.push(this.unregister_room_id_vo_event_callbacks(i));
        }
        await all_promises(promises);
        this.vo_events_registration_keys_by_room_id = {};
    }

    protected handle_created_vo_event_callback(list_name: string, sort_function: (a, b) => number, created_vo: IDistantVOBase, map_name: string = null) {
        if (map_name) {
            if (!this[map_name][list_name]) {
                this[map_name][list_name] = [];
            }
        } else {
            if (!this[list_name]) {
                this[list_name] = [];
            }
        }

        let list = map_name ? this[map_name][list_name] : this[list_name];

        let index = list.findIndex((vo) => vo.id == created_vo.id);
        if (index < 0) {

            let insert_index = list.length;
            for (let i in list) {
                if (sort_function(list[i], created_vo) > 0) {
                    insert_index = parseInt(i);
                }
            }
            list.splice(insert_index, 0, created_vo);
        }
    }

    /**
     * Permet de surveiller les mises à jour d'éléments de type API_TYPE_ID et de les stocker dans la liste list_name
     * ATTENTION : Ce système nécessite plusieurs configuration :
     *             - Cette fonction qui doit être appelée là où on veut entamer l'init de la liste,
     *             - Le hook de destruction du composant pour unregister les callbacks : beforeDestroy() => await this.unregister_all_vo_event_callbacks()
     * Attention, on doit bien arriver ici avec l'idée qu'on va vider la liste qui va se remplir quand on reçoit les réponses des apis.
     * @param API_TYPE_ID L'API_TYPE_ID à surveiller
     * @param list_name la liste dans laquelle on stocke les éléments à jour correspondants au filtrage
     * @param simple_filters_on_api_type_id les filtres à appliquer. Ne sont gérés que les filtres simples directement sur l'API_TYPE_ID à surveiller. Donc si on veut récupérer des éléments liés, on passe par la liaison N/1 pour le moment
     * @param simple_sorts_by_on_api_type_id les étapes du sort à appliquer. Ne sont gérés que les sorts simples directement sur l'API_TYPE_ID à surveiller.
     * @param map_name si fourni, alors au lieu de stocker dans this[list_name], on stocke dans this[map_name][list_name]
     */
    protected async register_vo_updates_on_list(
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id: ContextFilterVO[] = [],
        simple_sorts_by_on_api_type_id: SortByVO[] = [],
        map_name: string = null
    ) {

        this.assert_compatibility_for_register_vo_list_updates(API_TYPE_ID, list_name, simple_filters_on_api_type_id, simple_sorts_by_on_api_type_id);

        if (map_name) {
            if (!this[map_name]) {
                this[map_name] = {};
            }
            this[map_name][list_name] = [];
        } else {
            this[list_name] = [];
        }
        let sort_function: (a, b) => number = this.get_sort_function_for_register_vo_updates(simple_sorts_by_on_api_type_id);

        let room_vo = this.get_room_vo_for_register_vo_updates(API_TYPE_ID, simple_filters_on_api_type_id);
        let room_id = JSON.stringify(room_vo);

        await this.unregister_room_id_vo_event_callbacks(room_id);
        this.vo_events_registration_keys_by_room_id[room_id] = [];

        let promises = [];

        promises.push((async () => {
            let vos = await query(API_TYPE_ID)
                .add_filters(simple_filters_on_api_type_id)
                .set_sorts(simple_sorts_by_on_api_type_id)
                .select_vos();

            for (let i in vos) {
                let vo = vos[i];
                this.handle_created_vo_event_callback(list_name, sort_function, vo, map_name);
            }
        })());

        promises.push((async () => {
            let vo_event_registration_key = await VOEventRegistrationsHandler.register_vo_create_callback(
                room_vo,
                room_id,
                (created_vo: IDistantVOBase) => {
                    this.handle_created_vo_event_callback(list_name, sort_function, created_vo, map_name);
                }
            );
            this.vo_events_registration_keys_by_room_id[room_id].push(vo_event_registration_key);
        })());

        promises.push((async () => {
            let vo_event_registration_key = await VOEventRegistrationsHandler.register_vo_delete_callback(
                room_vo,
                room_id,
                async (deleted_vo: IDistantVOBase) => {

                    let list = map_name ? (this[map_name] ? this[map_name][list_name] : null) : this[list_name];

                    let index = list ? list.findIndex((vo) => vo.id == deleted_vo.id) : null;
                    if (index >= 0) {
                        list.splice(index, 1);
                    }
                }
            );
            this.vo_events_registration_keys_by_room_id[room_id].push(vo_event_registration_key);
        })());

        promises.push((async () => {
            let vo_event_registration_key = await VOEventRegistrationsHandler.register_vo_update_callback(
                room_vo,
                room_id,
                async (pre_update_vo: IDistantVOBase, post_update_vo: IDistantVOBase) => {
                    let list = map_name ? (this[map_name] ? this[map_name][list_name] : null) : this[list_name];

                    let index = list.findIndex((vo) => vo.id == post_update_vo.id);
                    if (index >= 0) {
                        list.splice(index, 1, post_update_vo);
                    }
                }
            );
            this.vo_events_registration_keys_by_room_id[room_id].push(vo_event_registration_key);
        })());

        await all_promises(promises);
    }

    /**
     * Permet de surveiller les mises à jour d'un vo de type API_TYPE_ID et dont l'id est passé en param et de le mettre à jour dans le vo_name
     * ATTENTION : Ce système nécessite plusieurs configuration :
     *             - Cette fonction qui doit être appelée là où on veut entamer l'init de la liste,
     *             - Le hook de destruction du composant pour unregister les callbacks : beforeDestroy() => await this.unregister_all_vo_event_callbacks()
     * Attention, on doit bien arriver ici avec l'idée qu'on va vider la liste qui va se remplir quand on reçoit les réponses des apis.
     * @param API_TYPE_ID L'API_TYPE_ID à surveiller
     * @param vo_id l'id du vo à surveiller
     * @param field_name le nom du vo dans lequel on stocke l'élément à jour correspondant au filtrage
     * @param vo_has_been_preloaded si on a déjà préchargé le vo - on ne le supprime pas du coup par défaut et on ne le recharge pas non plus
     */
    protected async register_single_vo_updates(
        API_TYPE_ID: string,
        vo_id: number,
        field_name: string,
        vo_has_been_preloaded: boolean = true
    ) {

        this.assert_compatibility_for_register_single_vo_updates(API_TYPE_ID, vo_id, field_name);

        if (!vo_has_been_preloaded) {
            this[field_name] = null;
        }

        let simple_filters_on_api_type_id = [
            filter(API_TYPE_ID).by_id(vo_id)
        ];
        let room_vo = this.get_room_vo_for_register_vo_updates(API_TYPE_ID, simple_filters_on_api_type_id);
        let room_id = JSON.stringify(room_vo);

        await this.unregister_room_id_vo_event_callbacks(room_id);
        this.vo_events_registration_keys_by_room_id[room_id] = [];

        let promises = [];

        if (!vo_has_been_preloaded) {
            promises.push((async () => {
                let vo = await query(API_TYPE_ID)
                    .add_filters(simple_filters_on_api_type_id)
                    .select_vo();

                this[field_name] = vo;
            })());
        }

        promises.push((async () => {
            let vo_event_registration_key = await VOEventRegistrationsHandler.register_vo_delete_callback(
                room_vo,
                room_id,
                async (deleted_vo: IDistantVOBase) => {
                    this[field_name] = null;
                }
            );
            this.vo_events_registration_keys_by_room_id[room_id].push(vo_event_registration_key);
        })());

        promises.push((async () => {
            let vo_event_registration_key = await VOEventRegistrationsHandler.register_vo_update_callback(
                room_vo,
                room_id,
                async (pre_update_vo: IDistantVOBase, post_update_vo: IDistantVOBase) => {
                    this[field_name] = post_update_vo;
                }
            );
            this.vo_events_registration_keys_by_room_id[room_id].push(vo_event_registration_key);
        })());

        await all_promises(promises);
    }


    private assert_compatibility_for_register_vo_list_updates(
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id: ContextFilterVO[] = [],
        simple_sorts_by_on_api_type_id: SortByVO[] = []
    ) {
        if (!API_TYPE_ID) {
            throw new Error('API_TYPE_ID is mandatory');
        }

        if (!list_name) {
            throw new Error('list_name is mandatory');
        }

        for (let i in simple_filters_on_api_type_id) {
            if (simple_filters_on_api_type_id[i].vo_type != API_TYPE_ID) {
                throw new Error('simple_filters_on_api_type_id must be on API_TYPE_ID');
            }

            if ((simple_filters_on_api_type_id[i].filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL) &&
                (simple_filters_on_api_type_id[i].filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY)) {
                throw new Error('simple_filters_on_api_type_id filter_type Not implemented');
            }

            if (simple_filters_on_api_type_id[i].param_numeric == null) {
                throw new Error('simple_filters_on_api_type_id only param_numeric is supported right now');
            }
        }

        for (let i in simple_sorts_by_on_api_type_id) {
            if (simple_sorts_by_on_api_type_id[i].vo_type != API_TYPE_ID) {
                throw new Error('simple_sorts_by_on_api_type_id must be on API_TYPE_ID');
            }
        }
    }

    private assert_compatibility_for_register_single_vo_updates(
        API_TYPE_ID: string,
        vo_id: number,
        field_name: string
    ) {
        if (!API_TYPE_ID) {
            throw new Error('API_TYPE_ID is mandatory');
        }

        if (!field_name) {
            throw new Error('field_name is mandatory');
        }

        if (!vo_id) {
            throw new Error('vo_id is mandatory');
        }
    }


    private get_sort_function_for_register_vo_updates(simple_sorts_by_on_api_type_id: SortByVO[]): (a, b) => number {
        let sort_function = (a, b) => {
            if (!simple_sorts_by_on_api_type_id) {
                return a.id - b.id;
            }

            for (let i in simple_sorts_by_on_api_type_id) {
                let sort_by = simple_sorts_by_on_api_type_id[i];

                let compare_a = a[sort_by.field_id];
                let compare_b = b[sort_by.field_id];

                if (!sort_by.sort_asc) {
                    let tmp = compare_a;
                    compare_a = compare_b;
                    compare_b = tmp;
                }

                if (compare_a == compare_b) {
                    continue;
                }

                if (compare_a > compare_b) {
                    return 1;
                }

                return -1;
            }

            return 0;
        };

        return sort_function;
    }

    private get_room_vo_for_register_vo_updates(API_TYPE_ID: string, simple_filters_on_api_type_id: ContextFilterVO[] = []): any {
        let room_vo = {
            _type: API_TYPE_ID
        };
        for (let i in simple_filters_on_api_type_id) {
            let simple_filter_on_api_type_id = simple_filters_on_api_type_id[i];
            room_vo[simple_filter_on_api_type_id.field_id] = simple_filter_on_api_type_id.param_numeric;
        }
        return room_vo;
    }
}
