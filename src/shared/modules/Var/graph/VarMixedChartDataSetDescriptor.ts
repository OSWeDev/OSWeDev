import { LinearScale } from 'chart.js';

import VarDataSetDescriptor from './VarDataSetDescriptor';

// TODO: Can be extended to add more scales @see https://www.chartjs.org/docs/latest/api/classes/Scale.html
interface IPlotScale extends LinearScale { }

/**
 * The aim of this class is to describe a dataset for a mixed chart.
 *
 * @see https://www.chartjs.org/docs/latest/charts/mixed.html
 */
export default class VarMixedChartDataSetDescriptor extends VarDataSetDescriptor {

    public scales: { y?: Partial<IPlotScale>, x?: Partial<IPlotScale>, r?: Partial<IPlotScale> } = { y: {}, x: {}, r: {} };
    public type: string | 'line' | 'bar' | 'radar' = '';
    public backgroundColor: string[] = [];
    public borderColor: string[] = [];
    public borderWidth: number[] = [];
    public gradients: boolean[] = [];
    public filters_types: string = '';
    public filters_additional_params: string = '';
    public activate_datalabels: boolean = false;
    public show_zeros: boolean = false;
    public show_points: boolean = false;
    public value_label_size: number = 18;

    public constructor(
        public var_name: string,
        public label_translatable_code: string = null,
    ) {
        super(var_name, label_translatable_code);
    }

    public set_gradients(gradients: boolean[]): VarMixedChartDataSetDescriptor {
        this.gradients = gradients;

        return this;
    }

    public set_type(type: string | 'line' | 'bar' | 'radar'): VarMixedChartDataSetDescriptor {
        this.type = type;

        return this;
    }

    public set_backgrounds(backgroundColor: string[]): VarMixedChartDataSetDescriptor {
        this.backgroundColor = backgroundColor;

        return this;
    }

    public set_bordercolors(borderColor: string[]): VarMixedChartDataSetDescriptor {
        this.borderColor = borderColor;

        return this;
    }

    public set_borderwidths(borderWidth: number[]): VarMixedChartDataSetDescriptor {
        this.borderWidth = borderWidth;

        return this;
    }

    public set_value_label_size(value_label_size: number): VarMixedChartDataSetDescriptor {
        this.value_label_size = value_label_size;

        return this;
    }

    public set_filters_type(filter_type: string): VarMixedChartDataSetDescriptor {
        this.filters_types = filter_type;

        return this;
    }

    public set_filters_additional_params(filter_additional_params: string): VarMixedChartDataSetDescriptor {
        this.filters_additional_params = filter_additional_params;

        return this;
    }

    public set_activate_datalabels(activate_datalabels: boolean): VarMixedChartDataSetDescriptor {
        this.activate_datalabels = activate_datalabels;

        return this;
    }

    public set_show_zeros(show_zeros: boolean): VarMixedChartDataSetDescriptor {
        this.show_zeros = show_zeros;

        return this;
    }

    public set_show_points(show_points: boolean): VarMixedChartDataSetDescriptor {
        this.show_points = show_points;

        return this;
    }
}