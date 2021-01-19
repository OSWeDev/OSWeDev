import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
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



});
