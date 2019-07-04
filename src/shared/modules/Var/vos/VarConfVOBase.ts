import INamedVO from '../../../interfaces/INamedVO';

export default abstract class VarConfVOBase implements INamedVO {

    public id: number;
    public abstract _type: string;

    public name: string;

    public var_data_vo_type: string;

    public has_yearly_reset: boolean;
    public yearly_reset_day_in_month: number;
    public yearly_reset_month: number;
}