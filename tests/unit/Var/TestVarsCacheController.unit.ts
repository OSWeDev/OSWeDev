import { test } from '@playwright/test';
import { cloneDeep } from 'lodash';
import VarServerControllerBase from '../../../src/server/modules/Var/VarServerControllerBase';
import VarsCacheController from '../../../src/server/modules/Var/VarsCacheController';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import VarCacheConfVO from '../../../src/shared/modules/Var/vos/VarCacheConfVO';
import VarPixelFieldConfVO from '../../../src/shared/modules/Var/vos/VarPixelFieldConfVO';
import RangeHandler from '../../../src/shared/tools/RangeHandler';
import FakeVarControllerDeps from './fakes/FakeVarControllerDeps';
import FakeEmpDayDataVO from './fakes/vos/FakeEmpDayDataVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';

ConsoleHandler.init();

test.describe('VarsCacheVarsCacheController', () => {
    let var_data: FakeEmpDayDataVO;
    let var_controller: VarServerControllerBase<any>;

    test.beforeEach(() => {
        // Initialize VarsCacheController with appropriate config
        var_data = new FakeEmpDayDataVO();
        var_controller = cloneDeep(FakeVarControllerDeps.getInstance());
        var_controller.var_cache_conf = new VarCacheConfVO();
    });

    test('BDD_do_cache_param_data - updates the BDD cache if data has ID', async () => {
        var_data.id = 1;
        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(true);
    });

    test('BDD_do_cache_param_data - does not update the BDD cache for non-requested param', async () => {
        var_controller.var_cache_conf.cache_bdd_only_requested_params = true;
        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(false);
    });

    test('BDD_do_cache_param_data - caches all never load chunks', async () => {
        var_controller.var_cache_conf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS;
        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(true);
    });

    test('BDD_do_cache_param_data - does not cache for VALUE_CACHE_STRATEGY_CACHE_NONE', async () => {
        var_controller.var_cache_conf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE;
        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(false);
    });

    test('BDD_do_cache_param_data - throws error for pixel strategy without pixel activation', async () => {
        var_controller.var_cache_conf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL;
        var_controller.varConf.pixel_activated = false;
        try {
            VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        } catch (error) {
            test.expect(error.message).toBe('Not Implemented');
        }
    });

    test('BDD_do_cache_param_data - does not cache for pixel strategy if cardinal is not 1', async () => {
        var_data.employee_id_ranges = [RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 10, true, true, NumSegment.TYPE_INT)];

        var_controller.varConf.pixel_activated = true;
        var_controller.var_cache_conf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL;
        let field = new VarPixelFieldConfVO();
        field.pixel_param_field_id = 'employee_id_ranges';
        field.pixel_range_type = NumRange.RANGE_TYPE;
        field.pixel_segmentation_type = NumSegment.TYPE_INT;
        field.pixel_vo_api_type_id = FakeEmpDayDataVO.API_TYPE_ID;
        field.pixel_vo_field_id = 'employee_id_ranges';
        var_controller.varConf.pixel_fields = [field];

        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(false);
    });

    test('BDD_do_cache_param_data - caches for pixel strategy if cardinal is 1', async () => {
        var_data.employee_id_ranges = [RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 1, true, true, NumSegment.TYPE_INT)];

        var_controller.varConf.pixel_activated = true;
        var_controller.var_cache_conf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL;
        let field = new VarPixelFieldConfVO();
        field.pixel_param_field_id = 'employee_id_ranges';
        field.pixel_range_type = NumRange.RANGE_TYPE;
        field.pixel_segmentation_type = NumSegment.TYPE_INT;
        field.pixel_vo_api_type_id = FakeEmpDayDataVO.API_TYPE_ID;
        field.pixel_vo_field_id = 'employee_id_ranges';
        var_controller.varConf.pixel_fields = [field];

        const result = VarsCacheController.BDD_do_cache_param_data(var_data, var_controller, false);
        test.expect(result).toBe(true);
    });
});