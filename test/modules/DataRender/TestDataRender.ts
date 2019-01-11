import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import ModuleDataRender from '../../../src/shared/modules/DataRender/ModuleDataRender';
import TimeSegmentHandler from '../../../src/shared/tools/TimeSegmentHandler';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import IRenderedData from '../../../src/shared/modules/DataRender/interfaces/IRenderedData';


it('test DataRender: getTrendP', () => {
    expect(ModuleDataRender.getInstance().getTrendP(null, null)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrendP(0, null)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrendP(null, 0)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrendP(1, null)).to.equal(-1);
    expect(ModuleDataRender.getInstance().getTrendP(null, 1)).to.equal(999);
    expect(ModuleDataRender.getInstance().getTrendP(1, 0)).to.equal(-1);
    expect(ModuleDataRender.getInstance().getTrendP(0, 1)).to.equal(999);
    expect(ModuleDataRender.getInstance().getTrendP(10, 20)).to.equal(1);
    expect(ModuleDataRender.getInstance().getTrendP(10, 10)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrendP(20, 10)).to.equal(-0.5);
    expect(ModuleDataRender.getInstance().getTrendP(1, 1.5)).to.equal(0.5);
    expect(ModuleDataRender.getInstance().getTrendP(10, 15)).to.equal(0.5);
    expect(ModuleDataRender.getInstance().getTrendP(1.5, 1)).to.equal((1 / 1.5) - 1);

    expect(ModuleDataRender.getInstance().getTrendP(-1, 1)).to.equal(999);
    expect(ModuleDataRender.getInstance().getTrendP(1, -1)).to.equal(-999);
});

it('test DataRender: getTrend', () => {
    expect(ModuleDataRender.getInstance().getTrend(null, null)).to.equal(null);
    expect(ModuleDataRender.getInstance().getTrend(0, null)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrend(null, 0)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrend(1, null)).to.equal(-1);
    expect(ModuleDataRender.getInstance().getTrend(null, 1)).to.equal(1);
    expect(ModuleDataRender.getInstance().getTrend(1, 0)).to.equal(-1);
    expect(ModuleDataRender.getInstance().getTrend(0, 1)).to.equal(1);
    expect(ModuleDataRender.getInstance().getTrend(10, 20)).to.equal(10);
    expect(ModuleDataRender.getInstance().getTrend(10, 10)).to.equal(0);
    expect(ModuleDataRender.getInstance().getTrend(20, 10)).to.equal(-10);
    expect(ModuleDataRender.getInstance().getTrend(1, 1.5)).to.equal(0.5);
    expect(ModuleDataRender.getInstance().getTrend(10, 15)).to.equal(5);
    expect(ModuleDataRender.getInstance().getTrend(1.5, 1)).to.equal(-0.5);

    expect(ModuleDataRender.getInstance().getTrend(-1, 1)).to.equal(2);
    expect(ModuleDataRender.getInstance().getTrend(1, -1)).to.equal(-2);
});

it('test DataRender: getPrct', () => {
    expect(ModuleDataRender.getInstance().getPrct(null, null)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(0, null)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(null, 0)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(1, null)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(null, 1)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(1, 0)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(0, 1)).to.equal(0);
    expect(ModuleDataRender.getInstance().getPrct(10, 20)).to.equal(0.5);
    expect(ModuleDataRender.getInstance().getPrct(10, 10)).to.equal(1);
    expect(ModuleDataRender.getInstance().getPrct(20, 10)).to.equal(2);
    expect(ModuleDataRender.getInstance().getPrct(1, 1.5)).to.equal(1 / 1.5);
    expect(ModuleDataRender.getInstance().getPrct(10, 15)).to.equal(10 / 15);
    expect(ModuleDataRender.getInstance().getPrct(1.5, 1)).to.equal(1.5);

    expect(ModuleDataRender.getInstance().getPrct(-1, 1)).to.equal(null);
    expect(ModuleDataRender.getInstance().getPrct(1, -1)).to.equal(null);
});

it('test DataRender: getCount', () => {
    expect(ModuleDataRender.getInstance().getCount(null, () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getCount([], () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getCount([{} as any], () => true)).to.equal(1);
    expect(ModuleDataRender.getInstance().getCount([{} as any], () => false)).to.equal(0);
    expect(ModuleDataRender.getInstance().getCount([{} as any, {} as any, {} as any], () => true)).to.equal(3);
});

it('test DataRender: getColSomme', () => {
    expect(ModuleDataRender.getInstance().getColSomme(null, null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([], null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any], null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any], null, () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any, {} as any, {} as any], null, () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColSomme([], 's', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any], 's', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{} as any, {} as any, {} as any], 's', () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColSomme([{ s: 1 } as any], 's', () => true)).to.equal(1);
    expect(ModuleDataRender.getInstance().getColSomme([{ s: 0 } as any], 's', () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getColSomme([{ s: 0 } as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{ s: 1 } as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColSomme([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).to.equal(6);
});

it('test DataRender: getColMean', () => {
    expect(ModuleDataRender.getInstance().getColMean(null, null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([], null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any], null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any], null, () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any, {} as any, {} as any], null, () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColMean([], 's', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any], 's', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{} as any, {} as any, {} as any], 's', () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColMean([{ s: 1 } as any], 's', () => true)).to.equal(1);
    expect(ModuleDataRender.getInstance().getColMean([{ s: 0 } as any], 's', () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getColMean([{ s: 0 } as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{ s: 1 } as any], 's', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).to.equal(2);

    let first: boolean = true;
    expect(ModuleDataRender.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).to.equal(2.5);
});

it('test DataRender: getColMeanPonderee', () => {
    expect(ModuleDataRender.getInstance().getColMeanPonderee(null, null, null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([], null, null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any], null, null, () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any], null, null, () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], null, null, () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColMeanPonderee([], 's', 'w', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => true)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], 's', 'w', () => true)).to.equal(null);

    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => true)).to.equal(1);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => true)).to.equal(2);

    let first: boolean = true;
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).to.equal(2.5);

    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => true)).to.equal(1);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => true)).to.equal(0);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => false)).to.equal(null);
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => true)).to.equal(1.5);

    first = true;
    expect(ModuleDataRender.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).to.equal(7 / 3);
});

// // Couvert à priori par le test sur isMomentInTimeSegment
// it('test DataRender: filterDataBySegment', () => {
//     expect(ModuleDataRender.getInstance().filterDataBySegment()).to.deep.equal({});
// });

// timeSegment: TimeSegment, resource_id: number, field_name: string, field_name_cumul: string, segment_id: number,
//  renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }
it('test DataRender: getCumul', () => {
    expect(ModuleDataRender.getInstance().getCumul(null, null, null, null, null, null)).to.equal(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        '2018-01-01': {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        '2018-02-01': {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        '2018-03-01': {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        '2018-04-01': {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        '2018-05-01': {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-01-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-02-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(13);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-04-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(33);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-05-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(23);

    renderedDatasBySegmentAndResourceId = {
        '2018-01-01': {
            1: {
                2: {
                    val: 1,
                    cum: 15
                } as any
            }
        },
        '2018-02-01': {
            1: {
                2: {
                    val: 2,
                    cum: 25
                } as any
            }
        },
        '2018-03-01': {
            1: {
                2: {
                    val: 10,
                    cum: 12
                } as any
            }
        },
        '2018-04-01': {
            1: {
                2: {
                    val: 20,
                    cum: 36
                } as any
            }
        },
        '2018-05-01': {
            1: {
                2: {
                    val: -10,
                    cum: 21
                } as any
            }
        }
    };

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-01-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-02-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(17);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(35);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-04-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(32);

    expect(ModuleDataRender.getInstance().getCumul(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-05-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(26);
});

it('test DataRender: getCumul_m_mm1_mm2', () => {
    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(null, null, null, null, null)).to.equal(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        '2018-01-01': {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        '2018-02-01': {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        '2018-03-01': {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        '2018-04-01': {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        '2018-05-01': {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-01-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-02-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);

    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(13);

    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-04-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(32);

    expect(ModuleDataRender.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-05-01'),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(20);
});

it('test DataRender: getValueFromRendererData', () => {
    expect(ModuleDataRender.getInstance().getValueFromRendererData(null, null, null, null, null)).to.equal(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        '2018-01-01': {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        '2018-02-01': {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        '2018-03-01': {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        '2018-04-01': {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        '2018-05-01': {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(ModuleDataRender.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(2);

    expect(ModuleDataRender.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

    expect(ModuleDataRender.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
        1, 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

    expect(ModuleDataRender.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
        1, 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);
});