import Component from 'vue-class-component';
import { ModuleBootstrapTemplateGetter } from '../../BootstrapTemplate/store/BootstrapTemplateStore';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDocumentAction, ModuleDocumentGetter } from '../store/DocumentStore';
import './DocumentHandlerButtonComponent.scss';

@Component({
    template: require('./DocumentHandlerButtonComponent.pug')
})
export default class DocumentHandlerButtonComponent extends VueComponentBase {

    @ModuleBootstrapTemplateGetter
    private get_fa_navbarbtn_style: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_outlinebtn: string;

    @ModuleDocumentGetter
    private get_hidden: boolean;
    @ModuleDocumentAction
    private set_hidden: (hidden: boolean) => void;

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }
}