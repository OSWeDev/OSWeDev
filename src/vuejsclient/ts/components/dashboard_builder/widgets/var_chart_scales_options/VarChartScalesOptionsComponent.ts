import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';

import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VueComponentBase from '../../../VueComponentBase';
import VarChartScalesOptionsItemComponent from './item/VarChartScalesOptionsItemComponent';

import './VarChartScalesOptionsComponent.scss';

/**
 * Gère la liste des "scales" (axes) pour un VarChart.
 */
@Component({
    template: require('./VarChartScalesOptionsComponent.pug'),
    components: {
        Varchartscalesoptionsitemcomponent: VarChartScalesOptionsItemComponent,
    }
})
export default class VarChartScalesOptionsComponent extends VueComponentBase {

    @Prop({ default: () => [], type: Array })
    private options!: VarChartScalesOptionsVO[];

    @Prop({ default: false })
    private detailed!: boolean;

    @Prop({ default: null })
    private page_widget_id!: number;

    @Prop({ default: null })
    private get_var_name_code_text!: (page_widget_id: number, var_id: number, chart_id: number) => string;

    /**
     * Copie locale des options
     */
    private options_props: VarChartScalesOptionsVO[] = [];

    /**
     * Indices des items "dépliés"
     */
    private opened_prop_index: number[] = [];

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (!this.options || !this.options.length) {
            this.options_props = [];
            return;
        }

        // Convertir chaque entrée brute en instance VarChartScalesOptionsVO
        this.options_props = this.options.map((rawItem) => {
            // Optionnel: vérifier si c’est déjà une instance
            if (rawItem instanceof VarChartScalesOptionsVO) {
                return rawItem; 
            } else {
                // Créer l'instance
                return new VarChartScalesOptionsVO().from(rawItem);
            }
        });
    }


    /**
     * Renvoie un booléen : true => l'item est replié, false => déplié
     */
    private is_closed(index: number): boolean {
        return (this.opened_prop_index.indexOf(index) === -1);
    }

    /**
     * toggle repli/dépli
     */
    private close_var_chart_options(index: number) {
        if (this.is_closed(index)) {
            this.opened_prop_index.push(index);
        } else {
            const idx = this.opened_prop_index.indexOf(index);
            if (idx !== -1) {
                this.opened_prop_index.splice(idx, 1);
            }
        }
    }

    /**
     * Ajoute une nouvelle échelle
     */
    private add_var_chart_scales_options() {
        const var_chart_scales_options = new VarChartScalesOptionsVO();
        this.options_props = [...this.options_props, var_chart_scales_options];
        this.emit_change();
    }

    /**
     * Supprime l'item à l'index
     */
    private remove_var_chart_scales_options(index: number) {
        const copy = cloneDeep(this.options_props);
        copy.splice(index, 1);
        this.options_props = copy;
        this.emit_change();
    }

    /**
     * Callback quand un item change
     */
    private handle_var_chart_scales_options_change(index: number, var_chart_scales_options: VarChartScalesOptionsVO) {
        const copy = cloneDeep(this.options_props);
        copy[index] = var_chart_scales_options;
        this.options_props = copy;
        this.emit_change();
    }

    /**
     * Émet on_change vers le parent
     */
    private emit_change() {
        this.$emit('on_change', this.options_props);
    }

    /**
     * getScaleItemLabel(index) : renvoie un label pertinent
     * - On affiche par ex. le titre s'il existe.
     * - Sinon on affiche "Scale #n (position, stack, fill ...)"
     */
    private getScaleItemLabel(index: number): string {
        const item = this.options_props[index];
        if (!item) {
            return `Scale #${index + 1}`;
        }

        // 1) Tenter de récupérer un titre
        let label = '';
        // get_title_name_code_text => code text, qu'on peut essayer de traduire
        if (this.get_var_name_code_text && item.page_widget_id && item.chart_id) {
            // On aurait une var ? => Dans un scale, pas toujours. Sinon on peut lire item.get_title_name_code_text(...) ?
            // DANS VarChartScalesOptionsVO, on a get_title_name_code_text(page_widget_id, chart_id).
            const codeText = item.get_title_name_code_text(this.page_widget_id, item.chart_id);
            const translation = this.t(codeText);
            if (translation && translation !== codeText) {
                label = translation; // on a une traduction
            }
        }

        // 2) Si label est vide, on peut tenter l'axe position / stacked / fill
        if (!label) {
            label = `Ordonnée #${index + 1}`;
        }

        // On peut ajouter plus d'infos => "Scale #1 (left, stacked, fill)"
        const position = item.selected_position || 'left';
        const infoStacked = item.stacked ? 'stacked' : '';
        const infoFill = item.fill ? 'fill' : '';

        // Si on veut un résumé quand c'est présent
        const extra: string[] = [];
        if (position) { extra.push(position); }
        if (infoStacked) { extra.push(infoStacked); }
        if (infoFill) { extra.push(infoFill); }

        if (extra.length > 0) {
            label += ' (' + extra.join(', ') + ')';
        }

        return label;
    }
}
