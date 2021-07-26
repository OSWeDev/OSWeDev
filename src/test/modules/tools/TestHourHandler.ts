import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import HourHandler from '../../../shared/tools/HourHandler';

describe('HourHandler', () => {
    it('test: formatHourForIHM', () => {
        expect(HourHandler.getInstance().formatHourForIHM(null, null)).to.equal(null);
        expect(HourHandler.getInstance().formatHourForIHM(null, 2)).to.equal('');
        var duration = moment.duration(2.2555, 'hours'); // deux heures 15 minutes et 8 dixième
        expect(HourHandler.getInstance().formatHourForIHM(duration, 0)).to.equal("02h");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 1)).to.equal("02:15");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 2)).to.equal("02:15:19");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 3)).to.equal("02:15:19.800");
    });

    it('test:formatHourFromIHM', () => {
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", null)).to.equal(null);
        expect(HourHandler.getInstance().formatHourFromIHM(null, 1)).to.equal(null);
        expect(HourHandler.getInstance().formatHourFromIHM(null, null)).to.equal(null);
        var duration = moment.duration(28800000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 0)).to.deep.equal(duration);
        duration = moment.duration(29400000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 1)).to.deep.equal(duration);
        duration = moment.duration(29425000);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 2)).to.deep.equal(duration);
        duration = moment.duration(29425100);
        expect(HourHandler.getInstance().formatHourFromIHM("8:10:25.100", 3)).to.deep.equal(duration);
        duration = moment.duration(0);
        expect(HourHandler.getInstance().formatHourFromIHM("0h00:00.000", 3)).to.deep.equal(duration);
    });


    it('test: formatHourForAPI', () => {
        var duration = moment.duration(2.2555, 'hours');
        expect(HourHandler.getInstance().formatHourForAPI(duration)).equal(8119800);
        expect(HourHandler.getInstance().formatHourForAPI(null)).equal(null);
        duration = moment.duration(0, 'hours');
        expect(HourHandler.getInstance().formatHourForAPI(duration)).equal(0);

    });


    it('test: formatHourForBDD', () => {
        var duration = moment.duration(2.2555, 'hours');
        expect(HourHandler.getInstance().formatHourForBDD(duration)).equal(8119800);
        expect(HourHandler.getInstance().formatHourForBDD(null)).equal(null);
        duration = moment.duration(0, 'hours');
        expect(HourHandler.getInstance().formatHourForBDD(duration)).equal(0);

    });

    it('test: getDateFromApi', () => {
        var duration = moment.duration(2.2555, 'hours');
        expect(HourHandler.getInstance().getDateFromApi(8119800)).to.deep.equal(duration);
        expect(HourHandler.getInstance().getDateFromApi(null)).to.deep.equal(null);
        duration = moment.duration(0, 'hours');
        expect(HourHandler.getInstance().getDateFromApi(0)).to.deep.equal(duration);

    });

    it('test: getDateFromSQLDay', () => {
        var duration = moment.duration(2.2555, 'hours');
        expect(HourHandler.getInstance().getDateFromSQLDay(8119800)).to.deep.equal(duration);
        expect(HourHandler.getInstance().getDateFromSQLDay(null)).to.deep.equal(null);
        duration = moment.duration(0, 'hours');
        expect(HourHandler.getInstance().getDateFromSQLDay(0)).to.deep.equal(duration);

    });


    it('test: diffDuration', () => {
        let s = "22:59:45.999";
        let e = "22:59:47.991";
        let start = moment.duration(s);
        var end = moment.duration(e);
        expect(HourHandler.getInstance().diffDuration(null, null, TimeSegment.TYPE_MINUTE)).to.deep.equal(null);
        expect(HourHandler.getInstance().diffDuration(null, end, TimeSegment.TYPE_MINUTE)).to.deep.equal(null);
        expect(HourHandler.getInstance().diffDuration(start, null, TimeSegment.TYPE_MINUTE)).to.deep.equal(null);
        expect(HourHandler.getInstance().diffDuration(end, start, TimeSegment.TYPE_SECOND)).to.deep.equal(Math.ceil(((((45 - 47) * 1000 + 999 - 991)) / 1000)));
        expect(HourHandler.getInstance().diffDuration(start, end, TimeSegment.TYPE_HOUR)).to.deep.equal(1 / 60 / 60);

    });


    it('test: force2DigitMin', () => {
        let s = (((22 * 60) + 59 * 60) + 45 * 1000) + 999;
        let e = (((22 * 60) + 59 * 60) + 47 * 1000) + 991;
        let start = moment.duration(s);
        var end = moment.duration(e);
        expect(HourHandler.getInstance()['force2DigitMin'](null)).to.equal("00");
        expect(HourHandler.getInstance()['force2DigitMin'](2)).to.equal("02");
        expect(HourHandler.getInstance()['force2DigitMin'](867)).to.equal("867");

    });


    it('test: force3Digit', () => {
        let s = (((22 * 60) + 59 * 60) + 45 * 1000) + 999;
        let e = (((22 * 60) + 59 * 60) + 47 * 1000) + 991;
        let start = moment.duration(s);
        var end = moment.duration(e);
        expect(HourHandler.getInstance()['force3Digit'](null)).to.equal("000");
        expect(HourHandler.getInstance()['force3Digit'](2)).to.equal("002");
        expect(HourHandler.getInstance()['force3Digit'](45)).to.equal("045");
        expect(HourHandler.getInstance()['force3Digit'](867)).to.equal("867");

    });

});
