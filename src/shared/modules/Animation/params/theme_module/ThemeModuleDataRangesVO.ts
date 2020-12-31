import { Moment } from 'moment';
import ISimpleNumberVarData from '../../../Var/interfaces/ISimpleNumberVarData';
import ThemeModuleDataParamRangesVO from './ThemeModuleDataParamRangesVO';

export default class ThemeModuleDataRangesVO extends ThemeModuleDataParamRangesVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "theme_module_data_ranges";

    public _type: string = ThemeModuleDataRangesVO.API_TYPE_ID;

    public datafound: boolean;

    public value: number;

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}