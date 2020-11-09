import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../VueComponentBase';
import '../RangeComponent.scss';
import NumRangeComponentController from './NumRangeComponentController';

/**
 * Cas spécifique du NumRange qui peut servir à faire référence à des objets
 * On propose donc une version avec un callback async pour afficher un texte en fonction du résultat d'un requete par exemple
 */
@Component({
    template: require('./NumRangeComponent.pug'),
    components: {}
})
export default class NumRangeComponent extends VueComponentBase {

    @Prop({ default: null })
    private range: NumRange;

    @Prop({ default: null })
    private vo_field: ModuleTableField<any>;

    private segmented_min: string = null;
    private segmented_max: string = null;

    @Watch('range', { immediate: true, deep: true })
    private async update_segment() {

        if (!this.range) {
            this.segmented_min = null;
            this.segmented_max = null;
            return;
        }

        let segmented_min: number = null;
        let segmented_max: number = null;
        switch (this.range.segment_type) {

            case NumSegment.TYPE_INT:
                segmented_min = RangeHandler.getInstance().getSegmentedMin(this.range);
                segmented_max = RangeHandler.getInstance().getSegmentedMax(this.range);
                break;

            default: return;
        }

        if (NumRangeComponentController.getInstance().num_ranges_label_handler &&
            NumRangeComponentController.getInstance().num_ranges_label_handler[this.vo_field.module_table.vo_type] &&
            NumRangeComponentController.getInstance().num_ranges_label_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id]) {
            this.segmented_min = await NumRangeComponentController.getInstance().num_ranges_label_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id](
                segmented_min
            );
            if (segmented_min != segmented_max) {
                this.segmented_max = await NumRangeComponentController.getInstance().num_ranges_label_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id](
                    RangeHandler.getInstance().getSegmentedMax(this.range)
                );
            } else {
                this.segmented_max = this.segmented_min;
            }
        } else {
            this.segmented_min = segmented_min.toString();
            this.segmented_max = segmented_max.toString();
        }
    }
}