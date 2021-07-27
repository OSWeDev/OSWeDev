import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';

import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import HourHandler from '../../../shared/tools/HourHandler';
import Durations from '../../../shared/modules/FormatDatesNombres/Dates/Durations';
import HourSegment from '../../../shared/modules/DataRender/vos/HourSegment';
// import * as moment from 'moment';

describe('HourHandler', () => {
    it('test: formatHourForIHM', () => {
        expect(HourHandler.getInstance().formatHourForIHM(null, null)).to.equal(null);
        expect(HourHandler.getInstance().formatHourForIHM(null, 2)).to.equal('');
        var duration = Durations.from_segmentation(2.2555, HourSegment.TYPE_HOUR); // deux heures 15 minutes et 8 dixième
        expect(HourHandler.getInstance().formatHourForIHM(duration, 0)).to.equal("02h");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 1)).to.equal("02:15");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 2)).to.equal("02:15:19");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 3)).to.equal("02:15:19.800");
    });

    it('test:formatHourFromIHM', () => {
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", null)).to.equal(null);
        expect(HourHandler.getInstance().formatHourFromIHM(null, 1)).to.equal(null);
        expect(HourHandler.getInstance().formatHourFromIHM(null, null)).to.equal(null);
        var duration = Durations.from_segmentation(28800000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 0)).to.deep.equal(duration);
        duration = Durations.from_segmentation(29400000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 1)).to.deep.equal(duration);
        duration = Durations.from_segmentation(29425000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 2)).to.deep.equal(duration);
        duration = Durations.from_segmentation(29425100);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 3)).to.deep.equal(duration);
        duration = Durations.from_segmentation(0);
        expect(HourHandler.getInstance().formatHourFromIHM("0h00:00.000", 3)).to.deep.equal(duration);
    });

    it('test: force2DigitMin', () => {
        let s = (((22 * 60) + 59 * 60) + 45 * 1000) + 999;
        let e = (((22 * 60) + 59 * 60) + 47 * 1000) + 991;
        let start = Durations.from_segmentation(s);
        var end = Durations.from_segmentation(e);
        expect(HourHandler.getInstance()['force2DigitMin'](null)).to.equal("00");
        expect(HourHandler.getInstance()['force2DigitMin'](2)).to.equal("02");
        expect(HourHandler.getInstance()['force2DigitMin'](867)).to.equal("867");

    });


    it('test: force3Digit', () => {
        let s = (((22 * 60) + 59 * 60) + 45 * 1000) + 999;
        let e = (((22 * 60) + 59 * 60) + 47 * 1000) + 991;
        let start = Durations.from_segmentation(s);
        var end = Durations.from_segmentation(e);
        expect(HourHandler.getInstance()['force3Digit'](null)).to.equal("000");
        expect(HourHandler.getInstance()['force3Digit'](2)).to.equal("002");
        expect(HourHandler.getInstance()['force3Digit'](45)).to.equal("045");
        expect(HourHandler.getInstance()['force3Digit'](867)).to.equal("867");

    });

});
