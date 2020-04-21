import { expect } from 'chai';
import 'mocha';
import DataImportHandler from '../../../shared/tools/DataImportHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import * as moment from 'moment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';

describe('TestDataImportHandler', () => {

    it('test getDATAIMPORTLink', () => {
        expect(DataImportHandler.getDATAIMPORTLink(null)).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTLink([])).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTLink([null])).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTLink(['a'])).to.equal('/data_import/a');
        expect(DataImportHandler.getDATAIMPORTLink(['a', 'a'])).to.equal('/data_import/a_a');
        expect(DataImportHandler.getDATAIMPORTLink(['ab', 'a_d'])).to.equal('/data_import/ab_a_d');
    });
    it('test getDATAIMPORTModalLink', () => {
        expect(DataImportHandler.getDATAIMPORTModalLink(null, null)).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTModalLink([], null)).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTModalLink([null], null)).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTModalLink(null, TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2020-01-01').utc(true), TimeSegment.TYPE_DAY))).to.equal(null);
        expect(DataImportHandler.getDATAIMPORTModalLink(['a'], TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2020-01-01').utc(true), TimeSegment.TYPE_DAY))).to.equal('/data_import/a/segment/2020-01-01');
        expect(DataImportHandler.getDATAIMPORTModalLink(['a', 'a'], TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2020-01-01').utc(true), TimeSegment.TYPE_DAY))).to.equal('/data_import/a_a/segment/2020-01-01');
        expect(DataImportHandler.getDATAIMPORTModalLink(['ab', 'a_d'], TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2020-01-01').utc(true), TimeSegment.TYPE_DAY))).to.equal('/data_import/ab_a_d/segment/2020-01-01');
    });
});