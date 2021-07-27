import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';

import DateHandler from '../../../shared/tools/DateHandler';
import * as moment from 'moment';


describe('DateHandler', () => {

    it('test humanizeDurationTo', () => {
        expect(DateHandler.getInstance().humanizeDurationTo(null)).to.equal('');
        expect(DateHandler.getInstance().humanizeDurationTo(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('a year');
        expect(DateHandler.getInstance().humanizeDurationTo(moment('2020-02-27').endOf('day').utc(true).unix())).to.equal('a year');
    });
    it('test formatDayForApi', () => {
        expect(DateHandler.getInstance().formatDayForApi(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').endOf('day').utc(true).unix())).to.equal('2020-02-01');
    });
    it('test formatDayForIndex', () => {
        expect(DateHandler.getInstance().formatDayForIndex(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').endOf('day').utc(true).unix())).to.equal('2020-02-01');
    });
    it('test formatDayForSQL', () => {
        expect(DateHandler.getInstance().formatDayForSQL(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').endOf('day').utc(true).unix())).to.equal('2020-02-01');
    });
    it('test formatDayForVO', () => {
        expect(DateHandler.getInstance().formatDayForVO(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').endOf('day').utc(true).unix())).to.equal('2020-02-01');
    });
    it('test formatMonthFromVO', () => {
        expect(DateHandler.getInstance().formatMonthFromVO(null)).to.equal(null);
        expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal('2020-02');
        expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').endOf('month').utc(true).unix())).to.equal('2020-02');
    });
    it('test getUnixForBDD', () => {
        expect(DateHandler.getInstance().getUnixForBDD(null)).to.equal(null);
        expect(DateHandler.getInstance().getUnixForBDD(moment('2020-02-01').startOf('day').utc(true).unix())).to.equal(1580515200);
        expect(DateHandler.getInstance().getUnixForBDD(moment('2020-02-01').endOf('day').utc(true).unix())).to.equal(1580601599);
    });
});