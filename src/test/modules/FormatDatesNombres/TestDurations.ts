import { expect } from 'chai';
import 'mocha';

import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import moment = require("moment");
import HourSegment from "../../../shared/modules/DataRender/vos/HourSegment";
import Durations from '../../../shared/modules/FormatDatesNombres/Dates/Durations';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

describe('Durations', () => {

    const basicDate = 1627903493; // 2-08-2021 11:24:53 GMT
    const edgeDate = 1583020799; // 29-02-2020 23:59:59 GMT
    const reverseEdgeDate = 1583020800;  // 00-03-2020 00:00:00 GMT

    it('add', () => {
        // Add 1
        let b = moment.unix(basicDate).utc().add(1, 'hour').unix();
        let a = Durations.add(basicDate, 1, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'minute').unix();
        a = Durations.add(basicDate, 1, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'second').unix();
        a = Durations.add(basicDate, 1, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'hour').unix();
        a = Durations.add(edgeDate, 1, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'minute').unix();
        a = Durations.add(edgeDate, 1, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'second').unix();
        a = Durations.add(edgeDate, 1, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        // Add 0
        expect(Durations.add(basicDate, 0, HourSegment.TYPE_HOUR)).to.equal(basicDate);
        expect(Durations.add(basicDate, 0, HourSegment.TYPE_MINUTE)).to.equal(basicDate);
        expect(Durations.add(basicDate, 0, HourSegment.TYPE_SECOND)).to.equal(basicDate);

        // Remove 1
        b = moment.unix(basicDate).utc().add(-1, 'hour').unix();
        a = Durations.add(basicDate, -1, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'minute').unix();
        a = Durations.add(basicDate, -1, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'second').unix();
        a = Durations.add(basicDate, -1, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'hour').unix();
        a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'minute').unix();
        a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'second').unix();
        a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        // Add decimal number
        b = moment.unix(basicDate).utc().add(0.125, 'hour').unix();
        a = Durations.add(basicDate, 0.125, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-0.25, 'hour').unix();
        a = Durations.add(basicDate, -0.25, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(0.333, 'minute').unix();
        a = Durations.add(basicDate, 0.333, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-0.2, 'minute').unix();
        a = Durations.add(basicDate, -0.2, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(0.654, 'second').unix();
        a = Durations.add(basicDate, 0.654, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1.33, 'second').unix();
        a = Durations.add(basicDate, -1.33, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        // Autres (overflow, changement d'heure...)
        b = moment.unix(basicDate).utc().add(25, 'hour').unix();
        a = Durations.add(basicDate, 25, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(70, 'minute').unix();
        a = Durations.add(basicDate, 70, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(70, 'second').unix();
        a = Durations.add(basicDate, 70, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(1616864400).utc().add(15, 'hour').unix();  // 27-03-2021 18:00:00 GMT
        a = Durations.add(1616864400, 15, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        // Forbidden values
        b = moment.unix(basicDate).utc().add(null, 'hour').unix();
        a = Durations.add(basicDate, null, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(undefined, 'minute').unix();
        a = Durations.add(basicDate, undefined, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(NaN, 'second').unix();
        a = Durations.add(basicDate, NaN, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b);
    });
});