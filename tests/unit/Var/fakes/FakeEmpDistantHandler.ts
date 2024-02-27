
import moment from 'moment';
import DAOUpdateVOHolder from '../../../../src/server/modules/DAO/vos/DAOUpdateVOHolder';
import ModuleTableVO from '../../../../src/shared/modules/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../src/shared/modules/ModuleTableFieldVO';
import VOsTypesManager from '../../../../src/shared/modules/VO/manager/VOsTypesManager';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeEmpDistantHandler {

    public static initializeFakeEmpDistantVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new('date', ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date'),
            ModuleTableFieldController.create_new('employee_id', ModuleTableFieldVO.FIELD_TYPE_int, 'Employee'),
            ModuleTableFieldController.create_new('value', ModuleTableFieldVO.FIELD_TYPE_float, 'Valeur'),
        ];

        VOsTypesManager.registerModuleTable(new ModuleTableVO(null, FakeEmpDistantVO.API_TYPE_ID, () => new FakeEmpDistantVO(), datatable_fields, null));
    }

    public static get_distant_A(): FakeEmpDistantVO {
        const var_data: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data.id = 2;
        var_data.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data.value = 1;
        var_data.employee_id = 1;
        return var_data;
    }

    public static get_distant_A_Update(): DAOUpdateVOHolder<FakeEmpDistantVO> {
        const var_data_pre: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_pre.employee_id = 1;
        var_data_pre.value = 1;

        const var_data_post: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_post.employee_id = 2;
        var_data_post.value = 1;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }

    public static get_distant_A_empty_update(): DAOUpdateVOHolder<FakeEmpDistantVO> {
        const var_data_pre: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_pre.value = 1;
        var_data_pre.employee_id = 1;

        const var_data_post: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_post.value = 1;
        var_data_post.employee_id = 1;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }
}