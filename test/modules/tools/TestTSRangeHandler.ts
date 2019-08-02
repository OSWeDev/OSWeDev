import { expect } from 'chai';
import 'mocha';
import TSRangeHandler from '../../../src/shared/tools/TSRangeHandler';
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
import moment = require('moment');
import DateHandler from '../../../src/shared/tools/DateHandler';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';

describe('TSRangeHandler', () => {


    let zero = moment().startOf('day').add(1, 'hour');
    let zero_cinq = moment(zero).add(12, 'hour');
    let moins_zero_cinq = moment(zero).add(-12, 'hour');
    let un = moment(zero).add(1, 'day');
    let deux = moment(zero).add(2, 'day');
    let moins_un = moment(zero).add(-1, 'day');
    let moins_deux = moment(zero).add(-2, 'day');

    let bidon = moment(zero).add(10, 'day');

    it('test getCardinal', () => {
        expect(TSRangeHandler.getInstance().getCardinal(null)).to.equal(null);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, true))).to.equal(null);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, true))).to.equal(null);

        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, true))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, true))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, false))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, false))).to.equal(1);

        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false))).to.equal(1);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false))).to.equal(1);

        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, true))).to.equal(4);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, true))).to.equal(4);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, false))).to.equal(4);
        expect(TSRangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, false))).to.equal(4);
    });

    it('test elt_intersects_any_range', () => {
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, true)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, true)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, true)])).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true)])).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, true)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, true)])).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true)])).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, true)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, true)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false), TSRange.createNew(zero, un, true, false)])).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false), TSRange.createNew(zero, un, true, true)])).to.equal(true);


        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, true)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, true)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, true)])).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false), TSRange.createNew(zero, un, true, false)])).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false), TSRange.createNew(zero, un, true, true)])).to.equal(true);
    });

    it('test elt_intersects_range', () => {
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, true))).to.equal(true);
    });

    it('test cloneFrom', () => {
        expect(TSRangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, un, true, false))).to.deep.equal({
            min: zero,
            max: un,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(TSRangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, zero, true, true))).to.deep.equal({
            min: zero,
            max: zero,
            min_inclusiv: true,
            max_inclusiv: true
        });
    });

    it('test createNew', () => {
        expect(TSRange.createNew(zero, un, true, false)).to.deep.equal({
            min: zero,
            max: un,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(TSRange.createNew(zero, zero, true, true)).to.deep.equal({
            min: zero,
            max: zero,
            min_inclusiv: true,
            max_inclusiv: true
        });

        expect(TSRange.createNew(zero, zero, true, false)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, true)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, false)).to.equal(null);

        expect(TSRange.createNew(moins_un, moins_un, true, false)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, true)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, false)).to.equal(null);

        expect(TSRange.createNew(un, un, true, false)).to.equal(null);
        expect(TSRange.createNew(un, un, false, true)).to.equal(null);
        expect(TSRange.createNew(un, un, false, false)).to.equal(null);

        expect(TSRange.createNew(moins_un, un, true, false)).to.deep.equal({
            min: moins_un,
            max: un,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(TSRange.createNew(moins_un, zero, false, true)).to.deep.equal({
            min: moins_un,
            max: zero,
            min_inclusiv: false,
            max_inclusiv: true
        });

        expect(TSRange.createNew(zero_cinq, zero, false, true)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, true)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, false)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, false, false)).to.equal(null);

        expect(TSRange.createNew(zero_cinq, bidon, false, false)).to.deep.equal({
            min: zero_cinq,
            max: bidon,
            min_inclusiv: false,
            max_inclusiv: false
        });
    });

    it('test foreach', () => {
        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);


        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);






        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, zero, zero);
            return res;
        })()).to.deep.equal([]);


        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, moins_un, zero);
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, moins_un, zero);
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, moins_un, zero);
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, moins_un, zero);
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            }, TimeSegment.TYPE_DAY, moins_un, zero);
            return res;
        })()).to.deep.equal([DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);
    });

    it('test foreach_ranges', () => {
        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, true)], (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, false)], (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, true)], (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, false)], (date: moment.Moment) => {
                res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([
                TSRange.createNew(zero, un, true, false),
                TSRange.createNew(zero, un, false, false)], (date: moment.Moment) => {
                    res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
                });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))
        ]);

        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([
                TSRange.createNew(zero, un, true, false),
                TSRange.createNew(zero, un, false, false),
                TSRange.createNew(zero, un, false, true)], (date: moment.Moment) => {
                    res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
                });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);


        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([
                TSRange.createNew(zero, un, true, false),
                TSRange.createNew(zero, un, false, false),
                TSRange.createNew(zero, un, false, true),
                TSRange.createNew(zero, un, true, true)], (date: moment.Moment) => {
                    res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
                });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day'))]);


        expect((() => {
            let res: string[] = [];
            TSRangeHandler.getInstance().foreach_ranges([
                TSRange.createNew(zero, un, true, false),
                TSRange.createNew(zero, un, false, false),
                TSRange.createNew(zero, un, false, true),
                TSRange.createNew(zero, un, true, true),
                TSRange.createNew(moins_un, un, true, true),
                TSRange.createNew(moins_zero_cinq, zero_cinq, true, false),
                TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)], (date: moment.Moment) => {
                    res.push(DateHandler.getInstance().formatDateTimeForAPI(date));
                });
            return res;
        })()).to.deep.equal([
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(un).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day')),
            DateHandler.getInstance().formatDateTimeForAPI(moment(zero).startOf('day'))]);
    });

    it('test getFormattedMaxForAPI', () => {
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, un, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(un));
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_un));
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, moins_un, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, zero, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero_cinq, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero_cinq));
    });

    it('test getFormattedMinForAPI', () => {
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(un, deux, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(un));
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_deux));
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, moins_un, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, un, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, zero, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(moins_zero_cinq));
    });

    it('test getMinSurroundingRange', () => {
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, false)])).to.deep.equal(null);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true)])).to.deep.equal(TSRange.createNew(zero, zero, true, true));

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false)])).to.deep.equal(TSRange.createNew(zero, zero, true, true));
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true)])).to.deep.equal(TSRange.createNew(zero, zero, true, true));

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);







        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);





        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange);

        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
        expect(TSRangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange);
    });

    it('test getRangesUnion', () => {
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, false)])).to.deep.equal(null);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true)])).to.deep.equal([TSRange.createNew(zero, zero, true, true)]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false)])).to.deep.equal([TSRange.createNew(zero, zero, true, true)]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true)])).to.deep.equal([TSRange.createNew(zero, zero, true, true)]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal([{
            min: zero,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange, {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal([{
            min: zero,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange, {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal([{
            min: zero,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange, {
            min: moins_un,
            min_inclusiv: false,
            max: zero,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal([{
            min: zero,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange, {
            min: moins_un,
            min_inclusiv: false,
            max: zero,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false), TSRange.createNew(moins_un, zero, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);







        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, true)]
        );

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, true)]
        );

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, true, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, true, false)]
        );

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true), TSRange.createNew(moins_un, moins_zero_cinq, false, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)]
        );
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false), TSRange.createNew(moins_un, moins_zero_cinq, false, false)]
        );





        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, true, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, false, true)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, true, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false
        } as TSRange]);

        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: true
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);
        expect(TSRangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false), TSRange.createNew(moins_un, zero_cinq, false, false)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: false,
            max: un,
            max_inclusiv: false
        } as TSRange]);
    });

    it('test getSegmentedMax', () => {

        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, true)).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, true))).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, false))).to.equal(null);

        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
    });

    it('test getSegmentedMax_from_ranges', () => {
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, un, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, un, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(moins_un, zero, false, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(moins_un, zero, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false)
        ])).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
    });

    it('test getSegmentedMin', () => {

        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, true)).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, false))).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, true))).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, false))).to.equal(null);

        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)).format('Y-MM-DD HH:mm')).to.deep.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
    });

    it('test getSegmentedMin_from_ranges', () => {
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, un, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, un, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, un, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(moins_un, zero, false, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(moins_un, zero, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(moins_un, zero, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(moins_un, zero, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false)
        ])).to.equal(null);
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(zero).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));

        expect(TSRangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true)
        ]).format('Y-MM-DD HH:mm')).to.equal(moment(moins_un).startOf('day').format('Y-MM-DD HH:mm'));
    });

    it('test getValueFromFormattedMinOrMaxAPI', () => {
        expect(DateHandler.getInstance().formatDateTimeForAPI(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(DateHandler.getInstance().formatDateTimeForAPI(zero)))).to.equal(DateHandler.getInstance().formatDateTimeForAPI(zero));
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(DateHandler.getInstance().formatDateTimeForAPI(null))).to.equal(null);
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(undefined)).to.equal(null);
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(null)).to.equal(null);
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(DateHandler.getInstance().formatDateTimeForAPI(moins_un)).format('DD/MM/YYYY')).to.equal(moins_un.format('DD/MM/YYYY'));
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(DateHandler.getInstance().formatDateTimeForAPI(un)).format('DD/MM/YYYY')).to.equal(un.format('DD/MM/YYYY'));
        expect(TSRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(DateHandler.getInstance().formatDateTimeForAPI(zero_cinq)).format('DD/MM/YYYY')).to.equal(zero_cinq.format('DD/MM/YYYY'));
    });

    it('test isEndABeforeEndB', () => {
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(false);




        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
    });

    it('test isEndABeforeStartB', () => {
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(false);




        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
    });

    it('test isEndASameEndB', () => {
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(true);




        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
    });

    it('test isStartABeforeEndB', () => {
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(true);



        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
    });

    it('test isStartABeforeStartB', () => {
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(true);




        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, false, false))).to.equal(false);
    });

    it('test isStartASameEndB', () => {
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(false);




        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
    });

    it('test isStartASameStartB', () => {
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false), TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(zero, un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(zero, un, false, false))).to.equal(false);




        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_deux, moins_un, false, false))).to.equal(false);



        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, false, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true), TSRange.createNew(moins_un, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false), TSRange.createNew(moins_un, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true), TSRange.createNew(moins_un, zero, false, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false), TSRange.createNew(moins_un, zero, false, false))).to.equal(true);
    });

    it('test is_elt_inf_min', () => {
        expect(TSRangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(zero, zero, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, false))).to.equal(true);
    });

    it('test is_elt_sup_max', () => {
        expect(TSRangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(zero, zero, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, false))).to.equal(false);
    });

    it('test range_intersects_range', () => {
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);
    });

    it('test range_intersects_any_range', () => {
        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true), [
            TSRange.createNew(zero, zero, false, false),
            TSRange.createNew(zero, zero, true, false),
            TSRange.createNew(zero, zero, false, true)
        ])).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true), [
            TSRange.createNew(zero, zero, false, false),
            TSRange.createNew(zero, zero, true, false),
            TSRange.createNew(zero, zero, false, true),
            TSRange.createNew(zero, zero, true, true)
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), [
            TSRange.createNew(un, deux, true, true),
            TSRange.createNew(un, deux, true, false),
            TSRange.createNew(un, deux, false, true),
            TSRange.createNew(un, deux, false, false),
        ])).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), [
            TSRange.createNew(un, deux, true, true),
            TSRange.createNew(un, deux, true, false),
            TSRange.createNew(un, deux, false, true),
            TSRange.createNew(un, deux, false, false),
        ])).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), [
            TSRange.createNew(un, deux, true, true),
            TSRange.createNew(un, deux, true, false),
            TSRange.createNew(un, deux, false, true),
            TSRange.createNew(un, deux, false, false),
        ])).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), [
            TSRange.createNew(un, deux, true, true),
            TSRange.createNew(un, deux, true, false),
            TSRange.createNew(un, deux, false, true),
            TSRange.createNew(un, deux, false, false),
        ])).to.equal(false);




        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, true), [
            TSRange.createNew(zero_cinq, deux, true, true),
            TSRange.createNew(zero_cinq, deux, true, false),
            TSRange.createNew(zero_cinq, deux, false, true),
            TSRange.createNew(zero_cinq, deux, false, false),
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, false), [
            TSRange.createNew(zero_cinq, deux, true, true),
            TSRange.createNew(zero_cinq, deux, true, false),
            TSRange.createNew(zero_cinq, deux, false, true),
            TSRange.createNew(zero_cinq, deux, false, false),
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, true), [
            TSRange.createNew(zero_cinq, deux, true, true),
            TSRange.createNew(zero_cinq, deux, true, false),
            TSRange.createNew(zero_cinq, deux, false, true),
            TSRange.createNew(zero_cinq, deux, false, false),
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, false), [
            TSRange.createNew(zero_cinq, deux, true, true),
            TSRange.createNew(zero_cinq, deux, true, false),
            TSRange.createNew(zero_cinq, deux, false, true),
            TSRange.createNew(zero_cinq, deux, false, false),
        ])).to.equal(true);



        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, true), [
            TSRange.createNew(zero_cinq, un, true, true),
            TSRange.createNew(zero_cinq, un, true, false),
            TSRange.createNew(zero_cinq, un, false, true),
            TSRange.createNew(zero_cinq, un, false, false),
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, false), [
            TSRange.createNew(zero_cinq, un, true, true),
            TSRange.createNew(zero_cinq, un, true, false),
            TSRange.createNew(zero_cinq, un, false, true),
            TSRange.createNew(zero_cinq, un, false, false),
        ])).to.equal(false);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, true), [
            TSRange.createNew(zero_cinq, un, true, true),
            TSRange.createNew(zero_cinq, un, true, false),
            TSRange.createNew(zero_cinq, un, false, true),
            TSRange.createNew(zero_cinq, un, false, false),
        ])).to.equal(true);

        expect(TSRangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, false), [
            TSRange.createNew(zero_cinq, un, true, true),
            TSRange.createNew(zero_cinq, un, true, false),
            TSRange.createNew(zero_cinq, un, false, true),
            TSRange.createNew(zero_cinq, un, false, false),
        ])).to.equal(false);
    });

    it('test ranges_are_contiguous_or_intersect', () => {
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true), TSRange.createNew(zero, zero, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true), TSRange.createNew(zero, zero, true, true))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, true, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, true, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, true, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, true, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, false, true))).to.equal(false);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true), TSRange.createNew(un, deux, false, false))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false), TSRange.createNew(un, deux, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false), TSRange.createNew(zero_cinq, deux, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true), TSRange.createNew(zero_cinq, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, false, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true), TSRange.createNew(zero_cinq, un, false, false))).to.equal(true);

        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, true, true))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, true, false))).to.equal(true);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, false, true))).to.equal(false);
        expect(TSRangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false), TSRange.createNew(zero_cinq, un, false, false))).to.equal(false);
    });
});