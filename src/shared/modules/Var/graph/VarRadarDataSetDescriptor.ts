import { RadialLinearScale } from 'chart.js';
import VarDataSetDescriptor from './VarDataSetDescriptor';


interface IPlotScale extends RadialLinearScale { }


export default class VarRadarDataSetDescriptor extends VarDataSetDescriptor {

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

    public set_backgrounds(backgrounds: string[]): VarRadarDataSetDescriptor {
        this.backgrounds = backgrounds;

        return this;
    }

    public set_bordercolors(bordercolors: string[]): VarRadarDataSetDescriptor {
        this.bordercolors = bordercolors;

        return this;
    }

    public set_borderwidths(borderwidths: number[]): VarRadarDataSetDescriptor {
        this.borderwidths = borderwidths;

        return this;
    }
}