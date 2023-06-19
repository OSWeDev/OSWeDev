/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();


import { expect } from 'chai';
import 'mocha';

import ResetDateHelper from '../../../shared/modules/Var/ResetDateHelper';
import moment from 'moment';

describe('ResetDateHelper', () => {

    it('test getClosestPreviousResetDate', async () => {

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 31, 11)).to.equal(moment('2019-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 31, 11)).to.equal(moment('2019-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 1, 0)).to.equal(moment('2020-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 1, 0)).to.equal(moment('2019-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 2, 0)).to.equal(moment('2019-01-02').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 2, 0)).to.equal(moment('2019-01-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 31, 4)).to.equal(moment('2019-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 31, 4)).to.equal(moment('2019-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 1, 5)).to.equal(moment('2019-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 1, 5)).to.equal(moment('2019-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 2, 5)).to.equal(moment('2019-06-02').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 2, 5)).to.equal(moment('2019-06-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 2, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 2, 0)).to.equal(null);

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 2, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 2, 5)).to.equal(null);
    });

    it('test getClosestNextResetDate', async () => {

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 11)).to.equal(moment('2020-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 0)).to.equal(moment('2020-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 0)).to.equal(moment('2020-01-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 4)).to.equal(moment('2020-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 5)).to.equal(moment('2020-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 5)).to.equal(moment('2020-06-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 0)).to.equal(null);

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 5)).to.equal(null);
    });

    it('test isResetDate', async () => {

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 11)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 0)).to.equal(true);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 0)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 4)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 5)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 5)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 11)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 0)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 0)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 4)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 5)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 5)).to.equal(false);
    });

});