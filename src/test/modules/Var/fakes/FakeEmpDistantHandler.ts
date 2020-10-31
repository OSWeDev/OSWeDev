import * as moment from 'moment';
import DAOUpdateVOHolder from '../../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeEmpDistantHandler {

    public static initializeFakeEmpDistantVO() {

        let datatable_fields = [
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, 'Date'),
            new ModuleTableField('employee_id', ModuleTableField.FIELD_TYPE_int, 'Employee'),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
        ];

        VOsTypesManager.getInstance().registerModuleTable(new ModuleTable(null, FakeEmpDistantVO.API_TYPE_ID, () => new FakeEmpDistantVO(), datatable_fields, null));
    }

    public static get_distant_A(): FakeEmpDistantVO {
        let var_data: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data.id = 2;
        var_data.date = moment('2020-01-01').utc(true).startOf('day');
        var_data.value = 1;
        var_data.employee_id = 1;
        return var_data;
    }

    public static get_distant_A_Update(): DAOUpdateVOHolder<FakeEmpDistantVO> {
        let var_data_pre: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day');
        var_data_pre.employee_id = 1;
        var_data_pre.value = 1;

        let var_data_post: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day');
        var_data_post.employee_id = 2;
        var_data_post.value = 1;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }

    public static get_distant_A_empty_update(): DAOUpdateVOHolder<FakeEmpDistantVO> {
        let var_data_pre: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day');
        var_data_pre.value = 1;
        var_data_pre.employee_id = 1;

        let var_data_post: FakeEmpDistantVO = new FakeEmpDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day');
        var_data_post.value = 1;
        var_data_post.employee_id = 1;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }
}