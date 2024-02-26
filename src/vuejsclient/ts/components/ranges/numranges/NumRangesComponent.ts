import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../shared/modules/ModuleTableFieldVO';
import VueComponentBase from '../../VueComponentBase';
import '../RangesComponent.scss';

@Component({
    template: require('./NumRangesComponent.pug'),
    components: {}
})
export default class NumRangesComponent extends VueComponentBase {

    @Prop({ default: null })
    private ranges: NumRange[];

    @Prop({ default: null })
    private vo_field: ModuleTableFieldVO<any>;

    @Prop({ default: 10 })
    private limit: number;

    private force_override_limit: boolean = false;
}