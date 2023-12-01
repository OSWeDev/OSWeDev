import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import CRUDHandler from '../../../src/shared/tools/CRUDHandler';

test('TestCRUDHandler: test getCRUDLink', () => {

    expect(CRUDHandler.getCRUDLink(null)).toStrictEqual(null);
    expect(CRUDHandler.getCRUDLink('a')).toStrictEqual('/manage/a');
    expect(CRUDHandler.getCRUDLink('b_a')).toStrictEqual('/manage/b_a');
});

test('TestCRUDHandler: test getCreateLink', () => {
    expect(CRUDHandler.getCreateLink(null, true)).toStrictEqual(null);
    expect(CRUDHandler.getCreateLink(null, false)).toStrictEqual(null);

    expect(CRUDHandler.getCreateLink('a', true)).toStrictEqual("#create_a");
    expect(CRUDHandler.getCreateLink('a', false)).toStrictEqual('/manage/a/create');

    expect(CRUDHandler.getCreateLink('b_a', true)).toStrictEqual("#create_b_a");
    expect(CRUDHandler.getCreateLink('b_a', false)).toStrictEqual('/manage/b_a/create');
});

test('TestCRUDHandler: test getDeleteLink', () => {
    expect(CRUDHandler.getDeleteLink(null, null)).toStrictEqual(null);
    expect(CRUDHandler.getDeleteLink(null, 1)).toStrictEqual(null);

    expect(CRUDHandler.getDeleteLink('a', null)).toStrictEqual(null);
    expect(CRUDHandler.getDeleteLink('a', 1)).toStrictEqual('/manage/a/delete/1');

    expect(CRUDHandler.getDeleteLink('b_a', null)).toStrictEqual(null);
    expect(CRUDHandler.getDeleteLink('b_a', 2)).toStrictEqual('/manage/b_a/delete/2');
});

test('TestCRUDHandler: test getUpdateLink', () => {
    expect(CRUDHandler.getUpdateLink(null, null)).toStrictEqual(null);
    expect(CRUDHandler.getUpdateLink(null, 1)).toStrictEqual(null);

    expect(CRUDHandler.getUpdateLink('a', null)).toStrictEqual(null);
    expect(CRUDHandler.getUpdateLink('a', 1)).toStrictEqual('/manage/a/update/1');

    expect(CRUDHandler.getUpdateLink('b_a', null)).toStrictEqual(null);
    expect(CRUDHandler.getUpdateLink('b_a', 2)).toStrictEqual('/manage/b_a/update/2');
});