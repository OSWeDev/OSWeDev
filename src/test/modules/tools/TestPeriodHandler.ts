import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
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
});