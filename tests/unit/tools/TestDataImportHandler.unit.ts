import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import DataImportHandler from '../../../src/shared/tools/DataImportHandler';
import TimeSegmentHandler from '../../../src/shared/tools/TimeSegmentHandler';

import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import moment from 'moment';

test('TestDataImportHandler: test getDATAIMPORTLink', () => {
    expect(DataImportHandler.getDATAIMPORTLink(null)).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTLink([])).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTLink([null])).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTLink(['a'])).toStrictEqual('/data_import/a');
    expect(DataImportHandler.getDATAIMPORTLink(['a', 'a'])).toStrictEqual('/data_import/a_a');
    expect(DataImportHandler.getDATAIMPORTLink(['ab', 'a_d'])).toStrictEqual('/data_import/ab_a_d');
});
test('TestDataImportHandler: test getDATAIMPORTModalLink', () => {
    expect(DataImportHandler.getDATAIMPORTModalLink(null, null)).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTModalLink([], null)).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTModalLink([null], null)).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTModalLink(null, TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(DataImportHandler.getDATAIMPORTModalLink(['a'], TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).toStrictEqual('/data_import/a/segment/1577836800');
    expect(DataImportHandler.getDATAIMPORTModalLink(['a', 'a'], TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).toStrictEqual('/data_import/a_a/segment/1577836800');
    expect(DataImportHandler.getDATAIMPORTModalLink(['ab', 'a_d'], TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).toStrictEqual('/data_import/ab_a_d/segment/1577836800');
});