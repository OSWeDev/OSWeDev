import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarDataSetDescriptor from './VarDataSetDescriptor';

export default class VarBarDataSetDescriptor extends VarDataSetDescriptor {

    public bg_color: string = null;
    public type: string = null;
    public var_param_transformer: (param: VarDataBaseVO) => VarDataBaseVO = null;
    public var_value_filter: (param: VarDataBaseVO, value: number) => boolean = null;

    public constructor(
        public var_name: string,
        public label_translatable_code: string,
        public y_axis_id: string
    ) {
        super(var_name, label_translatable_code);
    }

    public set_bg_color(bg_color: string): VarBarDataSetDescriptor {
        this.bg_color = bg_color;
        return this;
    }

    public set_y_axis_id(y_axis_id: string): VarBarDataSetDescriptor {
        this.y_axis_id = y_axis_id;
        return this;
    }

    public set_type(type: string): VarBarDataSetDescriptor {
        this.type = type;
        return this;
    }

    public set_var_value_filter(var_value_filter: (param: VarDataBaseVO, value: number) => boolean): VarBarDataSetDescriptor {
        this.var_value_filter = var_value_filter;
        return this;
    }

    public set_var_param_transformer(var_param_transformer: (param: VarDataBaseVO) => VarDataBaseVO): VarBarDataSetDescriptor {
        this.var_param_transformer = var_param_transformer;
        return this;
    }
}