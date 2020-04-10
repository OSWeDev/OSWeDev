import { expect } from 'chai';
import 'mocha';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
const moment = require('moment');
import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../shared/tools/RangeHandler';
import { Moment } from 'moment';

describe('TSRangeHandler', () => {


    let zero = moment('2020-02-20').startOf('day').utc(true);
    let zero_cinq = moment(zero).add(12, 'hour').utc(true);
    let moins_zero_cinq = moment(zero).add(-12, 'hour').utc(true);
    let un = moment(zero).add(1, 'day').utc(true);
    let deux = moment(zero).add(2, 'day').utc(true);
    let moins_un = moment(zero).add(-1, 'day').utc(true);
    let moins_deux = moment(zero).add(-2, 'day').utc(true);

    let bidon = moment(zero).add(10, 'day').utc(true);

    it('test getCardinal', () => {
        expect(RangeHandler.getInstance().getCardinal(null)).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(1);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(2);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY))).to.equal(2);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(5);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(4);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(4);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(3);
    });

    it('test elt_intersects_any_range', () => {
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);


        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);
    });

    it('test elt_intersects_range', () => {
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
    });

    it('test cloneFrom', () => {
        expect(RangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));
    });

    it('test createNew', () => {
        expect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(moins_un, moins_un, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(un, un, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(un, un, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(un, un, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero_cinq, zero, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(zero_cinq, bidon, false, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(un, bidon, true, false, TimeSegment.TYPE_DAY));
    });

    it('test foreach', async () => {
        let res: string[] = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];
        await await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true))
        ]);


        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true))]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([]);






        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
        ]);


        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([]);
    });

    it('test foreach_ranges', async () => {
        let res: string[] = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)], (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)], (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)], (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)], (date: Moment) => {
            res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)], (date: Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true))
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)], (date: Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true))
        ]);


        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)], (date: Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true))]);


        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)], (date: Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
        expect(res).to.deep.equal([

            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day').utc(true)),
            DateHandler.getInstance().formatDateTimeForAPI(moment(moins_un).startOf('day').utc(true))
        ]);
    });

    it('test getFormattedMaxForAPI', () => {
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(un));
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_un));
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
    });

    it('test getFormattedMinForAPI', () => {
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(un));
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_deux));
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_un));
    });

    it('test getMinSurroundingRange', () => {
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);







        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);





        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
    });

    it('test getRangesUnion', () => {
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange, {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);







        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );





        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
    });

    it('test getSegmentedMax', () => {

        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.equal(null);
    });

    it('test getSegmentedMax_from_ranges', () => {
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
    });

    it('test getSegmentedMin', () => {

        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').utc(true).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.equal(moment(zero).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);

        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('year').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.deep.equal(null);

        // le test unitaire qui marche pas le 31/12 après midi ou le 01/01 avant midi...
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).utc(true).startOf('year').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.deep.equal(null);
    });

    it('test getSegmentedMin_from_ranges', () => {
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).utc(true).startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).utc(true).startOf('day').format('Y-MM-DD HH:mm'));
    });

    it('test getValueFromFormattedMinOrMaxAPI', () => {
        expect(DateHandler.getInstance().formatDateTimeForAPI(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(TSRange.RANGE_TYPE, DateHandler.getInstance().formatDateTimeForAPI(zero)))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(TSRange.RANGE_TYPE, DateHandler.getInstance().formatDateTimeForAPI(null))).to.equal(null);
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(TSRange.RANGE_TYPE, undefined)).to.equal(null);
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(TSRange.RANGE_TYPE, null)).to.equal(null);
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI<Moment>(TSRange.RANGE_TYPE, DateHandler.getInstance().formatDateTimeForAPI(moins_un)).format('DD/MM/YYYY')).to.equal(moins_un.format('DD/MM/YYYY'));
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI<Moment>(TSRange.RANGE_TYPE, DateHandler.getInstance().formatDateTimeForAPI(un)).format('DD/MM/YYYY')).to.equal(un.format('DD/MM/YYYY'));
        expect(RangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI<Moment>(TSRange.RANGE_TYPE, DateHandler.getInstance().formatDateTimeForAPI(zero_cinq)).format('DD/MM/YYYY')).to.equal(zero_cinq.format('DD/MM/YYYY'));
    });

    it('test isEndABeforeEndB', () => {
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndABeforeStartB', () => {
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndASameEndB', () => {
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartABeforeEndB', () => {
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);



        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartABeforeStartB', () => {
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartASameEndB', () => {
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartASameStartB', () => {
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);



        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test is_elt_inf_min', () => {
        expect(RangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);
    });

    it('test is_elt_sup_max', () => {
        expect(RangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test range_intersects_range', () => {
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test range_intersects_any_range', () => {
        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);




        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);



        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);
    });

    it('test ranges_are_contiguous_or_intersect', () => {
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });
});