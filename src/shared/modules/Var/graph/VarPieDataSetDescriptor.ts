import VarDataSetDescriptor from './VarDataSetDescriptor';

export default class VarPieDataSetDescriptor extends VarDataSetDescriptor {

    public backgrounds: string[] = [];

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
}