import ISimpleNumberVarData from '../../../../../src/shared/modules/Var/interfaces/ISimpleNumberVarData';
import FakeDataParamVO from './FakeDataParamVO';

export default class FakeDataVO extends FakeDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "fake_data";

    public static TYPE_INFO_LABELS: string[] = [
        'var_data.type_info.default',
        'var_data.type_info.import',
        'var_data.type_info.nodata'];
    public static TYPE_INFO_DEFAULT: number = 0;
    public static TYPE_INFO_IMPORT: number = 1;
    public static TYPE_INFO_NODATA: number = 2;

    public _type: string = FakeDataVO.API_TYPE_ID;
    public datafound: boolean;
    public types_info: number[];

    public value: number;
}