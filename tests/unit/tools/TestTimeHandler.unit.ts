import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';

import TimeHandler from '../../../src/shared/tools/TimeHandler';
import moment from 'moment';

test('TimeHandler: formatMinutePrecisionTime', () => {
    expect(TimeHandler.getInstance().formatMinutePrecisionTime(null)).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0h')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0h0')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0:')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0:0')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0H')).toStrictEqual('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0H0')).toStrictEqual('00:00');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2')).toStrictEqual('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h')).toStrictEqual('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h5')).toStrictEqual('02:05');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:')).toStrictEqual('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:6')).toStrictEqual('02:06');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2H')).toStrictEqual('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2H7')).toStrictEqual('02:07');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('25')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('-1h')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h-5')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:0:5')).toStrictEqual('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23:60')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23H')).toStrictEqual('23:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('12H57')).toStrictEqual('12:57');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('null')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('1hm')).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('13h30')).toStrictEqual('13:30');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('20H45')).toStrictEqual('20:45');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23:0')).toStrictEqual('23:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('03:12')).toStrictEqual('03:12');
});

test('TimeHandler: formatMomentMinutePrecisionTime', () => {
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(null)).toStrictEqual(null);
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 00:00:05'))).toStrictEqual("00:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 00:01:05'))).toStrictEqual("00:01");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 10:00:05'))).toStrictEqual("10:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 24:00:00'))).toStrictEqual("00:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 23:59:59'))).toStrictEqual("23:59");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 05:11:05'))).toStrictEqual("05:11");
});