import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import DataRenderController from '../../../shared/modules/DataRender/DataRenderController';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';

describe('DataRender', () => {

    it('test DataRender: getTrendP', () => {
        expect(DataRenderController.getInstance().getTrendP(null, null)).to.equal(0);
        expect(DataRenderController.getInstance().getTrendP(0, null)).to.equal(0);
        expect(DataRenderController.getInstance().getTrendP(null, 0)).to.equal(0);
        expect(DataRenderController.getInstance().getTrendP(1, null)).to.equal(-1);
        expect(DataRenderController.getInstance().getTrendP(null, 1)).to.equal(999);
        expect(DataRenderController.getInstance().getTrendP(1, 0)).to.equal(-1);
        expect(DataRenderController.getInstance().getTrendP(0, 1)).to.equal(999);
        expect(DataRenderController.getInstance().getTrendP(10, 20)).to.equal(1);
        expect(DataRenderController.getInstance().getTrendP(10, 10)).to.equal(0);
        expect(DataRenderController.getInstance().getTrendP(20, 10)).to.equal(-0.5);
        expect(DataRenderController.getInstance().getTrendP(1, 1.5)).to.equal(0.5);
        expect(DataRenderController.getInstance().getTrendP(10, 15)).to.equal(0.5);
        expect(DataRenderController.getInstance().getTrendP(1.5, 1)).to.equal((1 / 1.5) - 1);

        expect(DataRenderController.getInstance().getTrendP(-1, 1)).to.equal(999);
        expect(DataRenderController.getInstance().getTrendP(1, -1)).to.equal(-999);
    });

    it('test DataRender: getTrend', () => {
        expect(DataRenderController.getInstance().getTrend(null, null)).to.equal(null);
        expect(DataRenderController.getInstance().getTrend(0, null)).to.equal(0);
        expect(DataRenderController.getInstance().getTrend(null, 0)).to.equal(0);
        expect(DataRenderController.getInstance().getTrend(1, null)).to.equal(-1);
        expect(DataRenderController.getInstance().getTrend(null, 1)).to.equal(1);
        expect(DataRenderController.getInstance().getTrend(1, 0)).to.equal(-1);
        expect(DataRenderController.getInstance().getTrend(0, 1)).to.equal(1);
        expect(DataRenderController.getInstance().getTrend(10, 20)).to.equal(10);
        expect(DataRenderController.getInstance().getTrend(10, 10)).to.equal(0);
        expect(DataRenderController.getInstance().getTrend(20, 10)).to.equal(-10);
        expect(DataRenderController.getInstance().getTrend(1, 1.5)).to.equal(0.5);
        expect(DataRenderController.getInstance().getTrend(10, 15)).to.equal(5);
        expect(DataRenderController.getInstance().getTrend(1.5, 1)).to.equal(-0.5);

        expect(DataRenderController.getInstance().getTrend(-1, 1)).to.equal(2);
        expect(DataRenderController.getInstance().getTrend(1, -1)).to.equal(-2);
    });

    it('test DataRender: getPrct', () => {
        expect(DataRenderController.getInstance().getPrct(null, null)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(0, null)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(null, 0)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(1, null)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(null, 1)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(1, 0)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(0, 1)).to.equal(0);
        expect(DataRenderController.getInstance().getPrct(10, 20)).to.equal(0.5);
        expect(DataRenderController.getInstance().getPrct(10, 10)).to.equal(1);
        expect(DataRenderController.getInstance().getPrct(20, 10)).to.equal(2);
        expect(DataRenderController.getInstance().getPrct(1, 1.5)).to.equal(1 / 1.5);
        expect(DataRenderController.getInstance().getPrct(10, 15)).to.equal(10 / 15);
        expect(DataRenderController.getInstance().getPrct(1.5, 1)).to.equal(1.5);

        expect(DataRenderController.getInstance().getPrct(-1, 1)).to.equal(null);
        expect(DataRenderController.getInstance().getPrct(1, -1)).to.equal(null);
    });

    it('test DataRender: getCount', () => {
        expect(DataRenderController.getInstance().getCount(null, () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getCount([], () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getCount([{} as any], () => true)).to.equal(1);
        expect(DataRenderController.getInstance().getCount([{} as any], () => false)).to.equal(0);
        expect(DataRenderController.getInstance().getCount([{} as any, {} as any, {} as any], () => true)).to.equal(3);
    });

    it('test DataRender: getColSomme', () => {
        expect(DataRenderController.getInstance().getColSomme(null, null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([], null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any], null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any], null, () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any, {} as any, {} as any], null, () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColSomme([], 's', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any], 's', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{} as any, {} as any, {} as any], 's', () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any], 's', () => true)).to.equal(1);
        expect(DataRenderController.getInstance().getColSomme([{ s: 0 } as any], 's', () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getColSomme([{ s: 0 } as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColSomme([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).to.equal(6);
    });

    it('test DataRender: getColMean', () => {
        expect(DataRenderController.getInstance().getColMean(null, null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([], null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any], null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any], null, () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any, {} as any, {} as any], null, () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColMean([], 's', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any], 's', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{} as any, {} as any, {} as any], 's', () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any], 's', () => true)).to.equal(1);
        expect(DataRenderController.getInstance().getColMean([{ s: 0 } as any], 's', () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getColMean([{ s: 0 } as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any], 's', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => true)).to.equal(2);

        let first: boolean = true;
        expect(DataRenderController.getInstance().getColMean([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', () => {
            if (first) {
                first = false;
                return false;
            }
            return true;
        })).to.equal(2.5);
    });

    it('test DataRender: getColMeanPonderee', () => {
        expect(DataRenderController.getInstance().getColMeanPonderee(null, null, null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([], null, null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], null, null, () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], null, null, () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], null, null, () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColMeanPonderee([], 's', 'w', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => true)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any], 's', 'w', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{} as any, {} as any, {} as any], 's', 'w', () => true)).to.equal(null);

        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => true)).to.equal(1);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0 } as any], 's', 'w', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any], 's', 'w', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => true)).to.equal(2);

        let first: boolean = true;
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1 } as any, { s: 2 } as any, { s: 3 } as any], 's', 'w', () => {
            if (first) {
                first = false;
                return false;
            }
            return true;
        })).to.equal(2.5);

        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => true)).to.equal(1);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => true)).to.equal(0);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 0, w: 5 } as any], 's', 'w', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any], 's', 'w', () => false)).to.equal(null);
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => true)).to.equal(1.5);

        first = true;
        expect(DataRenderController.getInstance().getColMeanPonderee([{ s: 1, w: 5 } as any, { s: 2, w: 2 } as any, { s: 3, w: 1 } as any], 's', 'w', () => {
            if (first) {
                first = false;
                return false;
            }
            return true;
        })).to.equal(7 / 3);
    });

    // // Couvert à priori par le test sur isMomentInTimeSegment
    // it('test DataRender: filterDataBySegment', () => {
    //     expect(DataRenderController.getInstance().filterDataBySegment()).to.deep.equal({});
    // });

    // timeSegment: TimeSegment, resource_id: number, field_name: string, field_name_cumul: string, segment_id: number,
    //  renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }
    it('test DataRender: getCumul', () => {
        expect(DataRenderController.getInstance().getCumul(null, null, null, null, null, null)).to.equal(null);

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

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-01-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-02-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(13);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-04-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(33);

        expect(DataRenderController.getInstance().getCumul(
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

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-01-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-02-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(17);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(35);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-04-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(32);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-05-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(26);



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

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-01-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-02-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(17);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(25);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-04-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(45);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-05-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(26);




        renderedDatasBySegmentAndResourceId = {
            '2018-01-01': {
                1: {
                    2: {
                        cum: 15
                    } as any
                }
            },
            '2018-02-01': {
                1: {
                    2: {
                        cum: 25
                    } as any
                }
            },
            '2018-04-01': {
                1: {
                    2: {
                        cum: 36
                    } as any
                }
            },
            '2018-05-01': {
                1: {
                    2: {
                        cum: 21
                    } as any
                }
            }
        };

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-01-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(null);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-02-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(15);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(25);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-04-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(25);

        expect(DataRenderController.getInstance().getCumul(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-05-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(36);
    });

    it('test DataRender: getCumul_m_mm1_mm2', () => {
        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(null, null, null, null, null)).to.equal(null);

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

        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-01-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-02-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);

        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(13);

        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-04-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(32);

        expect(DataRenderController.getInstance().getCumul_m_mm1_mm2(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-05-01'),
                TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(20);
    });

    it('test DataRender: getValueFromRendererData', () => {
        expect(DataRenderController.getInstance().getValueFromRendererData(null, null, null, null, null)).to.equal(null);

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

        expect(DataRenderController.getInstance().getValueFromRendererData(
            TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(2);

        expect(DataRenderController.getInstance().getValueFromRendererData(
            TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
            1, 'val', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getValueFromRendererData(
            TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH, 2),
            1, 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(1);

        expect(DataRenderController.getInstance().getValueFromRendererData(
            TimeSegmentHandler.getInstance().getPreviousTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
                moment('2018-03-01'),
                TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH),
            1, 'cum', 2, renderedDatasBySegmentAndResourceId)).to.equal(3);
    });
});