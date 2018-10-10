import { Component, Prop, Watch } from 'vue-property-decorator';
import MixedinVue from '../../../../../ts/mixins/MixedinVue';

@Component({
    template: require('./planning_rdv_animateurs_boutique_cr_field.pug')
})
export default class VuePlanningRDVAnimateursBoutiqueCrFieldComponent extends MixedinVue {

    @Prop()
    private title;
    @Prop()
    private content;
    @Prop()
    private previsite;

    private mounted() {
        $(this.$refs.ba_infos_content).html(this.content);
    }

    get prefix() {
        if (typeof this.previsite != "undefined") {
            return true;
        }
        return false;
    }

    @Watch('content')
    private onchange_content() {
        $(this.$refs.ba_infos_content).html(this.content);
    }
}