import { LinearScale } from 'chart.js';
import VarDataSetDescriptor from './VarDataSetDescriptor';


interface IPlotScale extends LinearScale { }

/**
 * The aim of this class is to describe a dataset for a mixed chart.
 *
 * @see https://www.chartjs.org/docs/latest/charts/mixed.html
 */
export default class VarMixedChartDataSetDescriptor extends VarDataSetDescriptor {

    public scales: { y?: Partial<IPlotScale>, x?: Partial<IPlotScale>, r?: Partial<IPlotScale> } = { y: {}, x: {}, r: {} };
    public backgrounds: string[] = [];
    public bordercolors: string[] = [];
    public borderwidths: number[] = [];

    public constructor(
        public var_name: string,
        public label_translatable_code: string = null,
    ) {
        super(var_name, label_translatable_code);
    }

    public set_backgrounds(backgrounds: string[]): VarMixedChartDataSetDescriptor {
        this.backgrounds = backgrounds;

        return this;
    }

    public set_bordercolors(bordercolors: string[]): VarMixedChartDataSetDescriptor {
        this.bordercolors = bordercolors;

        return this;
    }

    public set_borderwidths(borderwidths: number[]): VarMixedChartDataSetDescriptor {
        this.borderwidths = borderwidths;

        return this;
    }
}