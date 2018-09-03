import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import ModuleSASSSkinConfigurator from '../../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';

@Component({
    template: require('./DefaultHome.pug'),
    components: {}
})
export default class DefaultHomeComponent extends VueComponentBase {

    get main_background_url(): string {
        let res: string = (ModuleSASSSkinConfigurator.getInstance().actif ? ModuleSASSSkinConfigurator.getInstance().getParamValue('main_background_url') : '/public/img/background.jpg');

        // Compatibilité anciennes datas
        return res.replace(/"/g, '');
    }
}