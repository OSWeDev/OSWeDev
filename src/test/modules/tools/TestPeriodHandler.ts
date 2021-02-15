import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import PeriodHandler from '../../../shared/tools/PeriodHandler';


describe('PeriodHandler', () => {

    it('PeriodHandler: isDateInPeriod', () => {

        expect(PeriodHandler.getInstance().isDateInPeriod(null, null)).to.equal(false);

        // Contrat fin 30/07 => 30/07 dans planning pas accessible
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-06-30']")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-06-30')")).to.equal(false);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-06-30')")).to.equal(false);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-06-30']")).to.equal(false);

        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-06-30']")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-06-30')")).to.equal(false);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-06-30')")).to.equal(false);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-06-30']")).to.equal(true);


        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-07-01']")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-07-01')")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-07-01')")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-07-01']")).to.equal(true);


        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-07-01']")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-07-01')")).to.equal(true);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-07-01')")).to.equal(false);
        expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-07-01']")).to.equal(false);
    });

    it('PeriodHandler: lower', () => {

        expect(PeriodHandler.getInstance().lower(null, null)).to.equal(null);
        expect(PeriodHandler.getInstance().lower("['2019-06-30','2019-07-01']")).to.equal('2019-06-30');
        expect(PeriodHandler.getInstance().lower("['2019-07-01','2019-06-30']")).to.equal('2019-07-01');
    });

    it('PeriodHandler: upper', () => {

        expect(PeriodHandler.getInstance().upper(null, null)).to.equal(null);
        expect(PeriodHandler.getInstance().upper("['2019-06-30','2019-07-01']")).to.equal('2019-07-01');
        expect(PeriodHandler.getInstance().upper("['2019-07-01','2019-06-30']")).to.equal('2019-06-30');
    });


    it('PeriodHandler: lowerMoment', () => {

        expect(PeriodHandler.getInstance().lowerMoment(null, null)).to.equal(null);
        expect(PeriodHandler.getInstance().lowerMoment("['2019-07-01','2019-06-30']", "hours")).to.deep.equal(moment("'2019-07-01'").utc(true));
        expect(PeriodHandler.getInstance().upperMoment("['2019-06-30','2019-07-01']", "hours")).to.deep.equal(moment("'2019-07-01'").utc(true));

    });

    it('PeriodHandler: upperMoment', () => {

        expect(PeriodHandler.getInstance().upperMoment(null, null)).to.equal(null);
        expect(PeriodHandler.getInstance().upperMoment("['2019-07-01','2019-06-30']", "hours")).to.deep.equal(moment("'2019-06-30'").utc(true));
        expect(PeriodHandler.getInstance().upperMoment("['2019-06-30','2019-07-01']", "hours")).to.deep.equal(moment("'2019-07-01'").utc(true));
    });

    it('PeriodHandler: hasUpper', () => {

        expect(PeriodHandler.getInstance().hasUpper(null, null)).to.equal(false);
        expect(PeriodHandler.getInstance().hasUpper("['2019-06-30']")).to.equal(false);
        expect(PeriodHandler.getInstance().hasUpper("['2019-06-30','2019-07-01']")).to.equal(true);
        expect(PeriodHandler.getInstance().hasUpper("['2019-07-01','2019-06-30']")).to.equal(true);
    });

    it('PeriodHandler: hasLower', () => {

        expect(PeriodHandler.getInstance().hasLower(null, null)).to.equal(false);
        expect(PeriodHandler.getInstance().hasLower("['2019-06-30']")).to.equal(false);
        expect(PeriodHandler.getInstance().hasLower("['2019-06-30','2019-07-01']")).to.equal(true);
        expect(PeriodHandler.getInstance().hasLower("['2019-07-01','2019-06-30']")).to.equal(true);
    });

    it('PeriodHandler: split', () => {

        expect(PeriodHandler.getInstance().split(null, null)).to.equal(null);
        expect(PeriodHandler.getInstance().split("['2019-06-30','2019-07-01']")).to.deep.equal(["['2019-06-30','2019-07-01']", "[", "'2019-06-30'", "'2019-07-01'", "]"]);
        expect(PeriodHandler.getInstance().split(null)).to.equal(null);
    });

    it('PeriodHandler: get_ts_range_from_period', () => {
        expect(PeriodHandler.getInstance().get_ts_range_from_period(null, null)).to.equal(null);

        let expected = TSRange.createNew(moment("'2020-02-25'").utc(true), moment("'2020-03-17'").utc(true).add(-1, 'days'), true, true, 1);
        expect(PeriodHandler.getInstance().get_ts_range_from_period("['2020-02-25','2020-03-17']", 1)).to.deep.equal(expected);

        expected = TSRange.createNew(moment("2020-02-25").utc(true), moment("2020-03-17").utc(true).add(-1, 'days'), true, true, 1);
        expect(PeriodHandler.getInstance().get_ts_range_from_period("[2020-02-25,2020-03-17]", 1)).to.deep.equal(expected);
    });

});