import { expect } from 'chai';
import 'mocha';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { amountFilter, hourAndMinutesFilter, hourFilter, percentFilter, toFixedFilter, planningCheckFilter, alerteCheckFilter, hideZeroFilter, booleanFilter, truncateFilter } from '../../../shared/tools/Filters';


describe('TestFilters', () => {

    it('test percentFilter read', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(percentFilter.read(null)).to.equal(null);
        expect(percentFilter.read("0")).to.equal("0 %");
        expect(percentFilter.read("1")).to.equal("100 %");
        expect(percentFilter.read(0)).to.equal("0 %");
        expect(percentFilter.read(1)).to.equal("100 %");
        expect(percentFilter.read(10)).to.equal("1 000 %");

        expect(percentFilter.read("100")).to.be.equal("10 000 %");
        expect(percentFilter.read(100)).to.equal("10 000 %");
        expect(percentFilter.read(10.0)).to.equal("1 000 %");
        expect(percentFilter.read(10.5)).to.equal("1 050 %");
        expect(percentFilter.read(10.5199)).to.equal("1 052 %");
        expect(percentFilter.read(10.5199, 2)).to.equal("1 051,99 %");
        expect(percentFilter.read(10.519999)).to.equal("1 052 %");
        expect(percentFilter.read(10.519999, 3)).to.equal("1 052,000 %");
        expect(percentFilter.read(.5199)).to.equal("52 %");
        expect(percentFilter.read(.5199, 2)).to.equal("51,99 %");
        expect(percentFilter.read(.5199, 1)).to.equal("52,0 %");
        expect(percentFilter.read(-10)).to.equal("-1 000 %");

        expect(percentFilter.read(0.1)).to.equal("10 %");
        expect(percentFilter.read(0.001)).to.equal("0 %");
        expect(percentFilter.read(0.009)).to.equal("1 %");
        expect(percentFilter.read(0.01)).to.equal("1 %");
        expect(percentFilter.read(0.105)).to.equal("11 %");
        expect(percentFilter.read(0.105, 1)).to.equal("10,5 %");
        expect(percentFilter.read(0.15199)).to.equal("15 %");
        expect(percentFilter.read(0.1599)).to.equal("16 %");
        expect(percentFilter.read(-1)).to.equal("-100 %");

        expect(percentFilter.read("a")).to.equal(null);
        expect(percentFilter.read("dix")).to.equal(null);
        expect(percentFilter.read("1000000")).to.equal("&infin;");
        expect(percentFilter.read("-1000000")).to.equal("-&infin;");
        expect(percentFilter.read("-1000")).to.equal("-&infin;");
    });

    it('test toFixed read', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(toFixedFilter.read(null)).to.equal(null);
        expect(toFixedFilter.read(0)).to.equal(0);
        expect(toFixedFilter.read(-0.5, null, 0.5)).to.equal("-0.5");
        expect(toFixedFilter.read(-1.6, null, 0.5)).to.equal("-1.5");
        expect(toFixedFilter.read(-1.9, null, 0.5)).to.equal("-2");
        expect(toFixedFilter.read(0.5, null, 0.5)).to.equal("0.5");
        expect(toFixedFilter.read(-0.1, null, 0.5)).to.equal("0");
        expect(toFixedFilter.read(-0.3, null, 0.5)).to.equal("-0.5");
        expect(toFixedFilter.read(0.1, null, 0.5)).to.equal("0");
        expect(toFixedFilter.read(0.3, null, 0.5)).to.equal("0.5");
        expect(toFixedFilter.read(1.6, null, 0.5)).to.equal("1.5");
        expect(toFixedFilter.read(1.9, null, 0.5)).to.equal("2");
    });


    it('test amountFilter read', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(amountFilter.read(null)).to.equal(null);
        expect(amountFilter.read("0")).to.equal("€0");
        expect(amountFilter.read("100")).to.equal("€100");
        expect(amountFilter.read(100)).to.equal("€100");
        expect(amountFilter.read(10.0)).to.equal("€10");
        expect(amountFilter.read(10.5)).to.equal("€11");
        expect(amountFilter.read(10.5, 2)).to.equal("€10,50");
        expect(amountFilter.read(10.5199)).to.equal("€11");
        expect(amountFilter.read(10.5199, 2)).to.equal("€10,52");
        expect(amountFilter.read(.5199)).to.equal("€1");
        expect(amountFilter.read(.5199, 2)).to.equal("€0,52");
        expect(amountFilter.read(.5199, 1)).to.equal("€0,5");
        expect(amountFilter.read(.5199, 3)).to.equal("€0,520");
        expect(amountFilter.read(.5199, 4)).to.equal("€0,5199");
        expect(amountFilter.read(-10)).to.equal("€-10");

        expect(amountFilter.read("a")).to.equal(null);
        expect(amountFilter.read("dix")).to.equal(null);
        expect(amountFilter.read("1000000")).to.equal("€1 000 000");
        expect(amountFilter.read("-1000")).to.equal("€-1 000");
    });

    it('test amountFilter write', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(amountFilter.write(null)).to.equal(null);
        expect(amountFilter.write("0")).to.equal(0);
        expect(amountFilter.write("100")).to.equal(100);
        expect(amountFilter.write(100)).to.equal(100);
        expect(amountFilter.write(10.0)).to.equal(10);
        expect(amountFilter.write(-10)).to.equal(-10);
        expect(amountFilter.write("a")).to.equal(0);
        expect(amountFilter.write("dix")).to.equal(0);
        expect(amountFilter.write("1000000")).to.equal(1000000);
        expect(amountFilter.write("-1000")).to.equal(-1000);

        expect(amountFilter.write("€0.00")).to.equal(0);
        expect(amountFilter.write("€0.50")).to.equal(0.5);
        expect(amountFilter.write("€100")).to.equal(100);
        expect(amountFilter.write("€100,00")).to.equal(100);
        expect(amountFilter.write("€10.52")).to.equal(10.52);
        expect(amountFilter.write("€0.52")).to.equal(0.52);
        expect(amountFilter.write("€-10.00")).to.equal(-10);
        expect(amountFilter.write("€1 000 000.00")).to.equal(1000000);
        expect(amountFilter.write("€1,000 000.00")).to.equal(1);
    });

    it('test hourAndMinutesFilter read', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(hourAndMinutesFilter.read(null)).to.equal(null);
        expect(hourAndMinutesFilter.read("0")).to.equal("0:00");
        expect(hourAndMinutesFilter.read(0)).to.equal("0:00");
        expect(hourAndMinutesFilter.read(10)).to.equal("10:00");
        expect(hourAndMinutesFilter.read("10")).to.equal("10:00");
        expect(hourAndMinutesFilter.read(10.5)).to.equal("10:30");
        expect(hourAndMinutesFilter.read("10.5")).to.equal("10:30");
        expect(hourAndMinutesFilter.read("25.999999")).to.equal("26:00");
        expect(hourAndMinutesFilter.read(25.999999)).to.equal("26:00");
    });

    it('test hourAndMinutesFilter write', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(hourAndMinutesFilter.write(null)).to.equal(null);
        expect(hourAndMinutesFilter.write("0")).to.equal(0);
        expect(hourAndMinutesFilter.write("00:00")).to.equal(0);
        expect(hourAndMinutesFilter.write(0)).to.equal(0);
        expect(hourAndMinutesFilter.write(10)).to.equal(10);
        expect(hourAndMinutesFilter.write("10.5")).to.equal(10.5);
        expect(hourAndMinutesFilter.write("10.25")).to.equal(10.25);
        expect(hourAndMinutesFilter.write("10")).to.equal(10);
        expect(hourAndMinutesFilter.write("10:")).to.equal(10);
        expect(hourAndMinutesFilter.write("10:30")).to.equal(10.5);
        expect(hourAndMinutesFilter.write("10:30")).to.equal(10.5);
        expect(hourAndMinutesFilter.write("10:30")).to.equal(10.5);
        expect(hourAndMinutesFilter.write("25:60")).to.equal(26);
    });

    it('test hourFilter read', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(hourFilter.read(null)).to.equal(null);
        expect(hourFilter.read(-0.1, false, true, true, false, 15)).to.equal("0h");
        expect(hourFilter.read(-0.1)).to.equal("0h");
        expect(hourFilter.read("0")).to.equal("0h");
        expect(hourFilter.read(0)).to.equal("0h");
        expect(hourFilter.read(10)).to.equal("10h");
        expect(hourFilter.read("10")).to.equal("10h");
        expect(hourFilter.read(10.5)).to.equal("10h30");
        expect(hourFilter.read("10.5")).to.equal("10h30");
        expect(hourFilter.read("25.999999")).to.equal("26h");
        expect(hourFilter.read(25.999999)).to.equal("26h");
    });

    it('test hourFilter write', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(hourFilter.write(null)).to.equal(null);
        expect(hourFilter.write("0")).to.equal(0);
        expect(hourFilter.write("00h00")).to.equal(0);
        expect(hourFilter.write(0)).to.equal(0);
        expect(hourFilter.write(10)).to.equal(10);
        expect(hourFilter.write("10.5")).to.equal(10.5);
        expect(hourFilter.write("10.25")).to.equal(10.25);
        expect(hourFilter.write("10")).to.equal(10);
        expect(hourFilter.write("10h")).to.equal(10);
        expect(hourFilter.write("10:30")).to.equal(10.5);
        expect(hourFilter.write("10H30")).to.equal(10.5);
        expect(hourFilter.write("10h30")).to.equal(10.5);
        expect(hourFilter.write("25h60")).to.equal(26);
    });

    it('test hourFilter write', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(hourFilter.write(null)).to.equal(null);
        expect(hourFilter.write("0")).to.equal(0);
        expect(hourFilter.write("00h00")).to.equal(0);
        expect(hourFilter.write(0)).to.equal(0);
        expect(hourFilter.write(10)).to.equal(10);
        expect(hourFilter.write("10.5")).to.equal(10.5);
        expect(hourFilter.write("10.25")).to.equal(10.25);
        expect(hourFilter.write("10")).to.equal(10);
        expect(hourFilter.write("10h")).to.equal(10);
        expect(hourFilter.write("10:30")).to.equal(10.5);
        expect(hourFilter.write("10H30")).to.equal(10.5);
        expect(hourFilter.write("10h30")).to.equal(10.5);
        expect(hourFilter.write("25h60")).to.equal(26);
    });

    it('test: planningCheckFilter read', () => {
        expect(planningCheckFilter.read(null)).to.equal(null);
        expect(planningCheckFilter.read(1)).to.equal("OUI");
        expect(planningCheckFilter.read(-1)).to.equal("NON");
    });

    it('test: planningCheckFilter write', () => {
        expect(planningCheckFilter.write(null)).to.equal(null);
        expect(planningCheckFilter.write("OUI")).to.equal(1);
        expect(planningCheckFilter.write("NON")).to.equal(-1);
    });

    it('test: alerteCheckFilter read', () => {
        expect(alerteCheckFilter.read(null)).to.equal(null);
        expect(alerteCheckFilter.read(1)).to.equal("ALERTE");
        expect(alerteCheckFilter.read(-1)).to.equal("");
    });

    it('test: alerteCheckFilter write', () => {
        expect(alerteCheckFilter.write(null)).to.equal(null);
        expect(alerteCheckFilter.write("ALERTE")).to.equal(1);
        expect(alerteCheckFilter.write("")).to.equal(-1);
    });

    it('test: hideToZeroFilter read', () => {
        expect(hideZeroFilter.read(null)).to.equal(null);
        expect(hideZeroFilter.read(0)).to.equal("");
        expect(hideZeroFilter.read(45)).to.equal(45);
    });

    it('test: hideToZeroFilter write', () => {
        expect(hideZeroFilter.write(null)).to.equal(null);
        expect(hideZeroFilter.write("")).to.equal(0);
        expect(hideZeroFilter.write(78)).to.equal(78);
    });

    it('test: BooleanFilter read', () => {
        expect(booleanFilter.read(null)).to.equal(null);
        expect(booleanFilter.read(true)).to.equal("OUI");
        expect(booleanFilter.read(false)).to.equal("");
    });

    it('test: BooleanFilter write', () => {
        expect(booleanFilter.write(null)).to.equal(null);
        expect(booleanFilter.write("OUI")).to.equal(true);
        expect(booleanFilter.write("")).to.equal(false);
    });

    it('test: truncateFilter read', () => {
        expect(truncateFilter.read(null, null)).to.equal(null);
        expect(truncateFilter.read(null, 10)).to.equal(null);
        expect(truncateFilter.read("test", null)).to.equal(null);
        expect(truncateFilter.read("test", 1)).to.equal("t");
        expect(truncateFilter.read("test", 0)).to.equal("");
        expect(truncateFilter.read("test", 10)).to.equal("test");
    });

    it('test: truncateFilter write', () => {
        expect(truncateFilter.write(null)).to.equal(null);
        expect(truncateFilter.write("test")).to.equal("test");
    });

    it('test: hourAndMinutesFilter read', () => {
        expect(hourAndMinutesFilter.read(null)).to.equal(null);
        expect(hourAndMinutesFilter.read(0)).to.equal("0:00");
        expect(hourAndMinutesFilter.read(2.5)).to.equal("2:30");
        expect(hourAndMinutesFilter.read(2.2111)).to.equal("2:13");
        expect(hourAndMinutesFilter.read(-1)).to.equal("-1:00");
    });

    it('test: hourAndMinutesFilter write', () => {
        expect(hourAndMinutesFilter.write(null)).to.equal(null);
        expect(hourAndMinutesFilter.write("0:00")).to.equal(0);
        expect(hourAndMinutesFilter.write("2:30")).to.equal(2.5);
        expect(hourAndMinutesFilter.write("2:75")).to.equal(3.25);
    });


});