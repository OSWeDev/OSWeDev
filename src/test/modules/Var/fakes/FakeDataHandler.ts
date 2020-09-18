import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VarsInitController from '../../../../shared/modules/Var/VarsInitController';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeDataHandler {

    public static initializeDayDataRangesVO() {

        let datatable_fields = [
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_DAY),
        ];

        VarsInitController.getInstance().register_var_data(FakeDataVO.API_TYPE_ID, () => FakeDataVO.createNew(null, null), datatable_fields, null);
    }
}