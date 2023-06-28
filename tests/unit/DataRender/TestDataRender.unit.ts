import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";

import DataRenderController from '../../../src/shared/modules/DataRender/DataRenderController';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../src/shared/tools/TimeSegmentHandler';
import moment from 'moment';

test('DataRender: test DataRender: getTrendP', () => {
    expect(DataRenderController.getInstance().getTrendP(null, null)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrendP(0, null)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrendP(null, 0)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrendP(1, null)).toStrictEqual(-1);
    expect(DataRenderController.getInstance().getTrendP(null, 1)).toStrictEqual(999);
    expect(DataRenderController.getInstance().getTrendP(1, 0)).toStrictEqual(-1);
    expect(DataRenderController.getInstance().getTrendP(0, 1)).toStrictEqual(999);
    expect(DataRenderController.getInstance().getTrendP(10, 20)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getTrendP(10, 10)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrendP(20, 10)).toStrictEqual(-0.5);
    expect(DataRenderController.getInstance().getTrendP(1, 1.5)).toStrictEqual(0.5);
    expect(DataRenderController.getInstance().getTrendP(10, 15)).toStrictEqual(0.5);
    expect(DataRenderController.getInstance().getTrendP(1.5, 1)).toStrictEqual((1 / 1.5) - 1);

    expect(DataRenderController.getInstance().getTrendP(-1, 1)).toStrictEqual(999);
    expect(DataRenderController.getInstance().getTrendP(1, -1)).toStrictEqual(-999);
});

test('DataRender: test DataRender: getTrend', () => {
    expect(DataRenderController.getInstance().getTrend(null, null)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getTrend(0, null)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrend(null, 0)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrend(1, null)).toStrictEqual(-1);
    expect(DataRenderController.getInstance().getTrend(null, 1)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getTrend(1, 0)).toStrictEqual(-1);
    expect(DataRenderController.getInstance().getTrend(0, 1)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getTrend(10, 20)).toStrictEqual(10);
    expect(DataRenderController.getInstance().getTrend(10, 10)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getTrend(20, 10)).toStrictEqual(-10);
    expect(DataRenderController.getInstance().getTrend(1, 1.5)).toStrictEqual(0.5);
    expect(DataRenderController.getInstance().getTrend(10, 15)).toStrictEqual(5);
    expect(DataRenderController.getInstance().getTrend(1.5, 1)).toStrictEqual(-0.5);

    expect(DataRenderController.getInstance().getTrend(-1, 1)).toStrictEqual(2);
    expect(DataRenderController.getInstance().getTrend(1, -1)).toStrictEqual(-2);
});

test('DataRender: test DataRender: getPrct', () => {
    expect(DataRenderController.getInstance().getPrct(null, null)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(0, null)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(null, 0)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(1, null)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(null, 1)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(1, 0)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(0, 1)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getPrct(10, 20)).toStrictEqual(0.5);
    expect(DataRenderController.getInstance().getPrct(10, 10)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getPrct(20, 10)).toStrictEqual(2);
    expect(DataRenderController.getInstance().getPrct(1, 1.5)).toStrictEqual(1 / 1.5);
    expect(DataRenderController.getInstance().getPrct(10, 15)).toStrictEqual(10 / 15);
    expect(DataRenderController.getInstance().getPrct(1.5, 1)).toStrictEqual(1.5);

    expect(DataRenderController.getInstance().getPrct(-1, 1)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getPrct(1, -1)).toStrictEqual(null);
});

test('DataRender: test DataRender: getCount', () => {
    expect(DataRenderController.getInstance().getCount(null, () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getCount([], () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getCount([{} as any], () => true)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getCount([{} as any], () => false)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getCount([{} as any, {} as any, {} as any], () => true)).toStrictEqual(3);
});

test('DataRender: test DataRender: getColSomme', () => {
    expect(DataRenderController.getInstance().getColSomme(null, null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([], null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any], null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any], null, () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any, {} as any, {} as any], null, () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColSomme([], 's', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any], 's', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{} as any, {} as any, {} as any], 's', () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any], 's', () => true)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getColSomme([{ s: 0 } as any], 's', () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getColSomme([{ s: 0 } as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).toStrictEqual(6);
});

test('DataRender: test DataRender: getColMean', () => {
    expect(DataRenderController.getInstance().getColMean(null, null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([], null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any], null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any], null, () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any, {} as any, {} as any], null, () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColMean([], 's', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any], 's', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{} as any, {} as any, {} as any], 's', () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any], 's', () => true)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getColMean([{ s: 0 } as any], 's', () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getColMean([{ s: 0 } as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any], 's', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).toStrictEqual(2);

    let first: boolean = true;
    expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).toStrictEqual(2.5);
});

test('DataRender: test DataRender: getColMeanPonderee', () => {
    expect(DataRenderController.getInstance().getColMeanPonderee(null, null, null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([], null, null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], null, null, () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], null, null, () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], null, null, () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColMeanPonderee([], 's', 'w', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => true)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], 's', 'w', () => true)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => true)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => true)).toStrictEqual(2);

    let first: boolean = true;
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).toStrictEqual(2.5);

    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => true)).toStrictEqual(1);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => true)).toStrictEqual(0);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => false)).toStrictEqual(null);
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => true)).toStrictEqual(1.5);

    first = true;
    expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => {
        if (first) {
            first = false;
            return false;
        }
        return true;
    })).toStrictEqual(7 / 3);
});

// // Couvert à priori par le test sur isMomentInTimeSegment
// test('DataRender: test DataRender: filterDataBySegment', () => {
//     expect(DataRenderController.getInstance().filterDataBySegment()).toStrictEqual({});
// });

// timeSegment: TimeSegment, resource_id: number, field_name: string, field_name_cumul: string, segment_id: number,
//  renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }
test('DataRender: test DataRender: getCumul', () => {
    expect(DataRenderController.getInstance().getCumul(null, null, null, null, null, null)).toStrictEqual(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: number]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        [moment('2018-03-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-01-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-02-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(3);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(13);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-04-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(33);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-05-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(23);

    renderedDatasBySegmentAndResourceId = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 1,
                    cum: 15
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 2,
                    cum: 25
                } as any
            }
        },
        [moment('2018-03-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 10,
                    cum: 12
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 20,
                    cum: 36
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: -10,
                    cum: 21
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-01-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-02-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(17);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(35);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-04-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(32);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-05-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(26);



    renderedDatasBySegmentAndResourceId = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 1,
                    cum: 15
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 2,
                    cum: 25
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 20,
                    cum: 36
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: -10,
                    cum: 21
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-01-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-02-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(17);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(25);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-04-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(45);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-05-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(26);




    renderedDatasBySegmentAndResourceId = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    cum: 15
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    cum: 25
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    cum: 36
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    cum: 21
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-01-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(null);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-02-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(15);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(25);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-04-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(25);

    expect(DataRenderController.getInstance().getCumul(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-05-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(36);
});

test('DataRender: test DataRender: getCumul_m_mm1_mm2', () => {
    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(null, null, null, null, null)).toStrictEqual(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        [moment('2018-03-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-01-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-02-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(3);

    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(13);

    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-04-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(32);

    expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
        TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-05-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(20);
});

test('DataRender: test DataRender: getValueFromRendererData', () => {
    expect(DataRenderController.getInstance().getValueFromRendererData(null, null, null, null, null)).toStrictEqual(null);

    let renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: any } } } = {
        [moment('2018-01-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 1,
                    cum: 1
                } as any
            }
        },
        [moment('2018-02-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 2,
                    cum: 3
                } as any
            }
        },
        [moment('2018-03-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 10,
                    cum: 13
                } as any
            }
        },
        [moment('2018-04-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: 20,
                    cum: 33
                } as any
            }
        },
        [moment('2018-05-01').startOf('day').utc(true).unix()]: {
            1: {
                2: {
                    val: -10,
                    cum: 23
                } as any
            }
        }
    };

    expect(DataRenderController.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getPreviousTimeSegment(TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(2);

    expect(DataRenderController.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getPreviousTimeSegment(TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
        1, 'val', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getPreviousTimeSegment(TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
        1, 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(1);

    expect(DataRenderController.getInstance().getValueFromRendererData(
        TimeSegmentHandler.getPreviousTimeSegment(TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').startOf('day').utc(true).unix(),
            TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
        1, 'cum', 2, renderedDatasBySegmentAndResourceId)).toStrictEqual(3);
});