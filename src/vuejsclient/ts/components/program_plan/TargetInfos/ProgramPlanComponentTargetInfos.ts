import { Component, Prop, Watch } from 'vue-property-decorator';
import * as $ from 'jquery';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./ProgramPlanComponentTargetInfos.pug')
})
export default class ProgramPlanComponentTargetInfos extends VueComponentBase {

    @Prop()
    private title;
    @Prop()
    private content;

    private mounted() {
        $(this.$refs.target_infos_content).html(this.content);
    }

    @Watch('content')
    private onchange_content() {

        $(this.$refs.target_infos_content).html(this.content);
    }
}