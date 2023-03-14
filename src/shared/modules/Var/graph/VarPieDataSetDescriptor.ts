import VarDataSetDescriptor from './VarDataSetDescriptor';

export default class VarPieDataSetDescriptor extends VarDataSetDescriptor {

    public backgrounds: string[] = [];
    public bordercolors: string[] = [];
    public borderwidths: number[] = [];

    public constructor(
        public var_name: string,
        public label_translatable_code: string = null,
    ) {
        super(var_name, label_translatable_code);
    }

    public set_backgrounds(backgrounds: string[]): VarPieDataSetDescriptor {
        this.backgrounds = backgrounds;
        return this;
    }

    public set_bordercolors(bordercolors: string[]): VarPieDataSetDescriptor {
        this.bordercolors = bordercolors;
        return this;
    }

    public set_borderwidths(borderwidths: number[]): VarPieDataSetDescriptor {
        this.borderwidths = borderwidths;
        return this;
    }
}