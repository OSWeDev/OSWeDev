import { expect, test } from '@playwright/test';
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import ImportTypeXLSXHandler from '../../../src/server/modules/DataImport/ImportTypeHandlers/ImportTypeXLSXHandler';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

test('ImportTypeXLSXHandler: test getMomentFromXLSDateString', () => {
    expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString(null)).toStrictEqual(null);
    expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('aa')).toStrictEqual(null);

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');


    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');

    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
    expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201 10:00:00'), 'YYYY-MM-DD')).toStrictEqual('2019-02-01');
});