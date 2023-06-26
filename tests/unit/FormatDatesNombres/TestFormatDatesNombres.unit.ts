import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import ModuleFormatDatesNombres from '../../../src/shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';


import { ARRONDI_TYPE_FLOOR, ARRONDI_TYPE_CEIL, ARRONDI_TYPE_ROUND } from '../../../src/shared/tools/Filters';
import moment from 'moment';



test('ModuleFormatDatesNombres:getMomentFromDate', () => {
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromDate(null)).toStrictEqual(null);
    let expected = moment("19-12-20").utc(true);
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromDate("19-12-20")).toStrictEqual(expected);

    expected = moment("19:12:20").utc(true);
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromDate("19:12:20")).toStrictEqual(expected);

    expected = moment("'01/01/2000 00:00:00'").utc(true);
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromDate("'01/01/2000 00:00:00'")).toStrictEqual(expected);

    expected = moment("01/01/2000 00:00:00").utc(true);
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromDate("01/01/2000 00:00:00")).toStrictEqual(expected);
});


test('ModuleFormatDatesNombres:formatMoment_to_YYYYMMDD_HHmmss', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("2013-02-08 23:00:00.000"))).toStrictEqual('08/02/2013 23:00:00');
    expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("0"))).toStrictEqual('01/01/2000 00:00:00');
});

test('ModuleFormatDatesNombres:formatYYYYMMDD_HHmmss_to_Moment', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment(null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('08/02/2013 23:00:00').format('YYYY-MM-DD')).toStrictEqual(moment("2013-02-08 23:00:00").format('YYYY-MM-DD'));
    expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('01/01/2000 00:00:00').format('YYYY-MM-DD')).toStrictEqual(moment("0").format('YYYY-MM-DD'));

});

test('ModuleFormatDatesNombres:test: formatDuration_to_HoursAndMinutes', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(null)).toStrictEqual(null);
    let durationTest: moment.Duration = moment.duration('23:00');
    expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(23);
    durationTest = moment.duration('23:30');
    expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(23.5);
    durationTest = moment.duration('0');
    expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(0);
    durationTest = moment.duration(5400000);
    expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(1.5);
});

test('ModuleFormatDatesNombres:test: formatHoursAndMinutes_to_Duration', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(null)).toStrictEqual(null);
    let durationTest: moment.Duration = moment.duration('23:00');
    expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(23)).toStrictEqual(durationTest);
    durationTest = moment.duration('23:30');
    expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(23.5)).toStrictEqual(durationTest);
    durationTest = moment.duration('0');
    expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(0)).toStrictEqual(durationTest);
    durationTest = moment.duration(5400000);
    expect(ModuleFormatDatesNombres.getInstance().formatHoursAndMinutes_to_Duration(1.5)).toStrictEqual(durationTest);

});

test('ModuleFormatDatesNombres:test: formatDate_MonthDay', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(null)).toStrictEqual(null);
    let dateTest = moment('2020-12-17');
    expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(dateTest)).toStrictEqual("17/12");
    dateTest = moment("1995-11-17");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay(dateTest)).toStrictEqual("17/11");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_MonthDay('2020-12-10')).toStrictEqual("10/12");
});

test('ModuleFormatDatesNombres:test : formatDate_FullyearMonth', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(null)).toStrictEqual(null);
    let dateTest = moment('2020-12-17');
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(dateTest)).toStrictEqual("12/2020");
    dateTest = moment('1995-12-17');
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(dateTest)).toStrictEqual("12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth("12/01/1995")).toStrictEqual("12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth("12-01-1995")).toStrictEqual("12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth('December 17, 1995 03:24:00')).toStrictEqual("12/1995");

});

test('ModuleFormatDatesNombres:test : formatDate_YearMonth', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth(null)).toStrictEqual(null);
    let dateTest = moment('1995-12-17');
    expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth(dateTest)).toStrictEqual("12/95");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth("12/01/1995")).toStrictEqual("12/95");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth("12-01-1995")).toStrictEqual("12/95");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_YearMonth('December 17, 1995 03:24:00')).toStrictEqual("12/95");
});

test('ModuleFormatDatesNombres:test: formatDate_FullyearMonthDay', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(null)).toStrictEqual(null);
    let dateTest = moment('1995-12-17');
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(dateTest)).toStrictEqual("17/12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay("12/01/1995")).toStrictEqual("01/12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay("12-01-1995")).toStrictEqual("01/12/1995");
    expect(ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay('December 17, 1995 03:24:00')).toStrictEqual("17/12/1995");


});

test('ModuleFormatDatesNombres:test: getMomentFromFormatted_FullyearMonthDay', () => {
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(null)).toStrictEqual(null);
    var momentTest = moment("1995-12-31").utc(true);
    expect(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay("31/12/1995").format('YYYY-MM-DD')).toStrictEqual(momentTest.format('YYYY-MM-DD'));


});


test('ModuleFormatDatesNombres:test: formatNumber_sign', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(0)).toStrictEqual("");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22)).toStrictEqual("");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22.6)).toStrictEqual("");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22)).toStrictEqual("-");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22.6)).toStrictEqual("-");

});

test('ModuleFormatDatesNombres:test: formatNumber_nodecimal', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(0)).toStrictEqual("0");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(-45.32)).toStrictEqual("-45");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(1.32)).toStrictEqual("1");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(10000.32)).toStrictEqual("10 000");
});

test('ModuleFormatDatesNombres:test: formatNumber_n_decimals', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, 1)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12, null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 1)).toStrictEqual("12,3");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 3)).toStrictEqual("12,260");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.9, 0)).toStrictEqual("13");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.8, 0)).toStrictEqual("13");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.82, 1)).toStrictEqual("12,8");
});

test('ModuleFormatDatesNombres:test: formatNumber_arrondi', () => {
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, null, null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, 1, 1)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, null, 1)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, 1, null)).toStrictEqual(null);
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.5, 1, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.4, 1, ARRONDI_TYPE_ROUND)).toStrictEqual("1");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(20000.2, 1, ARRONDI_TYPE_ROUND)).toStrictEqual("20000");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, true, ARRONDI_TYPE_ROUND)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, true, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.75, true, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.7499999999, true, ARRONDI_TYPE_ROUND)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, 0.5, ARRONDI_TYPE_ROUND)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.5, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.75, 0.5, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.7499999999, 0.5, ARRONDI_TYPE_ROUND)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.6, 0.25, ARRONDI_TYPE_ROUND)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_ROUND)).toStrictEqual("1.75");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_FLOOR)).toStrictEqual("1.5");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_FLOOR)).toStrictEqual("1.75");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("1.75");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("1.75");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("2");
    expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, 0, ARRONDI_TYPE_CEIL)).toStrictEqual("1");
});