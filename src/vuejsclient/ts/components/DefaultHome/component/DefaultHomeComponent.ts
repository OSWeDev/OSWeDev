import { Component } from 'vue-property-decorator';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import ModuleSASSSkinConfigurator from '../../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./DefaultHome.pug'),
    components: {}
})
export default class DefaultHomeComponent extends VueComponentBase {

    private main_background_url: string = null;

    private async mounted() {
        this.main_background_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.main_background_url')
        if (!this.main_background_url) {
            this.main_background_url = '/public/img/background.jpg';
        } else {
            this.main_background_url = this.main_background_url.replace(/"/g, '');
        }
    }
}