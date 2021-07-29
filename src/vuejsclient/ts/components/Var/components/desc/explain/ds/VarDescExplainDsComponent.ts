import { Duration, Moment } from 'moment';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { Component, Prop } from 'vue-property-decorator';
import TypesHandler from '../../../../../../../../shared/tools/TypesHandler';
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

    @Prop({ default: null })
    private ds_data_jsoned: string;

    private opened: boolean = true;

    get ds_data_parsed() {
        if (!this.ds_data_jsoned) {
            return {};
        }

        try {
            return this.translate_moments_to_date(JSON.parse(this.ds_data_jsoned));
        } catch (error) {
        }
        return this.ds_data_jsoned;
    }

    private translate_moments_to_date(e: any) {

        if (TypesHandler.getInstance().isMoment(e)) {
            return (e as Moment).toISOString();
        }

        if (TypesHandler.getInstance().isDuration(e)) {
            return (e as Duration).toISOString();
        }

        if (TypesHandler.getInstance().isObject(e)) {
            for (let field_id in e) {
                e[field_id] = this.translate_moments_to_date(e[field_id]);
            }
        }
        return e;
    }
}