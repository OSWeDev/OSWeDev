import Component from 'vue-class-component';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDocumentAction, ModuleDocumentGetter } from '../store/DocumentStore';
import './DocumentHandlerButtonComponent.scss';

@Component({
    template: require('./DocumentHandlerButtonComponent.pug')
})
export default class DocumentHandlerButtonComponent extends VueComponentBase {

    @ModuleDocumentGetter
    private get_hidden: boolean;
    @ModuleDocumentAction
    private set_hidden: (hidden: boolean) => void;
    @ModuleDocumentAction
    private set_only_routename: (only_routename: boolean) => void;

    private switch_hidden() {
        this.set_only_routename(false);
        this.set_hidden(!this.get_hidden);
    }
}