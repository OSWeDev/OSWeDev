/**
 * Improved version of FormatDatesNombres test with reduced verbosity
 */

import { test, expect } from "playwright-test-coverage";

// Suppress moment.js deprecation warnings for cleaner test output
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Deprecation warning')) {
        return; // Suppress moment.js warnings
    }
    originalWarn(...args);
};

// Set minimal API controller to avoid heavy imports if possible
try {
    const ServerAPIController = require('../../../src/server/modules/API/ServerAPIController').default;
    const APIControllerWrapper = require('../../../src/shared/modules/API/APIControllerWrapper').default;
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
} catch (e) {
    console.log('Note: Could not set up API controller, continuing with test...');
}

import ModuleFormatDatesNombres from '../../../src/shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { ARRONDI_TYPE_FLOOR, ARRONDI_TYPE_CEIL, ARRONDI_TYPE_ROUND } from '../../../src/shared/tools/Filters';
import moment from 'moment';

test.describe('ModuleFormatDatesNombres - Clean Tests', () => {

    test('formatMoment_to_YYYYMMDD_HHmmss', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("2013-02-08 23:00:00.000"))).toStrictEqual('08/02/2013 23:00:00');
        expect(ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment("0"))).toStrictEqual('01/01/2000 00:00:00');
    });

    test('formatYYYYMMDD_HHmmss_to_Moment', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment(null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('08/02/2013 23:00:00').format('YYYY-MM-DD')).toStrictEqual(moment("2013-02-08 23:00:00").format('YYYY-MM-DD'));
        expect(ModuleFormatDatesNombres.getInstance().formatYYYYMMDD_HHmmss_to_Moment('01/01/2000 00:00:00').format('YYYY-MM-DD')).toStrictEqual(moment("0").format('YYYY-MM-DD'));
    });

    test('formatDuration_to_HoursAndMinutes', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(null)).toStrictEqual(null);
        
        let durationTest: moment.Duration = moment.duration('23:00');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(23);
        
        durationTest = moment.duration('23:30');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(23.5);
        
        durationTest = moment.duration('0');
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(0);
        
        durationTest = moment.duration(5400000);
        expect(ModuleFormatDatesNombres.getInstance().formatDuration_to_HoursAndMinutes(durationTest)).toStrictEqual(1.5);
    });

    test('formatNumber_sign', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(0)).toStrictEqual("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22)).toStrictEqual("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(22.6)).toStrictEqual("");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22)).toStrictEqual("-");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_sign(-22.6)).toStrictEqual("-");
    });

    test('formatNumber_nodecimal', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(0)).toStrictEqual("0");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(-45.32)).toStrictEqual("-45");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(1.32)).toStrictEqual("1");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_nodecimal(10000.32)).toStrictEqual("10 000");
    });

    test('formatNumber_n_decimals', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(null, 1)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12, null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 1)).toStrictEqual("12,3");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.26, 3)).toStrictEqual("12,260");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.9, 0)).toStrictEqual("13");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.8, 0)).toStrictEqual("13");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(12.82, 1)).toStrictEqual("12,8");
    });

    test('formatNumber_arrondi', () => {
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, null, null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(null, 1, 1)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, null, 1)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1, 1, null)).toStrictEqual(null);
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.5, 1, ARRONDI_TYPE_ROUND)).toStrictEqual("2");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.4, 1, ARRONDI_TYPE_ROUND)).toStrictEqual("1");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_FLOOR)).toStrictEqual("1.5");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_FLOOR)).toStrictEqual("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.63, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("1.75");
        expect(ModuleFormatDatesNombres.getInstance().formatNumber_arrondi(1.8, 0.25, ARRONDI_TYPE_CEIL)).toStrictEqual("2");
    });
});