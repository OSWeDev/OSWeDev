import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';

import VarChartOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VueComponentBase from '../../../VueComponentBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';

import VarChartOptionsItemComponent from './item/VarChartOptionsItemComponent';

import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardGraphColorPaletteVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphColorPaletteVO';

import './VarChartsOptionsComponent.scss';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';

@Component({
    template: require('./VarChartsOptionsComponent.pug'),
    components: {
        Varchartoptionsitemcomponent: VarChartOptionsItemComponent,
    }
})
export default class VarChartsOptionsComponent extends VueComponentBase {

    @Prop({ default: () => [] })
    private options!: VarChartOptionsVO[];

    @Prop({ default: true })
    private detailed!: boolean;

    @Prop({ default: null })
    private page_widget!: DashboardPageWidgetVO;

    @Prop({ default: null })
    private get_custom_filters!: string[];

    @Prop({ default: [] })
    private fields_that_could_get_scales_filter!: VarChartScalesOptionsVO[];

    /**
     * Données locales
     */
    private options_props: VarChartOptionsVO[] = [];

    /**
     * Ouverture/fermeture de la section globale
     */
    private isHeadOpen: boolean = false;

    /**
     * Indique si on a tout ouvert (juste les items) ou non
     */
    private isAllOpen: boolean = false;

    /**
     * Indique si on a tout ouvert (items + leurs sous-sections) ou non
     */
    private isAllAndChildrenOpen: boolean = false;

    /**
     * Liste des items "ouverts" (pour afficher ou non le content)
     */
    private openedIndexes: number[] = [];

    /**
     * Pour chaque item, on stocke l'ouverture de ses sous-sections,
     * par ex. { graphicalOptions: false, filterOptions: false }
     */
    private openedSections: Array<{ graphicalOptions: boolean; filterOptions: boolean }> = [];

    // -------- Palettes -----------
    private use_palette: boolean = false;
    private color_palettes_options: Array<{ id: number; label: string; palette: DashboardGraphColorPaletteVO }> = [];
    private color_palettes: DashboardGraphColorPaletteVO[] = [];
    private tmp_selected_color_palette_id: { id: number; label: string; palette: DashboardGraphColorPaletteVO } | null = null;

    // --------------------------------------------------------------------------
    // Watchers
    // --------------------------------------------------------------------------

    /**
     * Lorsqu’on reçoit/Modifie la prop options
     */
    @Watch('options', { immediate: true, deep: true })
    private async on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }
        this.options_props = this.options;

        // On init openedSections pour chaque item
        this.initOpenedSections();

        // On charge les palettes
        this.color_palettes_options = await this.get_color_palettes_options();
        this.use_palette = this.options_props.some(opt => opt.color_palette != null);

        if (this.use_palette && this.options_props[0].color_palette) {
            this.tmp_selected_color_palette_id = {
                id: this.options_props[0].color_palette.id,
                label: this.options_props[0].color_palette.name,
                palette: this.options_props[0].color_palette
            };
        } else {
            this.tmp_selected_color_palette_id = null;
        }
    }


    /**
     * Sur le changement d’ID de palette
     */
    @Watch('tmp_selected_color_palette_id')
    private on_change_tmp_selected_color_palette_id() {
        if (!this.options_props) {
            return;
        }

        const color_palette_id = this.tmp_selected_color_palette_id ? this.tmp_selected_color_palette_id.id : null;
        const selectedObj = this.color_palettes_options.find(o => o.id === color_palette_id);

        this.options_props.forEach(option_prop => {
            if (!selectedObj) {
                if (option_prop.color_palette) {
                    option_prop.color_palette = null;
                }
            } else {
                const new_palette = selectedObj.palette;
                if (option_prop.color_palette !== new_palette) {
                    option_prop.color_palette = new_palette;
                    option_prop.bg_color = null;
                    option_prop.border_color = null;
                }
            }
        });
        this.emit_change();
    }

    // --------------------------------------------------------------------------
    // Méthodes
    // --------------------------------------------------------------------------

    /**
     * Initialise openedSections => [ {graphicalOptions:false, filterOptions:false}, ...]
     */
    private initOpenedSections() {
        this.openedSections = this.options_props.map(() => ({
            graphicalOptions: false,
            filterOptions: false
        }));
    }

    private async mounted() {
        if (this.color_palettes_options.length === 0) {
            this.color_palettes_options = await this.get_color_palettes_options();
        }
    }

    private async get_color_palettes_options(): Promise<Array<{ id: number; label: string; palette: DashboardGraphColorPaletteVO }>> {
        const res: Array<{ id: number; label: string; palette: DashboardGraphColorPaletteVO }> = [];
        this.color_palettes = [];

        const palettes: DashboardGraphColorPaletteVO[] = await query(DashboardGraphColorPaletteVO.API_TYPE_ID).select_vos();
        for (const pal of palettes) {
            res.push({
                id: pal.id,
                label: pal.name,
                palette: pal
            });
            this.color_palettes.push(pal);
        }
        return res;
    }

    /**
     * toggleHead => ouvre/ferme la section globale
     */
    private toggleHead() {
        this.isHeadOpen = !this.isHeadOpen;
        if (!this.isHeadOpen) {
            // Si on ferme, on reset
            this.openedIndexes = [];
            this.isAllOpen = false;
            this.isAllAndChildrenOpen = false;
        }
    }

    /**
     * Ouvre/ferme TOUTES les items au niveau item (pas les sous-sections)
     */
    private toggleAll() {
        if (this.openedIndexes.length === this.options_props.length) {
            // Tout ouvert => on ferme tout
            this.openedIndexes = [];
            this.isAllOpen = false;
            this.isHeadOpen = false;
            this.isAllAndChildrenOpen = false;
        } else {
            // On ouvre tout
            this.openedIndexes = this.options_props.map((_, idx) => idx);
            this.isAllOpen = true;
            this.isHeadOpen = true;
            this.isAllAndChildrenOpen = false; // car on ouvre juste les items, pas leurs sous-sections
        }
    }

    /**
     * Ouvre/ferme TOUT : items + sous-sections (graphicalOptions / filterOptions).
     */
    private toggleAllAndChildren() {
        if (this.isAllAndChildrenOpen) {
            // On ferme tout
            this.isAllAndChildrenOpen = false;
            this.isAllOpen = false;
            this.isHeadOpen = false;
            this.openedIndexes = [];
            for (let i = 0; i < this.openedSections.length; i++) {
                this.openedSections[i].graphicalOptions = false;
                this.openedSections[i].filterOptions = false;
            }
        } else {
            // On ouvre tout + sous-sections
            this.isAllAndChildrenOpen = true;
            this.isAllOpen = true;
            this.isHeadOpen = true;
            this.openedIndexes = this.options_props.map((_, idx) => idx);

            for (let i = 0; i < this.openedSections.length; i++) {
                this.openedSections[i].graphicalOptions = true;
                this.openedSections[i].filterOptions = true;
            }
        }
    }

    /**
     * isOpen => l’item est-il ouvert ?
     */
    private isOpen(index: number): boolean {
        return this.openedIndexes.includes(index);
    }

    /**
     * toggleSection => ouvre/ferme un item
     */
    private toggleSection(index: number) {
        if (this.isOpen(index)) {
            // on ferme
            const idx = this.openedIndexes.indexOf(index);
            if (idx >= 0) {
                this.openedIndexes.splice(idx, 1);
            }
            this.isAllOpen = false;
            this.isAllAndChildrenOpen = false;
        } else {
            // on ouvre
            this.openedIndexes.push(index);
            if (this.openedIndexes.length === this.options_props.length) {
                this.isAllOpen = true;
            }
        }
    }

    /**
     * getScaleTitle => label d’un item
     */
    private getScaleTitle(item: VarChartOptionsVO, index: number): string {
        if (item.var_id) {
            return this.t(VarsController.get_translatable_name_code_by_var_id(item.var_id));
        }
        if (item.chart_id) {
            return 'Variable #' + item.chart_id;
        }
        return 'Variable #' + (index + 1);
    }

    /**
     * Ajout item
     */
    private add_var_chart_options() {
        const newOpt = new VarChartOptionsVO();
        this.options_props = [...this.options_props, newOpt];
        // On agrandit openedSections
        this.openedSections.push({ graphicalOptions: false, filterOptions: false });
        this.emit_change();
    }

    /**
     * Suppression item
     */
    private remove_var_chart_options(index: number) {
        const copy = cloneDeep(this.options_props);
        copy.splice(index, 1);
        this.options_props = copy;

        // Retirer l’index dans openedSections
        this.openedSections.splice(index, 1);
        // Retirer l’index dans openedIndexes
        const idx2 = this.openedIndexes.indexOf(index);
        if (idx2 >= 0) {
            this.openedIndexes.splice(idx2, 1);
        }
        this.emit_change();
    }

    /**
     * handle_var_chart_options_change => callback quand l’enfant modifie l’item
     */
    private handle_var_chart_options_change(index: number, updated: VarChartOptionsVO) {
        const copy = cloneDeep(this.options_props);
        copy[index] = updated;
        this.options_props = copy;
        this.emit_change();
    }

    /**
     * toggle use_palette
     */
    private switch_use_palette() {
        this.use_palette = !this.use_palette;
        this.tmp_selected_color_palette_id = null;
        for (const option_prop of this.options_props) {
            option_prop.has_gradient = false;
        }
        this.emit_change();
    }

    private emit_change() {
        this.$emit('on_change', this.options_props);
    }

    /**
     * Méthode qui reçoit l’update des sous-sections depuis l’enfant
     */
    private onChildSectionsOpen(index: number, newLocalSections: { graphicalOptions: boolean; filterOptions: boolean }) {
        const copy = cloneDeep(this.openedSections);
        copy[index] = newLocalSections;
        this.openedSections = copy;
        if (this.openedSections.every(opt => opt.graphicalOptions && opt.filterOptions)) {
            this.isAllAndChildrenOpen = true;
        } else {
            this.isAllAndChildrenOpen = false;
        }
    }
}
