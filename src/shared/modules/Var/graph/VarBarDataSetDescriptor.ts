import VarDataSetDescriptor from './VarDataSetDescriptor';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';

export default class VarBarDataSetDescriptor extends VarDataSetDescriptor {

    public bg_color: string = null;
    public type: string = null;
    public var_param_transformer: (param: IVarDataVOBase) => IVarDataVOBase = null;
    public var_value_filter: (param: IVarDataVOBase, value: number) => boolean = null;

    public constructor(
        public var_id: number,
        public label_translatable_code: string,
        public y_axis_id: string
    ) {
        super(var_id, label_translatable_code);
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

    public set_var_value_filter(var_value_filter: (param: IVarDataVOBase, value: number) => boolean): VarBarDataSetDescriptor {
        this.var_value_filter = var_value_filter;
        return this;
    }

    public set_var_param_transformer(var_param_transformer: (param: IVarDataVOBase) => IVarDataVOBase): VarBarDataSetDescriptor {
        this.var_param_transformer = var_param_transformer;
        return this;
    }
}