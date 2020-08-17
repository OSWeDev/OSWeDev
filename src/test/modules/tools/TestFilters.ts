import { expect } from 'chai';
import 'mocha';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { amountFilter, hourFilter, percentFilter, toFixedFilter, planningCheckFilter, alerteCheckFilter, hideZeroFilter, booleanFilter, truncateFilter, bignumFilter, padHourFilter, toFixedCeilFilter, toFixedFloorFilter } from '../../../shared/tools/Filters';


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

    it('test percentFilter write', () => {

        ModuleFormatDatesNombres.getInstance().actif = true;

        expect(percentFilter.write(null)).to.equal(null);
        expect(percentFilter.write("0 %")).to.equal(0);
        expect(percentFilter.write("0%")).to.equal(0);
        expect(percentFilter.write("0")).to.equal(0);
        expect(percentFilter.write("0 pourcent")).to.equal(0);
        expect(percentFilter.write("100%")).to.equal(1);
        expect(percentFilter.write("100 %")).to.equal(1);
        expect(percentFilter.write("+ 100 %")).to.equal(1);
        expect(percentFilter.write("+100 %")).to.equal(1);
        expect(percentFilter.write(" 100 %")).to.equal(1);
        expect(percentFilter.write(" + 100 %")).to.equal(1);
        expect(percentFilter.write("32.5")).to.equal(0.325);
        expect(percentFilter.write("32.5%")).to.equal(0.325);
        expect(percentFilter.write("32,5 %")).to.equal(0.325);
        expect(percentFilter.write(" 32,5%")).to.equal(0.325);
        expect(percentFilter.write(" 32 , 5%")).to.equal(0.325);
        expect(percentFilter.write("+ 32 , 5 % ")).to.equal(0.325);
        expect(percentFilter.write("notANumber")).to.equal(0);
        expect(percentFilter.write("-1 000 %")).to.equal(-10);
        expect(percentFilter.write("-25.5 %")).to.equal(-0.255);
        expect(percentFilter.write("- 25.5%")).to.equal(-0.255);
        expect(percentFilter.write("- 25 . 5%")).to.equal(-0.255);
        expect(percentFilter.write("-25.55555555555%")).to.equal(-0.2555555555555);
    });



    //it('test toFixedFilter read', () => {
    //
    //      ModuleFormatDatesNombres.getInstance().actif = true;
    //
    //      expect(toFixedFilter.read(null)).to.equal(null);
    //    expect(toFixedFilter.read(0)).to.equal("0");
    // expect(toFixedFilter.read(-0.5, 0.5)).to.equal("-0,5");
    //expect(toFixedFilter.read(-1.6, 0.5)).to.equal("-1,5");
    // expect(toFixedFilter.read(-1.9, null, 0.5)).to.equal("-2");
    // expect(toFixedFilter.read(0.5, null, 0.5)).to.equal("0,5");
    //expect(toFixedFilter.read(-0.1, null, 0.5)).to.equal("0");
    //expect(toFixedFilter.read(-0.3, null, 0.5)).to.equal("-0,5");
    //expect(toFixedFilter.read(0.1, null, 0.5)).to.equal("0");
    // expect(toFixedFilter.read(0.3, null, 0.5)).to.equal("0,5");
    //expect(toFixedFilter.read(1.6, null, 0.5)).to.equal("1,5");
    //  expect(toFixedFilter.read(1.9, null, 0.5)).to.equal("2");
    //});




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



    it('test: planningCheckFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(planningCheckFilter.read(null)).to.equal(null);
        expect(planningCheckFilter.read(1)).to.equal("OUI");
        expect(planningCheckFilter.read(-1)).to.equal("NON");
    });

    it('test: planningCheckFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(planningCheckFilter.write(null)).to.equal(null);
        expect(planningCheckFilter.write("OUI")).to.equal(1);
        expect(planningCheckFilter.write("NON")).to.equal(-1);
    });

    it('test: alerteCheckFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(alerteCheckFilter.read(null)).to.equal(null);
        expect(alerteCheckFilter.read(1)).to.equal("ALERTE");
        expect(alerteCheckFilter.read(-1)).to.equal("");
    });

    it('test: alerteCheckFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(alerteCheckFilter.write(null)).to.equal(null);
        expect(alerteCheckFilter.write("ALERTE")).to.equal(1);
        expect(alerteCheckFilter.write("")).to.equal(-1);
    });

    it('test: hideZeroFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(hideZeroFilter.read(null)).to.equal(null);
        expect(hideZeroFilter.read(0)).to.equal("");
        expect(hideZeroFilter.read(45)).to.equal(45);
    });

    it('test: hideZeroFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(hideZeroFilter.write(null)).to.equal(null);
        expect(hideZeroFilter.write("")).to.equal(0);
        expect(hideZeroFilter.write(78)).to.equal(78);
    });

    it('test: BooleanFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(booleanFilter.read(null)).to.equal(null);
        expect(booleanFilter.read(true)).to.equal("OUI");
        expect(booleanFilter.read(false)).to.equal("");
    });

    it('test: BooleanFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(booleanFilter.write(null)).to.equal(null);
        expect(booleanFilter.write("OUI")).to.equal(true);
        expect(booleanFilter.write("non")).to.equal(false);
        expect(booleanFilter.write("")).to.equal(false);
    });

    it('test: truncateFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(truncateFilter.read(null, null)).to.equal(null);
        expect(truncateFilter.read(null, 10)).to.equal(null);
        expect(truncateFilter.read("test", null)).to.equal(null);
        expect(truncateFilter.read("test", 1)).to.equal("t");
        expect(truncateFilter.read("test", 0)).to.equal("");
        expect(truncateFilter.read("test", 10)).to.equal("test");
    });

    it('test: truncateFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(truncateFilter.write(null)).to.equal(null);
        expect(truncateFilter.write("test")).to.equal("test");
        expect(truncateFilter.write("")).to.equal("");
    });

    it('test: bignumFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(bignumFilter.read(null)).to.equal(null);
        expect(bignumFilter.read(0)).to.equal("0.00");
        expect(bignumFilter.read(15555)).to.equal("15,555.00");
        expect(bignumFilter.read(10)).to.equal("10.00");
        expect(bignumFilter.read(0.12345)).to.equal("0.12");
        expect(bignumFilter.read(100000000000)).to.equal("100,000,000,000.00");
    });

    it('test: bignumFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(bignumFilter.write(null)).to.equal(null);
        expect(bignumFilter.write("")).to.equal(0);
        expect(bignumFilter.write("0")).to.equal(0);
        expect(bignumFilter.write("10 000")).to.equal(10000);
        expect(bignumFilter.write("100,000,000,000.00")).to.equal(100000000000);
        expect(bignumFilter.write("100,000.789354")).to.equal(100000.789354);
        expect(bignumFilter.write("100,000.789354")).to.equal(100000.789354);

    });

    it('test: padHourFilter read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(padHourFilter.read(null)).to.equal(null);
        expect(padHourFilter.read(3)).to.equal("03");
        expect(padHourFilter.read(0)).to.equal("00");
        expect(padHourFilter.read(10)).to.equal("10");
        expect(padHourFilter.read(1.5)).to.equal("01.5");

    });

    it('test: padHourFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(padHourFilter.write(null)).to.equal(null);
        expect(padHourFilter.write("03")).to.equal(3);
        expect(padHourFilter.write("3")).to.equal(3);
        expect(padHourFilter.write("03.5")).to.equal(3.5);
    });

    it('test: toFixedCeilFilte read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(toFixedCeilFilter.read(null, null)).to.equal(null);
        expect(toFixedCeilFilter.read(1, null)).to.equal(null);
        expect(toFixedCeilFilter.read(null, 1)).to.equal(null);
        expect(toFixedCeilFilter.read(3.6, 0)).to.equal('4');
        expect(toFixedCeilFilter.read(3.3, 0)).to.equal('4');
        expect(toFixedCeilFilter.read(3.38, 1)).to.equal('3,4');
        expect(toFixedCeilFilter.read(3.34, 1)).to.equal('3,4');
        expect(toFixedCeilFilter.read(-3.34, 1)).to.equal('-3,3');
        expect(toFixedCeilFilter.read(-3.3, 0)).to.equal('-3');
        expect(toFixedCeilFilter.read(3.38, -1)).to.equal('10'); //incohérent car digit négatif mais n'epxplose pas.
        expect(toFixedCeilFilter.read(0, 0)).to.equal('0');
        expect(toFixedCeilFilter.read(0, 1)).to.equal('0');

    });

    it('test: toFixedFloorFilte read', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(toFixedFloorFilter.read(null, null)).to.equal(null);
        expect(toFixedFloorFilter.read(1, null)).to.equal(null);
        expect(toFixedFloorFilter.read(null, 1)).to.equal(null);
        expect(toFixedFloorFilter.read(3.6, 0)).to.equal('3');
        expect(toFixedFloorFilter.read(3.33, 1)).to.equal('3,3');
        expect(toFixedFloorFilter.read(3.38, 1)).to.equal('3,3');
        expect(toFixedFloorFilter.read(-3.38, 1)).to.equal('-3,4');
        expect(toFixedCeilFilter.read(3.38, -1)).to.equal('10'); //incohérent car digit négatif mais n'explose pas.
        expect(toFixedCeilFilter.read(0, 0)).to.equal('0');
        expect(toFixedCeilFilter.read(0, 1)).to.equal('0');
    });

    it('test: toFixedFilter write', () => {
        ModuleFormatDatesNombres.getInstance().actif = true;
        expect(toFixedFilter.write(null)).to.equal(null);
        expect(toFixedFilter.write("3.3")).to.equal(3.3);
        expect(toFixedFilter.write("3,3")).to.equal(3.3); //bizare
        expect(toFixedFilter.write("-3.3")).to.equal(-3.3);
        expect(toFixedFilter.write("0")).to.equal(0);
    });
});