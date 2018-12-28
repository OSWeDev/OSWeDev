import { expect } from 'chai';
import 'mocha';
import ModuleFormatDatesNombres from '../../../src/shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { amountFilter, hourAndMinutesFilter, hourFilter, percentFilter } from '../../../src/shared/tools/Filters';



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
    expect(percentFilter.read("1000000")).to.equal("100 000 000 %");
    expect(percentFilter.read("-1000")).to.equal("-100 000 %");
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