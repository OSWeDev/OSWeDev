import { Component, Prop, Watch } from 'vue-property-decorator';
import MixedinVue from '../../../../../ts/mixins/MixedinVue';

@Component({
    template: require('./planning_rdv_animateurs_boutique_ba_infos.pug')
})
export default class VuePlanningRDVAnimateursBoutiqueBaInfosComponent extends MixedinVue {

    @Prop()
    private title;
    @Prop()
    private content;

    private mounted() {
        $(this.$refs.ba_infos_content).html(this.content);
    }

    @Watch('content')
    private onchange_content() {

        $(this.$refs.ba_infos_content).html(this.content);
    }
}