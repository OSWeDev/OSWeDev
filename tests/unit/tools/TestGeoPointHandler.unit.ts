import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import GeoPointHandler from '../../../src/shared/tools/GeoPointHandler';
import GeoPointVO from '../../../src/shared/modules/GeoPoint/vos/GeoPointVO';

test('GeoPointHandler: test: format', () => {
    expect(GeoPointHandler.getInstance().format(null)).toStrictEqual(null);
    var geoPointVOTest = GeoPointVO.createNew(1, 1);
    expect(GeoPointHandler.getInstance().format(geoPointVOTest)).toStrictEqual('(1,1)');
    geoPointVOTest = GeoPointVO.createNew(1, null);
    expect(GeoPointHandler.getInstance().format(geoPointVOTest)).toStrictEqual(null);
    geoPointVOTest = GeoPointVO.createNew(null, 1);
    expect(GeoPointHandler.getInstance().format(geoPointVOTest)).toStrictEqual(null);
    geoPointVOTest = GeoPointVO.createNew(null, null);
    expect(GeoPointHandler.getInstance().format(geoPointVOTest)).toStrictEqual(null);
});
test('GeoPointHandler: test: split', () => {
    expect(GeoPointHandler.getInstance().split(null)).toStrictEqual(null);
    var geoPointVOTest = GeoPointVO.createNew(1, 1);
    expect(GeoPointHandler.getInstance().split("(1, 1)")).toStrictEqual(geoPointVOTest);
    var geoPointVOTest = GeoPointVO.createNew(9.5, 14.3);
    expect(GeoPointHandler.getInstance().split("(9.5, 14.3)")).toStrictEqual(geoPointVOTest);
    var geoPointVOTest = GeoPointVO.createNew(0, 0);
    expect(GeoPointHandler.getInstance().split("(0, 0)")).toStrictEqual(geoPointVOTest);
    expect(GeoPointHandler.getInstance().split("(a, b)")).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().split("(, )")).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().split("notAPosition")).toStrictEqual(null);
});
test('GeoPointHandler: test: geopoint', () => {
    expect(GeoPointHandler.getInstance().geopoint(null)).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().split("(null, 1)")).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().split("(1, null)")).toStrictEqual(null);
    var geoPointVOTest = GeoPointVO.createNew(1, 1);
    expect(GeoPointHandler.getInstance().geopoint("(1, 1)")).toStrictEqual(geoPointVOTest);
    expect(GeoPointHandler.getInstance().split("notAPosition")).toStrictEqual(null);
});
test('GeoPointHandler: test: longitude', () => {
    expect(GeoPointHandler.getInstance().longitude(null)).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().longitude("(null, 2)")).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().longitude("(1, 2)")).toStrictEqual(1);
    expect(GeoPointHandler.getInstance().longitude("notAPosition")).toStrictEqual(null);
});
test('GeoPointHandler: test: latitude', () => {
    expect(GeoPointHandler.getInstance().latitude(null)).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().longitude("(1, null)")).toStrictEqual(null);
    expect(GeoPointHandler.getInstance().latitude("(1, 2)")).toStrictEqual(2);
    expect(GeoPointHandler.getInstance().latitude("notAPosition")).toStrictEqual(null);
});
