import 'vue-json-pretty/lib/styles.css';
import VueJsonPretty from 'vue-json-pretty';
import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../../VueComponentBase';
import './VarDescExplainDsComponent.scss';

@Component({
    template: require('./VarDescExplainDsComponent.pug'),
    components: {
        Vardescdscomponent: () => import(/* webpackChunkName: "VarDescDsComponent" */ '../../ds/VarDescDsComponent'),
        VueJsonPretty
    }
})
export default class VarDescExplainDsComponent extends VueComponentBase {

    @Prop()
    private ds_name: string;

    @Prop()
    private ds_data_jsoned: string;

    private opened: boolean = true;
}