import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleOselia from '../../../../../shared/modules/Oselia/ModuleOselia';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../VueComponentBase';
import './OseliaReferrerNotFoundComponent.scss';

@Component({
    template: require('./OseliaReferrerNotFoundComponent.pug'),
    components: {}
})
export default class OseliaReferrerNotFoundComponent extends VueComponentBase {

    @Prop({ default: null })
    private referrer_code: string;

    @Prop({ default: null })
    private referrer_user_uid: string;

    @Prop({ default: null })
    private openai_thread_id: string;

    @Prop({ default: null })
    private openai_assistant_id: string;

    private referrer_name: string = null;
    private frame: HTMLElement = null;

    private throttle_init = ThrottleHelper.declare_throttle_without_args(this.init, 100);

    private async init() {
        this.referrer_name = await ModuleOselia.getInstance().get_referrer_name(this.referrer_code);
    }

    private async accept() {
        await ModuleOselia.getInstance().accept_link(this.referrer_code);
        this.redirect_to_oselia();
    }

    private async refuse() {
        await ModuleOselia.getInstance().refuse_link(this.referrer_code);
        this.close_iframe();
    }

    private mounted() {
        this.frame = parent.document.getElementById('OseliaContainer');
        if (!this.frame) {
            ConsoleHandler.error('OseliaContainer not found. The IFrame should have an id="OseliaContainer" in the parent document.');
        }
    }

    private close_iframe() {

        if (!this.frame) {
            return;
        }
        parent.document.body.removeChild(this.frame);
    }

    private redirect_to_oselia() {
        window.location.href = '/open_oselia_db/' + this.referrer_code + '/' + this.referrer_user_uid + '/' + this.openai_thread_id + '/' + this.openai_assistant_id;
    }
}