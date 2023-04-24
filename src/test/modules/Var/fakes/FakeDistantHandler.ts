
import * as moment from 'moment';
import DAOUpdateVOHolder from '../../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import FakeDistantVO from './vos/FakeDistantVO';

export default class FakeDistantHandler {

    public static initializeFakeDistantVO() {

        let datatable_fields = [
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, 'Date'),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
        ];

        VOsTypesManager.registerModuleTable(new ModuleTable(null, FakeDistantVO.API_TYPE_ID, () => new FakeDistantVO(), datatable_fields, null));
    }

    public static get_distant_A(): FakeDistantVO {
        let var_data: FakeDistantVO = new FakeDistantVO();
        var_data.id = 1;
        var_data.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data.value = 1;
        return var_data;
    }

    public static get_distant_A_Update(): DAOUpdateVOHolder<FakeDistantVO> {
        let var_data_pre: FakeDistantVO = new FakeDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_pre.value = 1;

        let var_data_post: FakeDistantVO = new FakeDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_post.value = 2;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }

    public static get_distant_A_empty_update(): DAOUpdateVOHolder<FakeDistantVO> {
        let var_data_pre: FakeDistantVO = new FakeDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_pre.value = 1;

        let var_data_post: FakeDistantVO = new FakeDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_post.value = 1;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }

    public static get_distant_A2(): FakeDistantVO {
        let var_data: FakeDistantVO = new FakeDistantVO();
        var_data.id = 1;
        var_data.date = moment('2020-03-01').utc(true).startOf('day').unix();
        var_data.value = 5;
        return var_data;
    }

    public static get_distant_A2_Update(): DAOUpdateVOHolder<FakeDistantVO> {
        let var_data_pre: FakeDistantVO = new FakeDistantVO();
        var_data_pre.id = 1;
        var_data_pre.date = moment('2020-03-01').utc(true).startOf('day').unix();
        var_data_pre.value = 5;

        let var_data_post: FakeDistantVO = new FakeDistantVO();
        var_data_post.id = 1;
        var_data_post.date = moment('2020-01-01').utc(true).startOf('day').unix();
        var_data_post.value = 5;

        return new DAOUpdateVOHolder(var_data_pre, var_data_post);
    }
}