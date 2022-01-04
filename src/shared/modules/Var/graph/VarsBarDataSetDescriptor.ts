import MainAggregateOperatorsHandlers from '../MainAggregateOperatorsHandlers';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarDataSetDescriptor from './VarDataSetDescriptor';

export default class VarsBarDataSetDescriptor extends VarDataSetDescriptor {

    public bg_color: string = null;
    public border_color: string = null;
    public type: string = null;
    public var_value_filter: (param: VarDataBaseVO, value: number) => boolean = null;
    public dataset_options_overrides: any = null;

    public constructor(
        public var_name: string,
        public label_translatable_code: string,
        public y_axis_id: string,
        public vars_params_by_label_index: { [label_index: number]: VarDataBaseVO[] },
        public var_value_callback: (var_values: number[]) => any = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM,
        public filter: (...params) => number = null,
        public filter_additional_params: any[] = null
    ) {
        super(var_name, label_translatable_code);
    }
    public set_var_value_filter(var_value_filter: (param: VarDataBaseVO, value: number) => boolean): VarsBarDataSetDescriptor {
        this.var_value_filter = var_value_filter;
        return this;
    }

    public set_dataset_options_overrides(dataset_options_overrides: any): VarsBarDataSetDescriptor {
        this.dataset_options_overrides = dataset_options_overrides;
        return this;
    }

    public set_bg_color(bg_color: string): VarsBarDataSetDescriptor {
        this.bg_color = bg_color;
        return this;
    }

    public set_border_color(border_color: string): VarsBarDataSetDescriptor {
        this.border_color = border_color;
        return this;
    }

    public set_type(type: string): VarsBarDataSetDescriptor {
        this.type = type;
        return this;
    }
}