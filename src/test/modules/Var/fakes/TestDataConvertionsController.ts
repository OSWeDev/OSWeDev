import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDataVO from './vos/FakeDataVO';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';

export default class TestDataConvertionsController {

    public static getInstance(): TestDataConvertionsController {
        if (!TestDataConvertionsController.instance) {
            TestDataConvertionsController.instance = new TestDataConvertionsController();
        }
        return TestDataConvertionsController.instance;
    }

    protected static instance: TestDataConvertionsController = null;

    private constructor() { }

    /**
     * ATTENTION : on change le param directement sans copie
     * @param param l'objet que l'on veut convertir
     */
    public convert_EmpData_to_Data(param: FakeEmpDayDataVO): FakeDataVO {
        delete param.employee_id_ranges;
        param._type = FakeDataVO.API_TYPE_ID;
        delete param['_index'];
        return param;
    }

    /**
     * ATTENTION : on change le param directement sans copie
     * @param param l'objet que l'on veut convertir
     */
    public convert_Data_to_EmpData(param: FakeDataVO): FakeEmpDayDataVO {
        (param as FakeEmpDayDataVO).employee_id_ranges = [RangeHandler.getInstance().getMaxNumRange()];
        param._type = FakeEmpDayDataVO.API_TYPE_ID;
        delete param['_index'];
        return param as FakeEmpDayDataVO;
    }
}