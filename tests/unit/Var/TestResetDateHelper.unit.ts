/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();


import { expect, test } from '@playwright/test';

import ResetDateHelper from '../../../src/shared/modules/Var/ResetDateHelper';
import moment from 'moment';

test('ResetDateHelper: test getClosestPreviousResetDate', async () => {

    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 31, 11)).toStrictEqual(moment('2019-12-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 31, 11)).toStrictEqual(moment('2019-12-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 1, 0)).toStrictEqual(moment('2020-01-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 1, 0)).toStrictEqual(moment('2019-01-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 2, 0)).toStrictEqual(moment('2019-01-02').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 2, 0)).toStrictEqual(moment('2019-01-02').startOf('day').utc(true).unix());

    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 31, 4)).toStrictEqual(moment('2019-05-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 31, 4)).toStrictEqual(moment('2019-05-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 1, 5)).toStrictEqual(moment('2019-06-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 1, 5)).toStrictEqual(moment('2019-06-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, true, 2, 5)).toStrictEqual(moment('2019-06-02').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, true, 2, 5)).toStrictEqual(moment('2019-06-02').startOf('day').utc(true).unix());

    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 31, 11)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 31, 11)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 1, 0)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 1, 0)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 2, 0)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 2, 0)).toStrictEqual(null);

    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 31, 4)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 31, 4)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 1, 5)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 1, 5)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, false, 2, 5)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestPreviousResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, false, 2, 5)).toStrictEqual(null);
});

test('ResetDateHelper: test getClosestNextResetDate', async () => {

    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 11)).toStrictEqual(moment('2020-12-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 0)).toStrictEqual(moment('2020-01-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 0)).toStrictEqual(moment('2020-01-02').startOf('day').utc(true).unix());

    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 4)).toStrictEqual(moment('2020-05-31').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 5)).toStrictEqual(moment('2020-06-01').startOf('day').utc(true).unix());
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 5)).toStrictEqual(moment('2020-06-02').startOf('day').utc(true).unix());

    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 11)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 0)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 0)).toStrictEqual(null);

    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 4)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 5)).toStrictEqual(null);
    expect(ResetDateHelper.getInstance().getClosestNextResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 5)).toStrictEqual(null);
});

test('ResetDateHelper: test isResetDate', async () => {

    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 11)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 0)).toStrictEqual(true);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 0)).toStrictEqual(false);

    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 31, 4)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 1, 5)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), true, 2, 5)).toStrictEqual(false);

    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 11)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 0)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 0)).toStrictEqual(false);

    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 31, 4)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 1, 5)).toStrictEqual(false);
    expect(ResetDateHelper.getInstance().isResetDate(moment('2020-01-01').startOf('day').utc(true).unix(), false, 2, 5)).toStrictEqual(false);
});