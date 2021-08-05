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

    it('from_segmentation', () => {
        let b = moment.duration(2, 'hours');
        let a = Durations.from_segmentation(2, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(2, 'minutes');
        a = Durations.from_segmentation(2, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(2, 'seconds');
        a = Durations.from_segmentation(2, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // Overflow
        b = moment.duration(28, 'hours');
        a = Durations.from_segmentation(28, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(75, 'minutes');
        a = Durations.from_segmentation(75, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(1441, 'minutes');
        a = Durations.from_segmentation(1441, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(120, 'seconds');
        a = Durations.from_segmentation(120, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(3601, 'seconds');
        a = Durations.from_segmentation(3601, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // Null duration
        b = moment.duration(0, 'hours');
        a = Durations.from_segmentation(0, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(0, 'minutes');
        a = Durations.from_segmentation(0, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(0, 'seconds');
        a = Durations.from_segmentation(0, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // Negative duration
        b = moment.duration(-2, 'hours');
        a = Durations.from_segmentation(-2, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(-2, 'minutes');
        a = Durations.from_segmentation(-2, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(-2, 'seconds');
        a = Durations.from_segmentation(-2, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // Decimal duration
        b = moment.duration(0.333, 'hours');
        a = Durations.from_segmentation(0.333, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(0.333, 'minutes');
        a = Durations.from_segmentation(0.333, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(0.333, 'seconds');
        a = Durations.from_segmentation(0.333, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // Forbidden values
        b = moment.duration(null, 'hours');
        a = Durations.from_segmentation(null, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(null, 'minutes');
        a = Durations.from_segmentation(null, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(null, 'seconds');
        a = Durations.from_segmentation(null, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(undefined, 'hours');
        a = Durations.from_segmentation(undefined, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(undefined, 'minutes');
        a = Durations.from_segmentation(undefined, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(undefined, 'seconds');
        a = Durations.from_segmentation(undefined, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(NaN, 'hours');
        a = Durations.from_segmentation(NaN, HourSegment.TYPE_HOUR);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(NaN, 'minutes');
        a = Durations.from_segmentation(NaN, HourSegment.TYPE_MINUTE);
        expect(a).to.equal(b.asSeconds());

        b = moment.duration(NaN, 'seconds');
        a = Durations.from_segmentation(NaN, HourSegment.TYPE_SECOND);
        expect(a).to.equal(b.asSeconds());

        // // Add 1
        // let b = moment.unix(0).utc().add(1, 'hour').unix();
        // let a = Durations.from_segmentation(1, HourSegment.TYPE_HOUR);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(1, 'minute').unix();
        // a = Durations.from_segmentation(1, HourSegment.TYPE_MINUTE);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(1, 'second').unix();
        // a = Durations.from_segmentation(1, HourSegment.TYPE_SECOND);
        // expect(a).to.equal(b);

        // // Add 0
        // expect(Durations.from_segmentation(0, HourSegment.TYPE_HOUR)).to.equal(0);
        // expect(Durations.from_segmentation(0, HourSegment.TYPE_MINUTE)).to.equal(0);
        // expect(Durations.from_segmentation(0, HourSegment.TYPE_SECOND)).to.equal(0);

        // // Remove 1
        // b = moment.unix(0).utc().add(-1, 'hour').unix();
        // a = Durations.from_segmentation(-1, HourSegment.TYPE_HOUR);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(-1, 'minute').unix();
        // a = Durations.from_segmentation(-1, HourSegment.TYPE_MINUTE);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(-1, 'second').unix();
        // a = Durations.from_segmentation(-1, HourSegment.TYPE_SECOND);
        // expect(a).to.equal(b);

        // // Add decimal number
        // b = moment.unix(0).utc().add(0.125, 'hour').unix();
        // a = Durations.from_segmentation(0.125, HourSegment.TYPE_HOUR);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(-0.25, 'hour').unix();
        // a = Durations.from_segmentation(-0.25, HourSegment.TYPE_HOUR);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(0.333, 'minute').unix();
        // a = Durations.from_segmentation(0.333, HourSegment.TYPE_MINUTE);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(-0.2, 'minute').unix();
        // a = Durations.from_segmentation(-0.2, HourSegment.TYPE_MINUTE);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(0.654, 'second').unix();
        // a = Durations.from_segmentation(0.654, HourSegment.TYPE_SECOND);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(-1.33, 'second').unix();
        // a = Durations.from_segmentation(-1.33, HourSegment.TYPE_SECOND);
        // expect(a).to.equal(b);

        // // Forbidden values
        // b = moment.unix(0).utc().add(null, 'hour').unix();
        // a = Durations.from_segmentation(null, HourSegment.TYPE_HOUR);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(undefined, 'minute').unix();
        // a = Durations.from_segmentation(undefined, HourSegment.TYPE_MINUTE);
        // expect(a).to.equal(b);

        // b = moment.unix(0).utc().add(NaN, 'second').unix();
        // a = Durations.from_segmentation(NaN, HourSegment.TYPE_SECOND);
        // expect(a).to.equal(b);
    });

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

    it('format', () => {
        expect(Durations.format(basicDate, "DD/MM/YYYY HH:mm:ss")).to.equal(moment.unix(basicDate).utc().format("DD/MM/YYYY HH:mm:ss"));
        expect(Durations.format(edgeDate, "DD/MM/YYYY HH:mm:ss")).to.equal(moment.unix(edgeDate).utc().format("DD/MM/YYYY HH:mm:ss"));
        expect(Durations.format(reverseEdgeDate, "DD/MM/YYYY HH:mm:ss")).to.equal(moment.unix(reverseEdgeDate).utc().format("DD/MM/YYYY HH:mm:ss"));
    });

    it('diff', () => {
        let a1 = edgeDate;
        let a = moment.unix(edgeDate).utc().add(-1, 'day').unix();

        expect(Durations.diff(a1, a, HourSegment.TYPE_HOUR, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', false));
        expect(Durations.diff(a1, a, HourSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', false));
        expect(Durations.diff(a1, a, HourSegment.TYPE_SECOND, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', false));

        expect(Durations.diff(a1, a, HourSegment.TYPE_HOUR, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', true));
        expect(Durations.diff(a1, a, HourSegment.TYPE_MINUTE, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', true));
        expect(Durations.diff(a1, a, HourSegment.TYPE_SECOND, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', true));

        expect(Durations.diff(a, a1, HourSegment.TYPE_HOUR, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'hour', false));
        expect(Durations.diff(a, a1, HourSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'minute', false));
        expect(Durations.diff(a, a1, HourSegment.TYPE_SECOND, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'second', false));

        // Forbidden values
        expect(Durations.diff(a1, undefined, HourSegment.TYPE_HOUR, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(undefined).utc(), 'hour', false));
        expect(Durations.diff(a1, null, HourSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(null).utc(), 'minute', false));
        expect(Durations.diff(a1, NaN, HourSegment.TYPE_SECOND, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(NaN).utc(), 'second', false));

        expect(Durations.diff(undefined, a, HourSegment.TYPE_HOUR, false)).to.equal(moment.unix(undefined).utc().diff(moment.unix(a).utc(), 'hour', false));
        expect(Durations.diff(null, a, HourSegment.TYPE_MINUTE, false)).to.equal(moment.unix(null).utc().diff(moment.unix(a).utc(), 'minute', false));
        expect(Durations.diff(NaN, a, HourSegment.TYPE_SECOND, false)).to.equal(moment.unix(NaN).utc().diff(moment.unix(a).utc(), 'second', false));
    });

    it('as', () => {

    });

    it('hours', () => {
        let b = moment().utc().hour();
        let a = Durations.hours(null);
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().hour(16).unix();
        a = Durations.hours(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Durations.hours(basicDate)).to.equal(moment.unix(basicDate).utc().hour());
        expect(Durations.hours(basicDate, 18)).to.equal(moment.unix(basicDate).utc().hour(18).unix());

        expect(Durations.hours(edgeDate, 25)).to.equal(moment.unix(edgeDate).utc().hour(25).unix());

        // Forbidden values
        expect(Durations.hours(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().hour(undefined));
        expect(Durations.hours(basicDate, NaN)).to.equal(moment.unix(basicDate).utc().hour(NaN).unix());
    });

    it('minutes', () => {
        let b = moment().utc(false).minute();
        let a = Durations.minutes(null);
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).minute(16).unix();
        a = Durations.minutes(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Durations.minutes(basicDate)).to.equal(moment.unix(basicDate).utc(false).minute());
        expect(Durations.minutes(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).minute(33).unix());
        expect(Durations.minutes(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).minute(70).unix());
        expect(Durations.minutes(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).minute(-10).unix());

        // forbidden values
        expect(Durations.minutes(undefined)).to.equal(moment.unix(undefined).utc(false).minute());
        expect(Durations.minutes(undefined, 18)).to.equal(moment.unix(undefined).utc(true).minute(18).unix());
        expect(Durations.minutes(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).minute(undefined));
    });

    it('seconds', () => {
        let b = moment().utc(false).second();
        let a = Durations.seconds(null);
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).second(16).unix();
        a = Durations.seconds(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Durations.seconds(basicDate)).to.equal(moment.unix(basicDate).utc(false).second());
        expect(Durations.seconds(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).second(33).unix());
        expect(Durations.seconds(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).second(70).unix());
        expect(Durations.seconds(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).second(-10).unix());

        // forbidden values
        expect(Durations.seconds(undefined)).to.equal(moment.unix(undefined).utc(false).second());
        expect(Durations.seconds(undefined, 18)).to.equal(moment.unix(undefined).utc(true).second(18).unix());
        expect(Durations.seconds(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).second(undefined));
    });
});