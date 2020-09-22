/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import ResetDateHelper from '../../../shared/modules/Var/ResetDateHelper';

describe('ResetDateHelper', () => {

    it('test getClosestPreviousResetDate', async () => {

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 31, 11).unix()).to.equal(moment('2019-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 31, 11).unix()).to.equal(moment('2019-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 1, 0).unix()).to.equal(moment('2020-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 1, 0).unix()).to.equal(moment('2019-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 2, 0).unix()).to.equal(moment('2019-01-02').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 2, 0).unix()).to.equal(moment('2019-01-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 31, 4).unix()).to.equal(moment('2019-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 31, 4).unix()).to.equal(moment('2019-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 1, 5).unix()).to.equal(moment('2019-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 1, 5).unix()).to.equal(moment('2019-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, true, 2, 5).unix()).to.equal(moment('2019-06-02').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, true, 2, 5).unix()).to.equal(moment('2019-06-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 2, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 2, 0)).to.equal(null);

        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), true, false, 2, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true), false, false, 2, 5)).to.equal(null);
    });

    it('test getClosestNextResetDate', async () => {

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 31, 11).unix()).to.equal(moment('2020-12-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 1, 0).unix()).to.equal(moment('2020-01-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 2, 0).unix()).to.equal(moment('2020-01-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 31, 4).unix()).to.equal(moment('2020-05-31').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 1, 5).unix()).to.equal(moment('2020-06-01').startOf('day').utc(true).unix());
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), true, 2, 5).unix()).to.equal(moment('2020-06-02').startOf('day').utc(true).unix());

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 31, 11)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 1, 0)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 2, 0)).to.equal(null);

        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 31, 4)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 1, 5)).to.equal(null);
        expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true), false, 2, 5)).to.equal(null);
    });

    it('test isResetDate', async () => {

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 31, 11)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 1, 0)).to.equal(true);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 2, 0)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 31, 4)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 1, 5)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), true, 2, 5)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 31, 11)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 1, 0)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 2, 0)).to.equal(false);

        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 31, 4)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 1, 5)).to.equal(false);
        expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true), false, 2, 5)).to.equal(false);
    });

});