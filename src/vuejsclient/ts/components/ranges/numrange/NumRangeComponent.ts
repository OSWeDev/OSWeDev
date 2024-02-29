import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
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
    private vo_field: ModuleTableFieldVO;

    private segmented_min: string = null;
    private segmented_max: string = null;

    private segmented_min_as_num: number = null;
    private segmented_max_as_num: number = null;

    get is_MAX_RANGE(): boolean {
        if (!this.range) {
            return false;
        }

        return (this.segmented_min_as_num == RangeHandler.MIN_INT) && (this.segmented_max_as_num == RangeHandler.MAX_INT);
    }

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
                segmented_min = RangeHandler.getSegmentedMin(this.range);
                segmented_max = RangeHandler.getSegmentedMax(this.range);
                break;

            default: return;
        }

        this.segmented_min_as_num = segmented_min;
        this.segmented_max_as_num = segmented_max;

        if ((!this.is_MAX_RANGE) &&
            NumRangeComponentController.getInstance().num_ranges_enum_handler &&
            NumRangeComponentController.getInstance().num_ranges_enum_handler[this.vo_field.module_table.vo_type] &&
            NumRangeComponentController.getInstance().num_ranges_enum_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id]) {
            this.segmented_min = segmented_min + ' | ' + await
                NumRangeComponentController.getInstance().num_ranges_enum_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id].label_handler(
                    segmented_min
                );
            if (segmented_min != segmented_max) {
                this.segmented_max = segmented_max + ' | ' +
                    await NumRangeComponentController.getInstance().num_ranges_enum_handler[this.vo_field.module_table.vo_type][this.vo_field.field_id].label_handler(
                        RangeHandler.getSegmentedMax(this.range)
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