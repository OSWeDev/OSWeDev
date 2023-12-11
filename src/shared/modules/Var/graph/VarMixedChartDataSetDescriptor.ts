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

    public constructor(
        public var_name: string,
        public label_translatable_code: string = null,
    ) {
        super(var_name, label_translatable_code);
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
}