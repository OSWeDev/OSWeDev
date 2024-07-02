import { test, expect } from "playwright-test-coverage";
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import HourSegment from '../../../src/shared/modules/DataRender/vos/HourSegment';
import Durations from '../../../src/shared/modules/FormatDatesNombres/Dates/Durations';
import HourHandler from '../../../src/shared/tools/HourHandler';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

test('HourHandler: test: formatHourForIHM', () => {
    expect(HourHandler.getInstance().formatHourForIHM(null, null)).toStrictEqual(null);
    expect(HourHandler.getInstance().formatHourForIHM(null, 2)).toStrictEqual('');
    const duration = Durations.from_segmentation(2.2555, HourSegment.TYPE_HOUR); // deux heures 15 minutes et 8 dixième
    expect(HourHandler.getInstance().formatHourForIHM(duration, 0)).toStrictEqual("02h");
    expect(HourHandler.getInstance().formatHourForIHM(duration, 1)).toStrictEqual("02:15");
    expect(HourHandler.getInstance().formatHourForIHM(duration, 2)).toStrictEqual("02:15:19");
});

test('HourHandler: test:formatHourFromIHM', () => {
    expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", null)).toStrictEqual(null);
    expect(HourHandler.getInstance().formatHourFromIHM(null, 1)).toStrictEqual(null);
    expect(HourHandler.getInstance().formatHourFromIHM(null, null)).toStrictEqual(null);
    let duration = Durations.from_segmentation(28800);
    expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 0)).toStrictEqual(duration);
    duration = Durations.from_segmentation(29400);
    expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 1)).toStrictEqual(duration);
    duration = Durations.from_segmentation(29425);
    expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 2)).toStrictEqual(duration);
});

test('HourHandler: test: force2DigitMin', () => {
    const s = ((22 * 60) + 59 * 60) + 45;
    const e = ((22 * 60) + 59 * 60) + 47;
    const start = Durations.from_segmentation(s);
    const end = Durations.from_segmentation(e);
    expect(HourHandler.getInstance()['force2DigitMin'](null)).toStrictEqual("00");
    expect(HourHandler.getInstance()['force2DigitMin'](2)).toStrictEqual("02");
    expect(HourHandler.getInstance()['force2DigitMin'](867)).toStrictEqual("867");

});


test('HourHandler: test: force3Digit', () => {
    const s = ((22 * 60) + 59 * 60) + 45;
    const e = ((22 * 60) + 59 * 60) + 47;
    const start = Durations.from_segmentation(s);
    const end = Durations.from_segmentation(e);
    expect(HourHandler.getInstance()['force3Digit'](null)).toStrictEqual("000");
    expect(HourHandler.getInstance()['force3Digit'](2)).toStrictEqual("002");
    expect(HourHandler.getInstance()['force3Digit'](45)).toStrictEqual("045");
    expect(HourHandler.getInstance()['force3Digit'](867)).toStrictEqual("867");

});