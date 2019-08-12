import VarDataSetDescriptor from './VarDataSetDescriptor';

export default class VarPieDataSetDescriptor extends VarDataSetDescriptor {

    public backgrounds: string[] = [];

    public constructor(
        public var_id: number,
        public label_translatable_code: string = null,
    ) {
        super(var_id, label_translatable_code);
    }

    public set_backgrounds(backgrounds: string[]): VarPieDataSetDescriptor {
        this.backgrounds = backgrounds;
        return this;
    }
}