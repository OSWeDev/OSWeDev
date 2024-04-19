import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleOselia from '../../../../../shared/modules/Oselia/ModuleOselia';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../VueComponentBase';
import './OseliaReferrerActivationComponent.scss';

@Component({
    template: require('./OseliaReferrerActivationComponent.pug'),
    components: {}
})
export default class OseliaReferrerActivationComponent extends VueComponentBase {

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

    @Watch('referrer_code', { immediate: true })
    private async on_referrer_code_change() {
        this.throttle_init();
    }

    private async init() {
        const account_has_waiting_link: "validated" | "waiting" | "none" = await ModuleOselia.getInstance().account_waiting_link_status(this.referrer_code);

        if (account_has_waiting_link == "validated") {
            this.redirect_to_oselia();
            return;
        }

        if (account_has_waiting_link == "none") {
            this.$router.push({
                name: 'oselia_referrer_not_found'
            });

            return;
        }

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

        const container = this.frame.parentNode;  // obtenir le div conteneur
        container.removeChild(this.frame);  // supprimer l'iframe du div
    }

    private redirect_to_oselia() {
        window.location.href = '/api_handler/Oselia.open_oselia_db/' + this.referrer_code + '/' + this.referrer_user_uid + '/' + this.openai_thread_id + '/' + this.openai_assistant_id;
    }
}