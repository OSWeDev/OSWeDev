import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';

import ModuleFormatDatesNombres from '../../../src/shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { amountFilter, hourFilter, percentFilter, toFixedFilter, planningCheckFilter, alerteCheckFilter, hideZeroFilter, booleanFilter, truncateFilter, bignumFilter, padHourFilter, toFixedCeilFilter, toFixedFloorFilter, ARRONDI_TYPE_FLOOR, positiveNumberFilter } from '../../../src/shared/tools/Filters';

test('TestFilters: test percentFilter read', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(percentFilter.read(null)).toStrictEqual(null);
    expect(percentFilter.read("0")).toStrictEqual("0 %");
    expect(percentFilter.read("1")).toStrictEqual("100 %");
    expect(percentFilter.read(0)).toStrictEqual("0 %");
    expect(percentFilter.read(1)).toStrictEqual("100 %");
    expect(percentFilter.read(10)).toStrictEqual("1 000 %");

    expect(percentFilter.read("100")).toStrictEqual("10 000 %");
    expect(percentFilter.read(100)).toStrictEqual("10 000 %");
    expect(percentFilter.read(10.0)).toStrictEqual("1 000 %");
    expect(percentFilter.read(10.5)).toStrictEqual("1 050 %");
    expect(percentFilter.read(10.5199)).toStrictEqual("1 052 %");
    expect(percentFilter.read(10.5199, 2)).toStrictEqual("1 051,99 %");
    expect(percentFilter.read(10.519999)).toStrictEqual("1 052 %");
    expect(percentFilter.read(10.519999, 3)).toStrictEqual("1 052,000 %");
    expect(percentFilter.read(.5199)).toStrictEqual("52 %");
    expect(percentFilter.read(.5199, 2)).toStrictEqual("51,99 %");
    expect(percentFilter.read(.5199, 1)).toStrictEqual("52,0 %");
    expect(percentFilter.read(-10)).toStrictEqual("-1 000 %");

    expect(percentFilter.read(0.1)).toStrictEqual("10 %");
    expect(percentFilter.read(0.001)).toStrictEqual("0 %");
    expect(percentFilter.read(0.009)).toStrictEqual("1 %");
    expect(percentFilter.read(0.01)).toStrictEqual("1 %");
    expect(percentFilter.read(0.105)).toStrictEqual("11 %");
    expect(percentFilter.read(0.105, 1)).toStrictEqual("10,5 %");
    expect(percentFilter.read(0.15199)).toStrictEqual("15 %");
    expect(percentFilter.read(0.1599)).toStrictEqual("16 %");
    expect(percentFilter.read(-1)).toStrictEqual("-100 %");

    expect(percentFilter.read("a")).toStrictEqual(null);
    expect(percentFilter.read("dix")).toStrictEqual(null);
    expect(percentFilter.read("1000000")).toStrictEqual("&infin;");
    expect(percentFilter.read("-1000000")).toStrictEqual("-&infin;");
    expect(percentFilter.read("-1000")).toStrictEqual("-&infin;");

    expect(percentFilter.read(0.9666, 1, false, true, true, true)).toStrictEqual("-3,3 %");
    expect(percentFilter.read(0.9, 1, false, true, true, true)).toStrictEqual("-10,0 %");
    expect(percentFilter.read(1, 1, false, true, true, true)).toStrictEqual("0,0 %");
    expect(percentFilter.read(1.1, 1, false, true, true, true)).toStrictEqual("+10,0 %");
});

test('TestFilters: test percentFilter write', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(percentFilter.write(null)).toStrictEqual(null);
    expect(percentFilter.write("0 %")).toStrictEqual(0);
    expect(percentFilter.write("0%")).toStrictEqual(0);
    expect(percentFilter.write("0")).toStrictEqual(0);
    expect(percentFilter.write("0 pourcent")).toStrictEqual(0);
    expect(percentFilter.write("100%")).toStrictEqual(1);
    expect(percentFilter.write("100 %")).toStrictEqual(1);
    expect(percentFilter.write("+ 100 %")).toStrictEqual(1);
    expect(percentFilter.write("+100 %")).toStrictEqual(1);
    expect(percentFilter.write(" 100 %")).toStrictEqual(1);
    expect(percentFilter.write(" + 100 %")).toStrictEqual(1);
    expect(percentFilter.write("32.5")).toStrictEqual(0.325);
    expect(percentFilter.write("32.5%")).toStrictEqual(0.325);
    expect(percentFilter.write("32,5 %")).toStrictEqual(0.325);
    expect(percentFilter.write(" 32,5%")).toStrictEqual(0.325);
    expect(percentFilter.write(" 32 , 5%")).toStrictEqual(0.325);
    expect(percentFilter.write("+ 32 , 5 % ")).toStrictEqual(0.325);
    expect(percentFilter.write("notANumber")).toStrictEqual(0);
    expect(percentFilter.write("-1 000 %")).toStrictEqual(-10);
    expect(percentFilter.write("-25.5 %")).toStrictEqual(-0.255);
    expect(percentFilter.write("- 25.5%")).toStrictEqual(-0.255);
    expect(percentFilter.write("- 25 . 5%")).toStrictEqual(-0.255);
    expect(percentFilter.write("-25.55555555555%")).toStrictEqual(-0.2555555555555);
});



test('TestFilters: test toFixedFilter read', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(toFixedFilter.read(null, null)).toStrictEqual(null);
    expect(toFixedFilter.read(0)).toStrictEqual('0');
    expect(toFixedFilter.read(0, null)).toStrictEqual('0');
    expect(toFixedFilter.read(0, 0)).toStrictEqual('0');
    expect(toFixedFilter.read(0.3)).toStrictEqual('0');
    expect(toFixedFilter.read(0.3, null)).toStrictEqual('0,3');
    expect(toFixedFilter.read(0.3, null, 0.5)).toStrictEqual('0,5');
    expect(toFixedFilter.read(0.3, 0)).toStrictEqual('0');
    expect(toFixedFilter.read("0.5", null, 0.5)).toStrictEqual("0,5");
    expect(toFixedFilter.read(-1.6, null, 0.5)).toStrictEqual("-1,5");
    expect(toFixedFilter.read(-1.9, null, 0.5)).toStrictEqual("-2");
    expect(toFixedFilter.read(0.5, null, 0.5)).toStrictEqual("0,5");
    expect(toFixedFilter.read(-0.1, null, 0.5)).toStrictEqual("0");
    expect(toFixedFilter.read(-0.3, null, 0.5)).toStrictEqual("-0,5");
    expect(toFixedFilter.read(0.1, null, 0.5)).toStrictEqual("0");
    expect(toFixedFilter.read(0.3, null, 0.5)).toStrictEqual("0,5");
    expect(toFixedFilter.read(1.6, null, 0.5)).toStrictEqual("1,5");
    expect(toFixedFilter.read(1.9, null, 0.5)).toStrictEqual("2");
    expect(toFixedFilter.read(1.982, 1, 0.5)).toStrictEqual("2,0");
    expect(toFixedFilter.read(1.982, 1, null)).toStrictEqual("2,0");
    expect(toFixedFilter.read(1.92, 1, null)).toStrictEqual("1,9");
    expect(toFixedFilter.read(1.63, 2, 0.25)).toStrictEqual("1,75");
    expect(toFixedFilter.read(1.78, 2, 0.25)).toStrictEqual("1,75");
    expect(toFixedFilter.read(1.23, 2, 0.25)).toStrictEqual("1,25");
    expect(toFixedFilter.read(1.6888, 3, 0.25)).toStrictEqual("1,750");
    expect(toFixedFilter.read(1.6888, 2, 0.25)).toStrictEqual("1,75");
    expect(toFixedFilter.read(1.6888, 2, 0.1)).toStrictEqual("1,70");
    expect(toFixedFilter.read(1.6888, 2, 0.1, ARRONDI_TYPE_FLOOR)).toStrictEqual("1,60");
    expect(toFixedFilter.read(1.6888, 2, 0.01, ARRONDI_TYPE_FLOOR)).toStrictEqual("1,68");
    expect(toFixedFilter.read(1.6888, 2, 0.01)).toStrictEqual("1,69");

});




test('TestFilters: test amountFilter read', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(amountFilter.read(null)).toStrictEqual(null);
    expect(amountFilter.read("0")).toStrictEqual("€0");
    expect(amountFilter.read("100")).toStrictEqual("€100");
    expect(amountFilter.read(100)).toStrictEqual("€100");
    expect(amountFilter.read(10.0)).toStrictEqual("€10");
    expect(amountFilter.read(10.5)).toStrictEqual("€11");
    expect(amountFilter.read(10.5, 2)).toStrictEqual("€10,50");
    expect(amountFilter.read(10.5199)).toStrictEqual("€11");
    expect(amountFilter.read(10.5199, 2)).toStrictEqual("€10,52");
    expect(amountFilter.read(.5199)).toStrictEqual("€1");
    expect(amountFilter.read(.5199, 2)).toStrictEqual("€0,52");
    expect(amountFilter.read(.5199, 1)).toStrictEqual("€0,5");
    expect(amountFilter.read(.5199, 3)).toStrictEqual("€0,520");
    expect(amountFilter.read(.5199, 4)).toStrictEqual("€0,5199");
    expect(amountFilter.read(-10)).toStrictEqual("€-10");

    expect(amountFilter.read("a")).toStrictEqual(null);
    expect(amountFilter.read("dix")).toStrictEqual(null);
    expect(amountFilter.read("1000000")).toStrictEqual("€1 000 000");
    expect(amountFilter.read("-1000")).toStrictEqual("€-1 000");
    expect(amountFilter.read("-1000", 0, false, true)).toStrictEqual("€0");
    expect(amountFilter.read("-12", 0, false, true)).toStrictEqual("€0");
    expect(amountFilter.read(-12, 0, false, true)).toStrictEqual("€0");
});

test('TestFilters: test amountFilter write', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(amountFilter.write(null)).toStrictEqual(null);
    expect(amountFilter.write("0")).toStrictEqual(0);
    expect(amountFilter.write("100")).toStrictEqual(100);
    expect(amountFilter.write(100)).toStrictEqual(100);
    expect(amountFilter.write(10.0)).toStrictEqual(10);
    expect(amountFilter.write(-10)).toStrictEqual(-10);
    expect(amountFilter.write("a")).toStrictEqual(0);
    expect(amountFilter.write("dix")).toStrictEqual(0);
    expect(amountFilter.write("1000000")).toStrictEqual(1000000);
    expect(amountFilter.write("-1000")).toStrictEqual(-1000);

    expect(amountFilter.write("€0.00")).toStrictEqual(0);
    expect(amountFilter.write("€0.50")).toStrictEqual(0.5);
    expect(amountFilter.write("€100")).toStrictEqual(100);
    expect(amountFilter.write("€100,00")).toStrictEqual(100);
    expect(amountFilter.write("€10.52")).toStrictEqual(10.52);
    expect(amountFilter.write("€0.52")).toStrictEqual(0.52);
    expect(amountFilter.write("€-10.00")).toStrictEqual(-10);
    expect(amountFilter.write("€1 000 000.00")).toStrictEqual(1000000);
    expect(amountFilter.write("€1,000 000.00")).toStrictEqual(1);
});


test('TestFilters: test hourFilter read', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(hourFilter.read(null)).toStrictEqual(null);
    expect(hourFilter.read(-0.1, false, true, true, false, 15)).toStrictEqual("0h");
    expect(hourFilter.read(-0.1)).toStrictEqual("0h");
    expect(hourFilter.read("0")).toStrictEqual("0h");
    expect(hourFilter.read(0)).toStrictEqual("0h");
    expect(hourFilter.read(10)).toStrictEqual("10h");
    expect(hourFilter.read("10")).toStrictEqual("10h");
    expect(hourFilter.read(10.5)).toStrictEqual("10h30");
    expect(hourFilter.read("10.5")).toStrictEqual("10h30");
    expect(hourFilter.read("25.999999")).toStrictEqual("26h");
    expect(hourFilter.read(25.999999)).toStrictEqual("26h");
});

test('TestFilters: test hourFilter write', () => {

    ModuleFormatDatesNombres.getInstance().actif = true;

    expect(hourFilter.write(null)).toStrictEqual(null);
    expect(hourFilter.write("0")).toStrictEqual(0);
    expect(hourFilter.write("00h00")).toStrictEqual(0);
    expect(hourFilter.write(0)).toStrictEqual(0);
    expect(hourFilter.write(10)).toStrictEqual(10);
    expect(hourFilter.write("10.5")).toStrictEqual(10.5);
    expect(hourFilter.write("10.25")).toStrictEqual(10.25);
    expect(hourFilter.write("10")).toStrictEqual(10);
    expect(hourFilter.write("10h")).toStrictEqual(10);
    expect(hourFilter.write("10:30")).toStrictEqual(10.5);
    expect(hourFilter.write("10H30")).toStrictEqual(10.5);
    expect(hourFilter.write("10h30")).toStrictEqual(10.5);
    expect(hourFilter.write("25h60")).toStrictEqual(26);
});



test('TestFilters: test: planningCheckFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(planningCheckFilter.read(null)).toStrictEqual(null);
    expect(planningCheckFilter.read(1)).toStrictEqual("OUI");
    expect(planningCheckFilter.read(-1)).toStrictEqual("NON");
});

test('TestFilters: test: planningCheckFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(planningCheckFilter.write(null)).toStrictEqual(null);
    expect(planningCheckFilter.write("OUI")).toStrictEqual(1);
    expect(planningCheckFilter.write("NON")).toStrictEqual(-1);
});

test('TestFilters: test: alerteCheckFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(alerteCheckFilter.read(null)).toStrictEqual(null);
    expect(alerteCheckFilter.read(1)).toStrictEqual("ALERTE");
    expect(alerteCheckFilter.read(-1)).toStrictEqual("");
});

test('TestFilters: test: alerteCheckFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(alerteCheckFilter.write(null)).toStrictEqual(null);
    expect(alerteCheckFilter.write("ALERTE")).toStrictEqual(1);
    expect(alerteCheckFilter.write("")).toStrictEqual(-1);
});

test('TestFilters: test: hideZeroFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(hideZeroFilter.read(null)).toStrictEqual("");
    expect(hideZeroFilter.read(0)).toStrictEqual("");
    expect(hideZeroFilter.read(45)).toStrictEqual('45');
});

test('TestFilters: test: hideZeroFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(hideZeroFilter.write(null)).toStrictEqual(null);
    expect(hideZeroFilter.write("")).toStrictEqual(0);
    expect(hideZeroFilter.write(78)).toStrictEqual(78);
});

test('TestFilters: test: BooleanFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(booleanFilter.read(null)).toStrictEqual(null);
    expect(booleanFilter.read(true)).toStrictEqual("OUI");
    expect(booleanFilter.read(false)).toStrictEqual("");
});

test('TestFilters: test: BooleanFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(booleanFilter.write(null)).toStrictEqual(null);
    expect(booleanFilter.write("OUI")).toStrictEqual(true);
    expect(booleanFilter.write("non")).toStrictEqual(false);
    expect(booleanFilter.write("")).toStrictEqual(false);
});

test('TestFilters: test: truncateFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(truncateFilter.read(null, null)).toStrictEqual(null);
    expect(truncateFilter.read(null, 10)).toStrictEqual(null);
    expect(truncateFilter.read("test", null)).toStrictEqual(null);
    expect(truncateFilter.read("test", 1)).toStrictEqual("t");
    expect(truncateFilter.read("test", 0)).toStrictEqual("");
    expect(truncateFilter.read("test", 10)).toStrictEqual("test");
});

test('TestFilters: test: truncateFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(truncateFilter.write(null)).toStrictEqual(null);
    expect(truncateFilter.write("test")).toStrictEqual("test");
    expect(truncateFilter.write("")).toStrictEqual("");
});

test('TestFilters: test: bignumFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(bignumFilter.read(null)).toStrictEqual(null);
    expect(bignumFilter.read(0)).toStrictEqual("0.00");
    expect(bignumFilter.read(15555)).toStrictEqual("15,555.00");
    expect(bignumFilter.read(10)).toStrictEqual("10.00");
    expect(bignumFilter.read(0.12345)).toStrictEqual("0.12");
    expect(bignumFilter.read(100000000000)).toStrictEqual("100,000,000,000.00");
});

test('TestFilters: test: bignumFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(bignumFilter.write(null)).toStrictEqual(null);
    expect(bignumFilter.write("")).toStrictEqual(0);
    expect(bignumFilter.write("0")).toStrictEqual(0);
    expect(bignumFilter.write("10 000")).toStrictEqual(10000);
    expect(bignumFilter.write("100,000,000,000.00")).toStrictEqual(100000000000);
    expect(bignumFilter.write("100,000.789354")).toStrictEqual(100000.789354);
    expect(bignumFilter.write("100,000.789354")).toStrictEqual(100000.789354);

});

test('TestFilters: test: padHourFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(padHourFilter.read(null)).toStrictEqual(null);
    expect(padHourFilter.read(3)).toStrictEqual("03");
    expect(padHourFilter.read(0)).toStrictEqual("00");
    expect(padHourFilter.read(10)).toStrictEqual("10");
    expect(padHourFilter.read(1.5)).toStrictEqual("01.5");

});

test('TestFilters: test: padHourFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(padHourFilter.write(null)).toStrictEqual(null);
    expect(padHourFilter.write("03")).toStrictEqual(3);
    expect(padHourFilter.write("3")).toStrictEqual(3);
    expect(padHourFilter.write("03.5")).toStrictEqual(3.5);
    expect(padHourFilter.write("03,5")).toStrictEqual(3.5);
});

test('TestFilters: test: toFixedCeilFilte read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    // param : value, fractionalDigits, arrondi
    expect(toFixedCeilFilter.read(null, null, null)).toStrictEqual(null);
    expect(toFixedCeilFilter.read(null, null, 1)).toStrictEqual(null);
    expect(toFixedCeilFilter.read(null, 1, null)).toStrictEqual(null);
    expect(toFixedCeilFilter.read(10, null, null)).toStrictEqual('10');
    expect(toFixedCeilFilter.read(10, 1, null)).toStrictEqual('10,0');
    expect(toFixedCeilFilter.read(10, 3, null)).toStrictEqual('10,000');
    expect(toFixedCeilFilter.read(10, null, 1)).toStrictEqual('10');
    expect(toFixedCeilFilter.read(10, null, 0.5)).toStrictEqual('10');

    expect(toFixedCeilFilter.read(13.3, null, null)).toStrictEqual('13,3');
    expect(toFixedCeilFilter.read(13.3, null)).toStrictEqual('13,3');
    expect(toFixedCeilFilter.read(13.3, 1, null)).toStrictEqual('13,3');
    expect(toFixedCeilFilter.read(13.3, 1)).toStrictEqual('13,3');
    expect(toFixedCeilFilter.read(13.3, 2, null)).toStrictEqual('13,30');
    expect(toFixedCeilFilter.read(13.3, 2)).toStrictEqual('13,30');
    expect(toFixedCeilFilter.read(13.3, null, 1)).toStrictEqual('14');
    expect(toFixedCeilFilter.read(13.3, null, 0.5)).toStrictEqual('13,5');
    expect(toFixedCeilFilter.read(13.6, null, 0.5)).toStrictEqual('14');
    expect(toFixedCeilFilter.read(13.6, null, 0.25)).toStrictEqual('13,75');
    expect(toFixedCeilFilter.read(13.01, null, 0.25)).toStrictEqual('13,25');

    expect(toFixedCeilFilter.read(13.01, 1, 0.25)).toStrictEqual('13,3'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.01, 2, 0.25)).toStrictEqual('13,25');
    expect(toFixedCeilFilter.read(13.01, 3, 0.25)).toStrictEqual('13,250');

    expect(toFixedCeilFilter.read(13.6, 0, null)).toStrictEqual('14'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.6, 0)).toStrictEqual('14'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.3, 0, null)).toStrictEqual('14'); // param absurde : discutable ?
    expect(toFixedCeilFilter.read(13.3, 0)).toStrictEqual('14'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.38, 1, null)).toStrictEqual('13,4'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.38, 1)).toStrictEqual('13,4'); // param absurde : discutable
    expect(toFixedCeilFilter.read(13.34, 1, null)).toStrictEqual('13,4');  // param absurde : discutable
    expect(toFixedCeilFilter.read(13.34, 1)).toStrictEqual('13,4');  // param absurde : discutable

    expect(toFixedCeilFilter.read(-13.34, 1, null)).toStrictEqual('-13,3');
    expect(toFixedCeilFilter.read(-13.34, 1)).toStrictEqual('-13,3');
    expect(toFixedCeilFilter.read(-13.34, 1, 0.5)).toStrictEqual('-13,0');
    expect(toFixedCeilFilter.read(-13.34, null, 0.5)).toStrictEqual('-13');
    expect(toFixedCeilFilter.read(-13.3, 0, null)).toStrictEqual('-13');
    expect(toFixedCeilFilter.read(-13.3, 0)).toStrictEqual('-13');

    expect(toFixedCeilFilter.read(-13.64, 2, 0.5)).toStrictEqual('-13,50');
    expect(toFixedCeilFilter.read(-13.64, 1, 0.5)).toStrictEqual('-13,5');
    expect(toFixedCeilFilter.read(-13.64, null, 0.5)).toStrictEqual('-13,5');

    expect(toFixedCeilFilter.read(-13.25, 0, null)).toStrictEqual('-13');
    expect(toFixedCeilFilter.read(-13.25, 0)).toStrictEqual('-13');
    expect(toFixedCeilFilter.read(-13.25, 0, 0.5)).toStrictEqual('-13'); // param absurde
    expect(toFixedCeilFilter.read(-13.75, 0, 0.5)).toStrictEqual('-14'); // param absurde

    expect(toFixedCeilFilter.read(13.38, -1)).toStrictEqual('13,38'); // what ?
    expect(toFixedCeilFilter.read(40.5, 1)).toStrictEqual('40,5');
    expect(toFixedCeilFilter.read(0, 0)).toStrictEqual('0');
    expect(toFixedCeilFilter.read(0, 0, 0.5)).toStrictEqual('0'); // param absurde
    expect(toFixedCeilFilter.read(0, 0, 1)).toStrictEqual('0'); // param absurde
    expect(toFixedCeilFilter.read(0, 1)).toStrictEqual('0'); // discutable, arrait pu etre 0,0
    expect(toFixedCeilFilter.read(0, 1, 0.5)).toStrictEqual('0'); // discutable, arrait pu etre 0,0
    expect(toFixedCeilFilter.read(0, 2, null)).toStrictEqual('0'); // discutable, arrait pu etre 0,00
    expect(toFixedCeilFilter.read(0, 2, 0.5)).toStrictEqual('0'); // discutable, arrait pu etre 0,50
});

test('TestFilters: test: toFixedFloorFilte read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    // param : value, fractionalDigits, arrondi
    expect(toFixedFloorFilter.read(null, null, null)).toStrictEqual(null);
    expect(toFixedFloorFilter.read(null, null, 1)).toStrictEqual(null);
    expect(toFixedFloorFilter.read(null, 1, null)).toStrictEqual(null);
    expect(toFixedFloorFilter.read(10, null, null)).toStrictEqual('10');
    expect(toFixedFloorFilter.read(10, 1, null)).toStrictEqual('10,0');
    expect(toFixedFloorFilter.read(10, 3, null)).toStrictEqual('10,000');
    expect(toFixedFloorFilter.read(10, null, 1)).toStrictEqual('10');
    expect(toFixedFloorFilter.read(10, null, 0.5)).toStrictEqual('10');

    expect(toFixedFloorFilter.read(13.3, null, null)).toStrictEqual('13,3');
    expect(toFixedFloorFilter.read(13.3, null)).toStrictEqual('13,3');
    expect(toFixedFloorFilter.read(13.3, 1, null)).toStrictEqual('13,3');
    expect(toFixedFloorFilter.read(13.3, 1)).toStrictEqual('13,3');
    expect(toFixedFloorFilter.read(13.3, 2, null)).toStrictEqual('13,30');
    expect(toFixedFloorFilter.read(13.3, 2)).toStrictEqual('13,30');
    expect(toFixedFloorFilter.read(13.3, null, 1)).toStrictEqual('13');
    expect(toFixedFloorFilter.read(13.3, null, 0.5)).toStrictEqual('13');
    expect(toFixedFloorFilter.read(13.6, null, 0.5)).toStrictEqual('13,5');
    expect(toFixedFloorFilter.read(13.6, null, 0.25)).toStrictEqual('13,5');
    expect(toFixedFloorFilter.read(13.01, null, 0.25)).toStrictEqual('13');

    expect(toFixedFloorFilter.read(13.26, 1, 0.25)).toStrictEqual('13,3'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.26, 2, 0.25)).toStrictEqual('13,25');
    expect(toFixedFloorFilter.read(13.26, 3, 0.25)).toStrictEqual('13,250');

    expect(toFixedFloorFilter.read(13.6, 0, null)).toStrictEqual('13'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.6, 0)).toStrictEqual('13'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.3, 0, null)).toStrictEqual('13'); // param absurde : discutable ?
    expect(toFixedFloorFilter.read(13.3, 0)).toStrictEqual('13'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.38, 1, null)).toStrictEqual('13,3'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.38, 1)).toStrictEqual('13,3'); // param absurde : discutable
    expect(toFixedFloorFilter.read(13.34, 1, null)).toStrictEqual('13,3');  // param absurde : discutable
    expect(toFixedFloorFilter.read(13.34, 1)).toStrictEqual('13,3');  // param absurde : discutable

    expect(toFixedFloorFilter.read(-13.34, 1, null)).toStrictEqual('-13,4');
    expect(toFixedFloorFilter.read(-13.34, 1)).toStrictEqual('-13,4');
    expect(toFixedFloorFilter.read(-13.34, 1, 0.5)).toStrictEqual('-13,5');
    expect(toFixedFloorFilter.read(-13.34, null, 0.5)).toStrictEqual('-13,5');
    expect(toFixedFloorFilter.read(-13.3, 0, null)).toStrictEqual('-14');
    expect(toFixedFloorFilter.read(-13.3, 0)).toStrictEqual('-14');

    expect(toFixedFloorFilter.read(-13.64, 2, 0.5)).toStrictEqual('-14,00');
    expect(toFixedFloorFilter.read(-13.64, 1, 0.5)).toStrictEqual('-14,0');
    expect(toFixedFloorFilter.read(-13.64, null, 0.5)).toStrictEqual('-14');

    expect(toFixedFloorFilter.read(-13.25, 0, null)).toStrictEqual('-14');
    expect(toFixedFloorFilter.read(-13.25, 0)).toStrictEqual('-14');
    expect(toFixedFloorFilter.read(-13.25, 0, 0.5)).toStrictEqual('-14'); // param absurde
    expect(toFixedFloorFilter.read(-13.75, 0, 0.5)).toStrictEqual('-14'); // param absurde

    expect(toFixedFloorFilter.read(13.38, -1)).toStrictEqual('13,38'); // what ?
    expect(toFixedFloorFilter.read(40.5, 1)).toStrictEqual('40,5');
    expect(toFixedFloorFilter.read(0, 0)).toStrictEqual('0');
    expect(toFixedFloorFilter.read(0, 0, 0.5)).toStrictEqual('0'); // param absurde
    expect(toFixedFloorFilter.read(0, 0, 1)).toStrictEqual('0'); // param absurde
    expect(toFixedFloorFilter.read(0, 1)).toStrictEqual('0'); // discutable, arrait pu etre 0,0
    expect(toFixedFloorFilter.read(0, 1, 0.5)).toStrictEqual('0'); // discutable, arrait pu etre 0,0
    expect(toFixedFloorFilter.read(0, 2, null)).toStrictEqual('0'); // discutable, arrait pu etre 0,00
    expect(toFixedFloorFilter.read(0, 2, 0.5)).toStrictEqual('0'); // discutable, arrait pu etre 0,50

});

test('TestFilters: test: toFixedFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(toFixedFilter.write(null)).toStrictEqual(null);
    expect(toFixedFilter.write("3.3")).toStrictEqual(3.3);
    expect(toFixedFilter.write("3,3")).toStrictEqual(3.3);
    expect(toFixedFilter.write("-3.3")).toStrictEqual(-3.3);
    expect(toFixedFilter.write("0")).toStrictEqual(0);
});

test('TestFilters: test: positiveNumberFilter read', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(positiveNumberFilter.read(null)).toStrictEqual(null);
    expect(positiveNumberFilter.read(undefined)).toStrictEqual(null);
    expect(positiveNumberFilter.read(11.2)).toStrictEqual('11.2');
    expect(positiveNumberFilter.read(-11.2)).toStrictEqual('0');
    expect(positiveNumberFilter.read(0)).toStrictEqual('0');
    expect(positiveNumberFilter.read('11.2')).toStrictEqual('11.2');
    expect(positiveNumberFilter.read('-11.2')).toStrictEqual('0');
    expect(positiveNumberFilter.read('0')).toStrictEqual('0');

});

test('TestFilters: test: positiveNumberFilter write', () => {
    ModuleFormatDatesNombres.getInstance().actif = true;
    expect(positiveNumberFilter.write(null)).toStrictEqual(null);
    expect(positiveNumberFilter.write('22')).toStrictEqual(22);
    expect(positiveNumberFilter.write('-22')).toStrictEqual(-22);

});
