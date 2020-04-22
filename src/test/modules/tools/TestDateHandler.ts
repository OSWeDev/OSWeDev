import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import DateHandler from '../../../shared/tools/DateHandler';


describe('DateHandler', () => {

    it('test formatDateTimeForAPI', () => {
        expect(DateHandler.getInstance().formatDateTimeForAPI(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDateTimeForAPI(moment('2020-02-01').startOf('day').utc(true))).to.equal('1580515200000');
        expect(DateHandler.getInstance().formatDateTimeForAPI(moment('2020-02-01').endOf('day').utc(true))).to.equal('1580601599999');
    });
    it('test formatDateTimeForBDD', () => {
        expect(DateHandler.getInstance().formatDateTimeForBDD(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDateTimeForBDD(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02-01 00:00:00');
        expect(DateHandler.getInstance().formatDateTimeForBDD(moment('2020-02-01').endOf('day').utc(true))).to.equal('2020-02-01 23:59:59');
    });
    it('test formatDayForApi', () => {
        expect(DateHandler.getInstance().formatDayForApi(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').endOf('day').utc(true))).to.equal('2020-02-01');
    });
    it('test formatDayForIndex', () => {
        expect(DateHandler.getInstance().formatDayForIndex(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').endOf('day').utc(true))).to.equal('2020-02-01');
    });
    it('test formatDayForSQL', () => {
        expect(DateHandler.getInstance().formatDayForSQL(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').endOf('day').utc(true))).to.equal('2020-02-01');
    });
    it('test formatDayForVO', () => {
        expect(DateHandler.getInstance().formatDayForVO(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02-01');
        expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').endOf('day').utc(true))).to.equal('2020-02-01');
    });
    it('test formatMonthFromVO', () => {
        expect(DateHandler.getInstance().formatMonthFromVO(null)).to.equal(null);
        expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').startOf('day').utc(true))).to.equal('2020-02');
        expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').endOf('month').utc(true))).to.equal('2020-02');
    });
    it('test getDateFromApiDay', () => {
        expect(DateHandler.getInstance().getDateFromApiDay(null)).to.equal(null);
        expect(DateHandler.getInstance().getDateFromApiDay('2020-02-01')).to.deep.equal(moment('2020-02-01').startOf('day').utc(true));
        expect(DateHandler.getInstance().getDateFromApiDay('2020-02-02')).to.deep.equal(moment('2020-02-02').startOf('day').utc(true));
    });
    it('test getDateFromSQLDay', () => {
        expect(DateHandler.getInstance().getDateFromApiDay(null)).to.equal(null);
        expect(DateHandler.getInstance().getDateFromApiDay('2020-02-01')).to.deep.equal(moment('2020-02-01').startOf('day').utc(true));
        expect(DateHandler.getInstance().getDateFromApiDay('2020-02-02')).to.deep.equal(moment('2020-02-02').startOf('day').utc(true));
    });
    it('test getUnixForBDD', () => {
        expect(DateHandler.getInstance().getUnixForBDD(null)).to.equal(null);
        expect(DateHandler.getInstance().getUnixForBDD(moment('2020-02-01').startOf('day').utc(true))).to.equal(1580515200);
        expect(DateHandler.getInstance().getUnixForBDD(moment('2020-02-01').endOf('day').utc(true))).to.equal(1580601599);
    });
});