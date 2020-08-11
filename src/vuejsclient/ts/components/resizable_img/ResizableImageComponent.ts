import debounce from 'lodash/debounce';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleImageFormat from '../../../../shared/modules/ImageFormat/ModuleImageFormat';
import FormattedImageVO from '../../../../shared/modules/ImageFormat/vos/FormattedImageVO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ResizableImageComponent.scss';


@Component({
    template: require('./ResizableImageComponent.pug'),
    components: {}
})
export default class ResizableImageComponent extends VueComponentBase {

    @Prop()
    protected src: string;
    @Prop()
    protected format_name: string;
    @Prop()
    protected width: number;
    @Prop()
    protected height: number;

    private formatted_img: FormattedImageVO = null;
    private debounced_load_formatted_img = debounce(this.load_formatted_img, 1000);

    @Watch('src')
    @Watch('format_name')
    public async onchange_params() {
        this.formatted_img = null;
        this.debounced_load_formatted_img();
    }

    public async mounted() {
        let self = this;
        this.$nextTick(() => {
            self.load_formatted_img();
        });
    }

    public async load_formatted_img() {
        this.formatted_img = await ModuleImageFormat.getInstance().get_formatted_image(this.src, this.format_name, this.width, this.height);
    }
}