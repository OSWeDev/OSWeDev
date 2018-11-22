import Component from 'vue-class-component';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./PanierComponent.pug'),
    components: {}
})
export default class PanierComponent extends VueComponentBase {
    private async created(): Promise<void> {
        this.startLoading();

        // Fin de chargement
        this.stopLoading();
    }
}