import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { ModuleDataImportAction } from '../../../../data_import/store/DataImportStore';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./TranslationsImportParamsComponent.pug'),
    components: {}
})
export default class TranslationsImportParamsComponent extends VueComponentBase {

    @ModuleDataImportAction
    public setOptions: (options: any) => void;

    private overwrite: boolean = false;

    public async mounted() {
    }

    @Watch('overwrite')
    public changedSelectedSite() {

        this.setOptions({ overwrite: this.overwrite });
    }
}