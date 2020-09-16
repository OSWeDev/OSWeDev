import { expect } from 'chai';
import 'mocha';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import * as moment from 'moment';
import { duration } from 'moment';
import { ARRONDI_TYPE_FLOOR, ARRONDI_TYPE_CEIL, ARRONDI_TYPE_ROUND } from '../../../shared/tools/Filters';


describe('ModuleFormatDatesNombres', () => {


    it('formatMoment_to_YYYYMMDD_HHmmss', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("2013-02-08 23:00:00.000"))).to.equal('08/02/2013 23:00:00');
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("0"))).to.equal('01/01/2000 00:00:00');
    });

    it('formatYYYYMMDD_HHmmss_to_Moment', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment(null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('08/02/2013 23:00:00').format('YYYY-MM-DD')).to.deep.equal(moment("2013-02-08 23:00:00").format('YYYY-MM-DD'));
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('01/01/2000 00:00:00').format('YYYY-MM-DD')).to.equal(moment("0").format('YYYY-MM-DD'));

    });

    it('test: formatDuration_to_HoursAndMinutes', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(null)).to.equal(null);
        let durationTest: moment.Duration = moment.duration('23:00');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).to.equal(23);
        durationTest = moment.duration('23:30');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).to.equal(23.5);
        durationTest = moment.duration('0');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).to.equal(0);
        durationTest = moment.duration(5400000);
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).to.equal(1.5);
    });

    it('test: formatHoursAndMinutes_to_Duration', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(null)).to.equal(null);
        let durationTest: moment.Duration = moment.duration('23:00');
        expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(23)).to.deep.equal(durationTest);
        durationTest = moment.duration('23:30');
        expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(23.5)).to.deep.equal(durationTest);
        durationTest = moment.duration('0');
        expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(0)).to.deep.equal(durationTest);
        durationTest = moment.duration(5400000);
        expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(1.5)).to.deep.equal(durationTest);

    });

    it('test: formatDate_MonthDay', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(null)).to.equal(null);
        let dateTest = moment('2020-12-17');
        expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(dateTest)).to.equal("17/12");
        dateTest = moment("1995-11-17");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(dateTest)).to.equal("17/11");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay('2020-12-10')).to.equal("10/12");
    });

    it('test : formatDate_FullyearMonth', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(null)).to.equal(null);
        let dateTest = moment('2020-12-17');
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(dateTest)).to.equal("12/2020");
        dateTest = moment('1995-12-17');
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(dateTest)).to.equal("12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth("12/01/1995")).to.equal("12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth("12-01-1995")).to.equal("12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth('December 17, 1995 03:24:00')).to.equal("12/1995");

    });

    it('test : formatDate_YearMonth', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth(null)).to.equal(null);
        let dateTest = moment('1995-12-17');
        expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth(dateTest)).to.equal("12/95");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth("12/01/1995")).to.equal("12/95");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth("12-01-1995")).to.equal("12/95");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth('December 17, 1995 03:24:00')).to.equal("12/95");
    });

    it('test: formatDate_FullyearMonthDay', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(null)).to.equal(null);
        let dateTest = moment('1995-12-17');
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(dateTest)).to.equal("17/12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay("12/01/1995")).to.equal("01/12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay("12-01-1995")).to.equal("01/12/1995");
        expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay('December 17, 1995 03:24:00')).to.equal("17/12/1995");


    });

    it('test: getMomentFromFormatted_FullyearMonthDay', () => {
        expect(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(null)).equal(null);
        var momentTest = moment("1995-12-31").utc(true);
        expect(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay("31/12/1995").format('YYYY-MM-DD')).to.equal(momentTest.format('YYYY-MM-DD'));


    });


    it('test: formatNumber_sign', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(null)).equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(0)).equal("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22)).equal("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22.6)).equal("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22)).equal("-");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22.6)).equal("-");

    });

    it('test: formatNumber_nodecimal', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(0)).to.equal("0");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(-45.32)).to.equal("-45");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(1.32)).to.equal("1");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(10000.32)).to.equal("10 000");
    });

    it('test: formatNumber_n_decimals', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, 1)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12, null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 1)).to.equal("12,3");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 3)).to.equal("12,260");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.9, 0)).to.equal("13");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.8, 0)).to.equal("13");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.82, 1)).to.equal("12,8");
    });

    it('test: formatNumber_arrondi', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, null, null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, 1, 1)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, null, 1)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, 1, null)).to.equal(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.5, 1, ARRONDI_TYPE_ROUND)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.4, 1, ARRONDI_TYPE_ROUND)).to.equal("1");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(20000.2, 1, ARRONDI_TYPE_ROUND)).to.equal("20000");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, true, ARRONDI_TYPE_ROUND)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, true, ARRONDI_TYPE_ROUND)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.75, true, ARRONDI_TYPE_ROUND)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.7499999999, true, ARRONDI_TYPE_ROUND)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, 0.5, ARRONDI_TYPE_ROUND)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.5, ARRONDI_TYPE_ROUND)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.75, 0.5, ARRONDI_TYPE_ROUND)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.7499999999, 0.5, ARRONDI_TYPE_ROUND)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, 0.25, ARRONDI_TYPE_ROUND)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_ROUND)).to.equal("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_FLOOR)).to.equal("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_FLOOR)).to.equal("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_CEIL)).to.equal("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_CEIL)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_CEIL)).to.equal("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_CEIL)).to.equal("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, 0, ARRONDI_TYPE_CEIL)).to.equal("1");
    });
});