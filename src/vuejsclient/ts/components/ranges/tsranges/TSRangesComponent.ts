import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import VueComponentBase from '../../VueComponentBase';
import '../RangesComponent.scss';

@Component({
    template: require('./TSRangesComponent.pug'),
    components: {}
})
export default class TSRangesComponent extends VueComponentBase {

    @Prop({ default: null })
    private ranges: TSRange[];

    @Prop({ default: 10 })
    private limit: number;

    private force_override_limit: boolean = false;
}