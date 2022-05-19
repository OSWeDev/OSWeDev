import Component from 'vue-class-component';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDocumentAction, ModuleDocumentGetter } from '../store/DocumentStore';
import './DocumentHandlerNeedInfoComponent.scss';

@Component({
    template: require('./DocumentHandlerNeedInfoComponent.pug')
})
export default class DocumentHandlerNeedInfoComponent extends VueComponentBase {

    @ModuleDocumentGetter
    private get_hidden: boolean;
    @ModuleDocumentGetter
    private get_has_docs_route_name: { [route_name: string]: boolean };
    @ModuleDocumentAction
    private set_hidden: (hidden: boolean) => void;
    @ModuleDocumentAction
    private set_only_routename: (only_routename: boolean) => void;

    private switch_hidden() {
        if (this.get_hidden) {
            this.set_only_routename(true);
        }

        this.set_hidden(!this.get_hidden);
    }

    get routename(): string {
        return this.$route.name;
    }
}