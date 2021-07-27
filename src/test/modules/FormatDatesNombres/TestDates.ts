import { expect } from 'chai';
import 'mocha';

import * as moment from 'moment';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

describe('Dates', () => {

    it('now', () => {
        let b = moment().utc(true).unix();
        let a = Dates.now();
        expect(a - b).to.be.lessThan(2);
    });

    it('add', () => {
        let b = moment().utc(true).add(1, 'day').unix();
        let a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_DAY);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).add(1, 'hour').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_HOUR);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).add(1, 'month').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MONTH);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).add(1, 'year').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).add(1, 'week').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_WEEK);
        expect(a - b).to.be.lessThan(2);
    });

    it('startOf', () => {
        let b = moment().utc(true).startOf('day').unix();
        let a = Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).startOf('hour').unix();
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_HOUR);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).startOf('month').unix();
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_MONTH);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).startOf('year').unix();
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_YEAR);
        expect(a - b).to.be.lessThan(2);

        b = moment().utc(true).startOf('week').unix();
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_WEEK);
        expect(a - b).to.be.lessThan(2);
    });

    it('format', () => {
        let b = moment().utc(true).startOf('day');
        let a = Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment().utc(true).startOf('hour');
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_HOUR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment().utc(true).startOf('month');
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_MONTH);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment().utc(true).startOf('year');
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_YEAR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment().utc(true).startOf('week');
        a = Dates.startOf(Dates.now(), TimeSegment.TYPE_WEEK);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));
    });

    it('diff', () => {
        let a1 = Dates.now();

        let a = Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY);
        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, false)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'day', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, false)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'hour', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, false)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'minute', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, false)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'second', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, true)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'day', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, true)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'hour', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, true)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'minute', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, true)).to.equal(moment(a1).utc(true).diff(moment(a).utc(true), 'second', true));
    });
});