import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import DateHandler from '../../../src/shared/tools/DateHandler';
import TimeSegmentHandler from '../../../src/shared/tools/TimeSegmentHandler';

describe('TimeSegmentHandler', () => {

    it('test getAllDataTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(null, null, null)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-01-02'), TimeSegment.TYPE_DAY)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_DAY
            },
            {
                dateIndex: '2018-01-02',
                type: TimeSegment.TYPE_DAY
            }
        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-01-02'), TimeSegment.TYPE_DAY, true)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_DAY
            }
        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-02-02'), TimeSegment.TYPE_MONTH)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_MONTH
            },
            {
                dateIndex: '2018-02-01',
                type: TimeSegment.TYPE_MONTH
            }

        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-02-01'), TimeSegment.TYPE_MONTH)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_MONTH
            },
            {
                dateIndex: '2018-02-01',
                type: TimeSegment.TYPE_MONTH
            }

        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-02-01'), TimeSegment.TYPE_MONTH, true)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_MONTH
            }
        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-01-02'), TimeSegment.TYPE_MONTH)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_MONTH
            }
        ]);
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01'), moment('2018-01-02'), TimeSegment.TYPE_MONTH, true)).to.deep.equal([
            {
                dateIndex: '2018-01-01',
                type: TimeSegment.TYPE_MONTH
            }
        ]);
    });

    it('test getCorrespondingTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH, 2)).to.deep.equal({
                dateIndex: '2018-05-01',
                type: TimeSegment.TYPE_MONTH
            });

        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY)).to.deep.equal({
            dateIndex: '2018-02-03',
            type: TimeSegment.TYPE_DAY
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY, 1)).to.deep.equal({
            dateIndex: '2018-02-04',
            type: TimeSegment.TYPE_DAY
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY, -1)).to.deep.equal({
            dateIndex: '2018-02-02',
            type: TimeSegment.TYPE_DAY
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH)).to.deep.equal({
            dateIndex: '2018-02-01',
            type: TimeSegment.TYPE_MONTH
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH, -2)).to.deep.equal({
            dateIndex: '2017-12-01',
            type: TimeSegment.TYPE_MONTH
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH, 2)).to.deep.equal({
            dateIndex: '2018-04-01',
            type: TimeSegment.TYPE_MONTH
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR)).to.deep.equal({
            dateIndex: '2018-01-01',
            type: TimeSegment.TYPE_YEAR
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR, -1)).to.deep.equal({
            dateIndex: '2017-01-01',
            type: TimeSegment.TYPE_YEAR
        });
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR, 1)).to.deep.equal({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        });
    });

    it('test getCumulTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_MONTH
        })).to.deep.equal([{
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_MONTH
        }]);

        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments({
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_MONTH
        })).to.deep.equal([{
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_MONTH
        }, {
            dateIndex: '2019-02-01',
            type: TimeSegment.TYPE_MONTH
        }, {
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_MONTH
        }]);

        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments({
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_DAY
        })).to.deep.equal([{
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_DAY
        }]);
        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments({
            dateIndex: '2019-03-03',
            type: TimeSegment.TYPE_DAY
        })).to.deep.equal([{
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_DAY
        }, {
            dateIndex: '2019-03-02',
            type: TimeSegment.TYPE_DAY
        }, {
            dateIndex: '2019-03-03',
            type: TimeSegment.TYPE_DAY
        }]);
    });

    it('test getDateInMonthSegment', () => {
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment(null, null)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment({
            dateIndex: '2019-03-03',
            type: TimeSegment.TYPE_DAY
        }, 10)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        }, 10)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getDateInMonthSegment({
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        }, 10))).to.equal('2019-04-10');
    });

    it('test getEndTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getEndTimeSegment(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment({
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        }))).to.equal('2019-05-01');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment({
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_DAY
        }))).to.equal('2019-04-02');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        }))).to.equal('2020-01-01');
    });

    it('test getParentTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getParentTimeSegment({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(null);

        expect(TimeSegmentHandler.getInstance().getParentTimeSegment({
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        })).to.deep.equal({
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        });

        expect(TimeSegmentHandler.getInstance().getParentTimeSegment({
            dateIndex: '2019-04-15',
            type: TimeSegment.TYPE_DAY
        })).to.deep.equal({
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        });
    });

    it('test getPreviousTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-04-15',
            type: TimeSegment.TYPE_DAY
        }, TimeSegment.TYPE_DAY)).to.deep.equal({
            dateIndex: '2019-04-14',
            type: TimeSegment.TYPE_DAY
        });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-04-15',
            type: TimeSegment.TYPE_DAY
        }, TimeSegment.TYPE_DAY, 2)).to.deep.equal({
            dateIndex: '2019-04-13',
            type: TimeSegment.TYPE_DAY
        });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-04-15',
            type: TimeSegment.TYPE_DAY
        }, TimeSegment.TYPE_DAY, -1)).to.deep.equal({
            dateIndex: '2019-04-16',
            type: TimeSegment.TYPE_DAY
        });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-04-15',
            type: TimeSegment.TYPE_DAY
        }, TimeSegment.TYPE_MONTH, -1)).to.deep.equal({
            dateIndex: '2019-05-15',
            type: TimeSegment.TYPE_DAY
        });

        // Ambiguous
        // expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
        //     dateIndex: '2019-01-31',
        //     type: TimeSegment.TYPE_DAY
        // }, TimeSegment.TYPE_MONTH, -1)).to.deep.equal({
        //     ???? dateIndex: '2019-03-03', dateIndex: '2019-02-28',
        //     type: TimeSegment.TYPE_DAY
        // });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        }, TimeSegment.TYPE_YEAR, -1)).to.deep.equal({
            dateIndex: '2020-05-01',
            type: TimeSegment.TYPE_MONTH
        });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment({
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        }, TimeSegment.TYPE_YEAR)).to.deep.equal({
            dateIndex: '2018-05-01',
            type: TimeSegment.TYPE_MONTH
        });
    });

    it('test getPreviousTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegments(null)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegments([{
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        },
        {
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        }])).to.deep.equal([{
            dateIndex: '2019-03-01',
            type: TimeSegment.TYPE_MONTH
        },
        {
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        }]);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegments([{
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        },
        {
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        }], TimeSegment.TYPE_YEAR)).to.deep.equal([{
            dateIndex: '2018-04-01',
            type: TimeSegment.TYPE_MONTH
        },
        {
            dateIndex: '2018-05-01',
            type: TimeSegment.TYPE_MONTH
        }]);
    });
    it('test getStartTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getStartTimeSegment({
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        })).to.deep.equal(moment('2019-05-01'));
        expect(TimeSegmentHandler.getInstance().getStartTimeSegment({
            dateIndex: '2019-05-15',
            type: TimeSegment.TYPE_DAY
        })).to.deep.equal(moment('2019-05-15'));
    });

    it('test isInSameSegmentType', () => {
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType({
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        }, null)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(null, {
            dateIndex: '2019-05-01',
            type: TimeSegment.TYPE_MONTH
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            }, TimeSegment.TYPE_DAY)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-04-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-04-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-05-01',
                type: TimeSegment.TYPE_MONTH
            }, TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-04-20',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-04-21',
                type: TimeSegment.TYPE_DAY
            }, TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-04-20',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-04-21',
                type: TimeSegment.TYPE_DAY
            }, TimeSegment.TYPE_MONTH)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            {
                dateIndex: '2019-04-20',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-04-21',
                type: TimeSegment.TYPE_DAY
            })).to.equal(false);
    });

    it('test isMomentInTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(null, null)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-01'), {
            dateIndex: '2019-04-21',
            type: TimeSegment.TYPE_DAY
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-01'), {
            dateIndex: '2019-04-01',
            type: TimeSegment.TYPE_MONTH
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-01'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-12-31'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2020-01-01'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2018-12-31'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_YEAR
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-21'), {
            dateIndex: '2019-01-21',
            type: TimeSegment.TYPE_DAY
        })).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-21'), {
            dateIndex: '2019-01-20',
            type: TimeSegment.TYPE_DAY
        })).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-21'), {
            dateIndex: '2019-01-22',
            type: TimeSegment.TYPE_DAY
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-31'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_MONTH
        })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-01-31'), {
            dateIndex: '2019-02-01',
            type: TimeSegment.TYPE_MONTH
        })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment('2019-02-01'), {
            dateIndex: '2019-01-01',
            type: TimeSegment.TYPE_MONTH
        })).to.equal(false);

    });

    it('test segmentsAreEquivalent', () => {
        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            })).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_YEAR
            }, {
                dateIndex: '2020-01-01',
                type: TimeSegment.TYPE_YEAR
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_DAY
            }, {
                dateIndex: '2019-01-02',
                type: TimeSegment.TYPE_DAY
            })).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(
            {
                dateIndex: '2019-02-01',
                type: TimeSegment.TYPE_MONTH
            }, {
                dateIndex: '2019-01-01',
                type: TimeSegment.TYPE_MONTH
            })).to.equal(false);
    });
});