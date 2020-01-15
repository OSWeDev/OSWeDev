import * as moment from 'moment';
import { isNumber } from 'util';
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';

export default class ModuleFormatDatesNombres extends Module {

    public static PARAM_NAME_date_format_month_date = 'date_format_month_date';
    public static PARAM_NAME_date_format_fullyear_month_date = 'date_format_fullyear_month_date';
    public static PARAM_NAME_date_format_fullyear_month_day_date = 'date_format_fullyear_month_day_date';
    public static PARAM_NAME_nombre_separateur_1000 = 'nombre_separateur_1000';
    public static PARAM_NAME_nombre_separateur_decimal = 'nombre_separateur_decimal';

    public static getInstance(): ModuleFormatDatesNombres {
        if (!ModuleFormatDatesNombres.instance) {
            ModuleFormatDatesNombres.instance = new ModuleFormatDatesNombres();
        }
        return ModuleFormatDatesNombres.instance;
    }

    private static instance: ModuleFormatDatesNombres = null;

    private constructor() {

        super("format_dates_nombres", "FormatDatesNombres");
        this.forceActivationOnInstallation();
    }

    // On peut avoir des Dates ou des strings en entrée des fonctions, on crée un traducteur assez flexible qui renvoie une date
    public getMomentFromDate(dateToConvert) {

        return moment(dateToConvert);
    }

    public formatMoment_to_YYYYMMDD_HHmmss(date: moment.Moment): string {

        return date.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:mm:ss");
    }

    public formatYYYYMMDD_HHmmss_to_Moment(date: string): moment.Moment {

        try {
            let res: moment.Moment = moment(date, this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date) + " HH:mm:ss");

            if (res.isValid()) {
                return res;
            }
        } catch (error) {
        }
        return null;
    }

    // Formatter un moment en HoursAndMinutes pour la BDD
    public formatDuration_to_HoursAndMinutes(durationToFormat) {

        return durationToFormat.get('hours') + (durationToFormat.get('minutes') / 60);
    }

    // Formatter un HoursAndMinutes en moment depuis la BDD
    public formatHoursAndMinutes_to_Duration(hoursAndMinutesToFormat) {

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
    public formatDate_MonthDay(dateToFormat) {

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        return momentToFormat.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_month_date));
    }

    // Formatter une date de type 01/2017
    public formatDate_FullyearMonth(dateToFormat) {

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        return momentToFormat.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date));
    }

    // Formatter une date de type 01/2017
    public formatDate_YearMonth(dateToFormat) {

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        let format: string = this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date);
        if (format.match(/.*YYYY.*/i)) {
            return momentToFormat.format(format.replace(/YYYY/i, 'YY'));
        } else {
            return momentToFormat.format(format.replace(/Y/i, 'YY'));
        }
    }

    // Formatter une date de type 31/01/2017
    public formatDate_FullyearMonthDay(dateToFormat) {

        let momentToFormat = this.getMomentFromDate(dateToFormat);

        return momentToFormat.format(this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date));
    }

    public getMomentFromFormatted_FullyearMonthDay(dateToFormat) {

        return moment(dateToFormat, this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date));
    }

    public formatNumber_sign(numberToFormat) {

        let number = null;

        try {
            number = parseFloat(numberToFormat);

            if (number < 0) {
                return "-";
            }
        } catch (e) {
            return "";
        }
        return "";
    }

    // Formatter un nombre
    public formatNumber_nodecimal(numberToFormat: number): string {

        let number = null;
        let res = "";

        try {
            // js failover
            if (!isNumber(numberToFormat)) {
                numberToFormat = parseFloat((numberToFormat as any).toString());
            }
            number = Math.abs(numberToFormat);

            // On coupe après la virgule
            number = Math.round(number);

            if (number == Infinity) {
                return "∞";
            }

            // On sépare les milliers
            while (isNumber(number) && (number >= 1000)) {

                let thispart = (number % 1000);
                let thisparttxt = ((thispart < 100) ? "0" + ((thispart < 10) ? "0" + thispart : thispart) : "" + thispart);

                res = this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_1000) + thisparttxt + res;
                number = Math.floor(number / 1000);
            }

            res = number + res;
        } catch (e) {
            return "NaN";
        }
        return this.formatNumber_sign(numberToFormat) + res;
    }

    // // Formatter un nombre : 1 décimale
    // public formatNumber_1decimal(numberToFormat) {

    //     let number = null;

    //     try {
    //         number = Math.abs(parseFloat(numberToFormat));

    //         // On sépare les décimals du reste
    //         let entier = Math.floor(number);
    //         let decimals = number - entier;
    //         decimals = Math.round(decimals * 10);
    //         if (decimals >= 10) {
    //             decimals -= 10;
    //             entier++;
    //         }
    //         return this.formatNumber_sign(numberToFormat) + this.formatNumber_nodecimal(entier) + this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal) + decimals;
    //     } catch (e) {

    //     }

    //     return NaN;
    // }

    public formatNumber_n_decimals(numberToFormat: number, n_decimals: number): string {

        let number = null;

        if ((!n_decimals) || (n_decimals < 0)) {
            return this.formatNumber_nodecimal(numberToFormat);
        }

        try {
            // js failover
            if (!isNumber(numberToFormat)) {
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
        }

        return "NaN";
    }

    // // Formatter un nombre : 2 décimales
    // public formatNumber_2decimal(numberToFormat) {

    //     let number = null;

    //     try {
    //         number = Math.abs(parseFloat(numberToFormat));

    //         // On sépare les décimals du reste
    //         let entier = Math.floor(number);
    //         let decimals = number - entier;
    //         decimals = Math.round(decimals * 100);
    //         if (decimals >= 100) {
    //             decimals -= 100;
    //             entier++;
    //         }
    //         return this.formatNumber_sign(numberToFormat) + this.formatNumber_nodecimal(entier) + this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal) + (decimals < 10 ? "0" + decimals : decimals);
    //     } catch (e) {

    //     }

    //     return NaN;
    // }

    /**
     *
     * @param numberToFormat
     * @param arrondi
     */
    public formatNumber_arrondi(numberToFormat, arrondi): string {
        if (arrondi === true) {
            arrondi = 0.5;
        }

        let numberRound = Math.round(numberToFormat / arrondi) * arrondi;

        let entier = Math.floor(numberRound);
        let decimale = numberRound - entier;

        let res: string = "";
        res += this.formatNumber_sign(numberToFormat) + this.formatNumber_nodecimal(entier);
        if (decimale > 0) {
            res += this.getParamValue(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal) + decimale.toString().replace("0.", "");
        }
        return res;
    }

    public initialize() {
        this.fields = [
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_month_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 31/01)', true, true, 'DD/MM'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 01/2017)', true, true, 'MM/Y'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_date_format_fullyear_month_day_date, ModuleTableField.FIELD_TYPE_string, 'Format Date (ex: 31/01/2017)', true, true, 'DD/MM/Y'),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_1000, ModuleTableField.FIELD_TYPE_string, 'Séparateur 10^3', false, true, ' '),
            new ModuleTableField(ModuleFormatDatesNombres.PARAM_NAME_nombre_separateur_decimal, ModuleTableField.FIELD_TYPE_string, 'Séparateur décimal', true, true, ',')
        ];
        this.datatables = [];
    }
}