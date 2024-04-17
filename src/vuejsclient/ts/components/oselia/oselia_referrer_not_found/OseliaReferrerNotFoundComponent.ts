import Component from 'vue-class-component';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../VueComponentBase';
import './OseliaReferrerNotFoundComponent.scss';

@Component({
    template: require('./OseliaReferrerNotFoundComponent.pug'),
    components: {}
})
export default class OseliaReferrerNotFoundComponent extends VueComponentBase {

    private frame: HTMLElement = null;

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
}