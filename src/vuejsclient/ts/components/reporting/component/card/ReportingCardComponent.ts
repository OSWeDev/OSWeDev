import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import CardVO from '../../vos/CardVO';

@Component({
    template: require('./ReportingCardComponent.pug'),
    components: {}
})
export default class ReportingCardComponent extends VueComponentBase {

    public static EMIT_SELECT_EVENT_NAME: string = "select";
    public static EMIT_UNSELECT_EVENT_NAME: string = "unselect";

    @Prop()
    private title: string;
    @Prop()
    private img_type: string;
    @Prop()
    private img_src: string;
    @Prop()
    private description: string;
    @Prop()
    private activable: boolean;
    @Prop()
    private activated: boolean;

    private img_type_icon: string = CardVO.IMG_TYPE_ICON;
    private img_type_img: string = CardVO.IMG_TYPE_IMG;

    get cardClasses() {
        return this.activable ? (this.activated ? 'activated' : 'activable') : '';
    }

    private emitSelection() {
        if (this.activated) {
            this.$emit(ReportingCardComponent.EMIT_UNSELECT_EVENT_NAME);
            return;
        }

        if (this.activable) {
            this.$emit(ReportingCardComponent.EMIT_SELECT_EVENT_NAME);
            return;
        }
    }
}