
import ConsoleHandler from '../../tools/ConsoleHandler';
import { ARRONDI_TYPE_CEIL, ARRONDI_TYPE_FLOOR, ARRONDI_TYPE_ROUND } from '../../tools/Filters';
import TypesHandler from '../../tools/TypesHandler';
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import moment from 'moment';
import Dates from './Dates/Dates';

export default class ModuleFormatDatesNombres extends Module {

    public static PARAM_NAME_date_format_month_date = 'date_format_month_date';
    public static PARAM_NAME_date_format_fullyear_month_date = 'date_format_fullyear_month_date';
    public static PARAM_NAME_date_format_fullyear_month_day_date = 'date_format_fullyear_month_day_date';
    public static PARAM_NAME_date_format_fullyear = 'date_format_fullyear';
    public static PARAM_NAME_nombre_separateur_1000 = 'nombre_separateur_1000';
    public static PARAM_NAME_nombre_separateur_decimal = 'nombre_separateur_decimal';

    public static FORMAT_HHmmss_ms: string = 'HH:mm:ss.SSS';
    public static FORMAT_HHmmss: string = 'HH:mm:ss';
    public static FORMAT_HHmm: string = 'HH:mm';
    public static FORMAT_HH: string = 'HH:';

    public static TRANSLATION_date_format_fullyear_month_day = 'YYYY-MM-DD';

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ModuleFormatDatesNombres {
        if (!ModuleFormatDatesNombres.instance) {
            ModuleFormatDatesNombres.instance = new ModuleFormatDatesNombres();
        }
        return ModuleFormatDatesNombres.instance;
    }

    public static get FORMAT_MMDD(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_month_date);
    }
    public static get FORMAT_YYYYMM(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date);
    }
    public static get FORMAT_YYYYMMDD(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date);
    }
    public static get FORMAT_YYYY(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear);
    }

    public static get FORMAT_YYYYMMDD_HHmmss_ms(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:mm:ss.SSS";
    }
    public static get FORMAT_YYYYMMDD_HHmmss(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:mm:ss";
    }
    public static get FORMAT_YYYYMMDD_HHmm(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:mm";
    }
    public static get FORMAT_YYYYMMDD_HH(): string {
        return ModuleFormatDatesNombres.getInstance().getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:";
    }

    private static instance: ModuleFormatDatesNombres = null;

    private constructor() {

        super("format_dates_nombres", "FormatDatesNombres");
        this.forceActivationOnInstallation();
    }

    // On peut avoir des Dates ou des strings en entrée des fonctions, on crée un traducteur assez flexible qui renvoie une date
    public getMomentFromDate(dateToConvert: moment.Moment | string | number): moment.Moment {
        if (!dateToConvert) {
            return null;
        }

        if (typeof dateToConvert === 'number') {
            return moment.unix(dateToConvert).utc();
        }

        return moment(dateToConvert).utc(true);
    }

    public formatMoment_to_YYYYMMDD_HHmmss_ms(date: moment.Moment): string {
        if (date == null) {
            return null;
        }

        return date.format(ModuleFormatDatesNombres.FORMAT_YYYYMMDD + " HH:mm:ss.SSS");
    }

    public formatMoment_to_YYYYMMDD_HHmmss(date: moment.Moment): string {
        if (date == null) {
            return null;
        }

        return date.format(ModuleFormatDatesNombres.FORMAT_YYYYMMDD + " HH:mm:ss");
    }

    public formatMoment_to_YYYYMMDD_HHmm(date: moment.Moment): string {
        if (date == null) {
            return null;
        }

        return date.format(ModuleFormatDatesNombres.FORMAT_YYYYMMDD + " HH:mm");
    }

    public formatMoment_to_YYYYMMDD_HH(date: moment.Moment): string {
        if (date == null) {
            return null;
        }

        return date.format(ModuleFormatDatesNombres.FORMAT_YYYYMMDD + " HH:");
    }

    public formatYYYYMMDD_HHmmss_to_Moment(date: string): moment.Moment {

        try {
            let res: moment.Moment = moment(date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD + " HH:mm:ss").utc(true);

            if (res.isValid()) {
                return res;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return null;
    }

    public formatDuration_to_HHmmss_ms(durationToFormat: moment.Duration): string {
        if (durationToFormat == null) {
            return null;
        }

        return moment().utc(true).startOf('day').add(durationToFormat).format('HH:mm:ss.SSS');
    }

    public formatDuration_to_HHmmss(durationToFormat: moment.Duration): string {
        if (durationToFormat == null) {
            return null;
        }

        return moment().utc(true).startOf('day').add(durationToFormat).format('HH:mm:ss');
    }

    public formatDuration_to_HHmm(durationToFormat: moment.Duration): string {
        if (durationToFormat == null) {
            return null;
        }

        return moment().utc(true).startOf('day').add(durationToFormat).format('HH:mm');
    }

    public formatDuration_to_HH(durationToFormat: moment.Duration): string {
        if (durationToFormat == null) {
            return null;
        }

        return moment().utc(true).startOf('day').add(durationToFormat).format('HH:');
    }

    // Formatter un moment en HoursAndMinutes pour la BDD
    public formatDuration_to_HoursAndMinutes(durationToFormat: moment.Duration): number {
        if (durationToFormat == null) {
            return null;
        }

        return durationToFormat.get('hours') + (durationToFormat.get('minutes') / 60);
    }

    // Formatter un HoursAndMinutes en moment depuis la BDD
    public formatHoursAndMinutes_to_Duration(hoursAndMinutesToFormat: number): moment.Duration {

        if (hoursAndMinutesToFormat == null) {
            return null;
        }

        let hours = Math.floor(hoursAndMinutesToFormat);
        let minutes = Math.round((hoursAndMinutesToFormat % 1) * 60);

        while (minutes >= 60) {
            hours++;
            minutes -= 60;
        }

        return moment.duration({
            hours: hours,
            minutes: minutes
        });
    }

    // Formatter une date de type 31/01
    public formatDate_MonthDay(dateToFormat: moment.Moment | string | number): string {
        if (dateToFormat == null) {
            return null;
        }

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        return momentToFormat.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_month_date));
    }

    // Formatter une date de type 01/2017
    public formatDate_FullyearMonth(dateToFormat: moment.Moment | string): string {

        if (dateToFormat == null) {
            return null;
        }

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        return momentToFormat.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date));
    }

    // Formatter une date de type 01/17
    public formatDate_YearMonth(dateToFormat: moment.Moment | string): string {

        if (dateToFormat == null) {
            return null;
        }

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        let format: string = this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date);
        if (format.match(/.*YYYY.*/i)) {
            return momentToFormat.format(format.replace(/YYYY/i, 'YY'));
        } else {
            return momentToFormat.format(format.replace(/Y/i, 'YY'));
        }
    }

    // Formatter une date de type 31/01/2017
    public formatDate_FullyearMonthDay(dateToFormat: moment.Moment | string | number): string {

        if (dateToFormat == null) {
            return null;
        }

        let momentToFormat = this.getMomentFromDate(dateToFormat);
        return momentToFormat.format(ModuleFormatDatesNombres.FORMAT_YYYYMMDD);
    }

    public formatDate_Fullyear(dateToFormat: number): string {
        if (dateToFormat == null) {
            return null;
        }
        return Dates.format(dateToFormat, ModuleFormatDatesNombres.FORMAT_YYYY);
    }

    public getMomentFromFormatted_FullyearMonthDay(dateToFormat: string): moment.Moment {
        if (dateToFormat == null) {
            return null;
        }

        return moment(dateToFormat, ModuleFormatDatesNombres.FORMAT_YYYYMMDD).utc(true);
    }

    public formatNumber_sign(numberToFormat: number): string {
        if (numberToFormat == null) {
            return (null);
        }

        let number = null;

        try {
            number = parseFloat(numberToFormat.toString());

            if (number < 0) {
                return "-";
            }
        } catch (e) {
            ConsoleHandler.error(e);
            return "";
        }
        return "";
    }

    // Formatter un nombre
    public formatNumber_nodecimal(numberToFormat: number): string {

        if (numberToFormat == null) {
            return null;
        }

        let number = null;
        let res = "";

        try {
            // js failover
            if (!TypesHandler.getInstance().isNumber(numberToFormat)) {
                numberToFormat = parseFloat((numberToFormat as any).toString());
            }
            number = Math.abs(numberToFormat);

            // On coupe après la virgule
            number = Math.round(number);

            if (number == Infinity) {
                return "∞";
            }

            // On sépare les milliers
            while (TypesHandler.getInstance().isNumber(number) && (number >= 1000)) {

                let thispart = (number % 1000);
                let thisparttxt = ((thispart < 100) ? "0" + ((thispart < 10) ? "0" + thispart : thispart) : "" + thispart);

                res = this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_1000) + thisparttxt + res;
                number = Math.floor(number / 1000);
            }

            res = number + res;
        } catch (e) {
            ConsoleHandler.error(e);
            return "NaN";
        }
        return this.formatNumber_sign(numberToFormat) + res;
    }



    public formatNumber_n_decimals(numberToFormat: number, n_decimals: number): string {

        let number = null;

        if (numberToFormat == null || n_decimals == null) {
            return null;
        }
        if ((!n_decimals) || (n_decimals < 0)) {
            return this.formatNumber_nodecimal(numberToFormat);
        }

        try {
            // js failover
            if (!TypesHandler.getInstance().isNumber(numberToFormat)) {
                numberToFormat = parseFloat((numberToFormat as any).toString());
            }

            number = Math.abs(numberToFormat);

            // On sépare les décimals du reste
            let entier = Math.floor(number);
            let decimals = number - entier;
            let tenth = Math.pow(10, n_decimals);
            decimals = Math.round(decimals * tenth);
            if (decimals >= tenth) {
                decimals -= tenth;
                entier++;
            }

            let dectxt: string = "";
            for (let i = n_decimals; i > 1; i--) {
                dectxt = dectxt + (decimals < Math.pow(10, i - 1) ? "0" : "");
            }
            dectxt += decimals;
            return this.formatNumber_sign(numberToFormat) + this.formatNumber_nodecimal(entier) + this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal) + dectxt;
        } catch (e) {
            ConsoleHandler.error(e);
        }

        return "NaN";
    }



    /**
     *
     * @param numberToFormat
     * @param arrondi
     */
    public formatNumber_arrondi(numberToFormat: number, arrondi: number | boolean, arrondi_type: number): string {

        if (numberToFormat == null || arrondi == null || arrondi_type == null) {
            return null;
        }

        let arrondiNumber: number = null;

        if (arrondi === true) {
            arrondiNumber = 0.5;
        } else if (typeof arrondi == "number") {
            arrondiNumber = arrondi;
        }
        if (arrondi == 0) {
            return numberToFormat.toString();
        }
        let numberRound = 0;

        switch (arrondi_type) {
            case ARRONDI_TYPE_CEIL:
                numberRound = Math.ceil(numberToFormat / arrondiNumber) * arrondiNumber;
                break;
            case ARRONDI_TYPE_FLOOR:
                numberRound = Math.floor(numberToFormat / arrondiNumber) * arrondiNumber;
                break;
            case ARRONDI_TYPE_ROUND:
                numberRound = Math.round(numberToFormat / arrondiNumber) * arrondiNumber;
                break;
        }

        let entier = numberRound > 0 ? Math.floor(numberRound) : Math.ceil(numberRound);
        let decimale = numberRound - entier;

        let res = entier + decimale;
        return '' + res;
    }

    /* istanbul ignore next: nothing to test here */
    public initialize() {
        this.fields = [
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_month_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 31/01)', true, true, 'DD/MM'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 01/2017)', true, true, 'MM/Y'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 31/01/2017)', true, true, 'DD/MM/Y'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 2017', true, true, 'YYYY'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_1000, ModuleTableField.FIELD_TYPE_string, 'Séparateur 10^3', false, true, ' '),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal, ModuleTableField.FIELD_TYPE_string, 'Séparateur décimal', true, true, ',')
        ];
        this.datatables = [];
    }
}