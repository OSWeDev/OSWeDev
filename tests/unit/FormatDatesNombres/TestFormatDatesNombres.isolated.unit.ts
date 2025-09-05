/**
 * Example of a better isolated unit test
 * This test focuses on testing a specific function without loading heavy dependencies
 */

import { test, expect } from '@playwright/test';

// Setup minimal test environment
import { setupMinimalTestEnvironment } from '../test-setup';
setupMinimalTestEnvironment();

// Import only what we need to test
import ModuleFormatDatesNombres from '../../../src/shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import moment from 'moment';

test.describe('ModuleFormatDatesNombres - Isolated Tests', () => {
    
    test.beforeAll(() => {
        // Any one-time setup needed
    });
    
    test.beforeEach(() => {
        // Setup before each test
    });

    test('formatMoment_to_YYYYMMDD_HHmmss - isolated test', () => {
        const module = ModuleFormatDatesNombres.getInstance();
        
        expect(module.formatMoment_to_YYYYMMDD_HHmmss(null)).toStrictEqual(null);
        expect(module.formatMoment_to_YYYYMMDD_HHmmss(moment("2013-02-08 23:00:00.000"))).toStrictEqual('08/02/2013 23:00:00');
        expect(module.formatMoment_to_YYYYMMDD_HHmmss(moment("0"))).toStrictEqual('01/01/2000 00:00:00');
    });

    test('formatNumber_sign - isolated test', () => {
        const module = ModuleFormatDatesNombres.getInstance();
        
        expect(module.formatNumber_sign(null)).toStrictEqual(null);
        expect(module.formatNumber_sign(0)).toStrictEqual("");
        expect(module.formatNumber_sign(22)).toStrictEqual("");
        expect(module.formatNumber_sign(22.6)).toStrictEqual("");
        expect(module.formatNumber_sign(-22)).toStrictEqual("-");
        expect(module.formatNumber_sign(-22.6)).toStrictEqual("-");
    });

    test('formatNumber_nodecimal - isolated test', () => {
        const module = ModuleFormatDatesNombres.getInstance();
        
        expect(module.formatNumber_nodecimal(null)).toStrictEqual(null);
        expect(module.formatNumber_nodecimal(0)).toStrictEqual("0");
        expect(module.formatNumber_nodecimal(-45.32)).toStrictEqual("-45");
        expect(module.formatNumber_nodecimal(1.32)).toStrictEqual("1");
        expect(module.formatNumber_nodecimal(10000.32)).toStrictEqual("10 000");
    });
});