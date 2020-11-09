import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import VueComponentBase from '../../VueComponentBase';
import '../RangesComponent.scss';

@Component({
    template: require('./HourRangesComponent.pug'),
    components: {}
})
export default class HourRangesComponent extends VueComponentBase {

    @Prop({ default: null })
    private ranges: HourRange[];
}