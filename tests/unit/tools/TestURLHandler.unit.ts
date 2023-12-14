import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from "playwright-test-coverage";
import URLHandler from '../../../src/shared/tools/URLHandler';

test('getUrlFromObj: should return URL encoded string from object', () => {
    const obj = {
        key1: 'value1',
        key2: 'value2',
    };
    const expectedResult = 'key1=value1&key2=value2';

    expect(URLHandler.getUrlFromObj(obj)).toEqual(expectedResult);
});

test('isValidRoute:should return true for valid route', () => {
    const validRoute = '/test-route';
    expect(URLHandler.isValidRoute(validRoute)).toBe(true);
});

test('isValidRoute:should return false for invalid route', () => {
    const invalidRoute = 'test-route';
    expect(URLHandler.isValidRoute(invalidRoute)).toBe(false);
});

test("getUrlFromObj:should get the URL from an object", async () => {
    const obj = {
        foo: "bar",
        baz: "qux",
    };
    const url = URLHandler.getUrlFromObj(obj);
    expect(url).toBe("foo=bar&baz=qux");
});

test("isValidRoute:should validate a valid route", async () => {
    const route = "/foo/bar?baz=qux#fragment";
    expect(URLHandler.isValidRoute(route)).toBe(true);
});

test("isValidRoute:should not validate an invalid route", async () => {
    const route = "/foo/bar?baz=qux#fragment&";
    expect(URLHandler.isValidRoute(route)).toBe(false);
});
