import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';

import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VueComponentBase from '../../../VueComponentBase';
import VarChartScalesOptionsItemComponent from './item/VarChartScalesOptionsItemComponent';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';

import './VarChartScalesOptionsComponent.scss';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';

@Component({
    template: require('./VarChartScalesOptionsComponent.pug'),
    components: {
        Varchartscalesoptionsitemcomponent: VarChartScalesOptionsItemComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarChartScalesOptionsComponent extends VueComponentBase {

    // --------------------------------------------------------------------------
    // Props
    // --------------------------------------------------------------------------
    @Prop({ default: () => [] })
    private options!: VarChartScalesOptionsVO[]; // liste brute d'échelles

    @Prop({ default: false })
    private detailed!: boolean;  // si on a un affichage "détaillé"

    @Prop({ default: null })
    private page_widget_id!: number;

    // --------------------------------------------------------------------------
    // Données internes
    // --------------------------------------------------------------------------

    /**
     * Copie locale de la liste d'échelles
     */
    private options_props: VarChartScalesOptionsVO[] = [];

    /**
     * Indices des items "ouverts" (repliables) au niveau item
     */
    private openedIndexes: number[] = [];

    /**
     * Pour chaque item, on stocke l'ouverture de ses sous-sections
     * (ex: { scaleOptions: true, filterOptions: false })
     */
    private openedSections: Array<{ scaleOptions: boolean; filterOptions: boolean }> = [];

    /**
     * Header principal
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
     * Indices des items en mode édition de titre
     */
    private editTitleIndexes: number[] = [];

    /**
     * Throttling pour la mise à jour
     */
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(
        'VarChartScalesOptionsComponent.throttled_emit_changes',
        this.emit_change.bind(this),
        50,
        false
    );

    // --------------------------------------------------------------------------
    // Watchers
    // --------------------------------------------------------------------------

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }

        // Si la taille du tableau a changé => on réinitialise l'ouverture
        if (this.options_props.length !== this.options.length) {
            this.initOpenedSections();
        }

        // Convertir chaque entrée brute en instance VarChartScalesOptionsVO
        this.options_props = this.options.map((rawItem) => {
            if (rawItem instanceof VarChartScalesOptionsVO) {
                return rawItem;
            } else {
                return new VarChartScalesOptionsVO().from(rawItem);
            }
        });

    }


    // --------------------------------------------------------------------------
    // Méthodes
    // --------------------------------------------------------------------------

    /**
     * Initialise openedSections pour chaque item,
     * par défaut fermé : { scaleOptions: false, filterOptions: false }
     */
    private initOpenedSections() {
        this.openedSections = this.options_props.map(() => ({
            scaleOptions: false,
            filterOptions: false
        }));
    }

    /**
     * Toggle le header principal (ouvre/ferme toute la liste)
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
            this.initOpenedSections();
        } else {
            // On ouvre tout
            this.openedIndexes = this.options_props.map((_, idx) => idx);
            this.isAllOpen = true;
            this.isHeadOpen = true;
            this.isAllAndChildrenOpen = false; // car on ouvre juste les items, pas leurs sous-sections
        }
    }

    /**
     * Ouvre/ferme TOUT : items + sous-sections (scaleOptions / filterOptions).
     */
    private toggleAllAndChildren() {
        if (this.isAllAndChildrenOpen) {
            // On ferme tout
            this.isAllAndChildrenOpen = false;
            this.isAllOpen = false;
            this.isHeadOpen = false;
            this.openedIndexes = [];
            for (let i = 0; i < this.openedSections.length; i++) {
                this.openedSections[i].scaleOptions = false;
                this.openedSections[i].filterOptions = false;
            }
        } else {
            // On ouvre tout + sous-sections
            this.isAllAndChildrenOpen = true;
            this.isAllOpen = true;
            this.isHeadOpen = true;
            this.openedIndexes = this.options_props.map((_, idx) => idx);

            if (this.openedSections.length !== this.options_props.length) {
                this.initOpenedSections();
            }

            for (let i = 0; i < this.openedSections.length; i++) {
                this.openedSections[i].scaleOptions = true;
                this.openedSections[i].filterOptions = true;
            }
        }
    }

    /**
     * Ajoute une nouvelle échelle
     */
    private add_var_chart_scales_options() {
        const newScale = new VarChartScalesOptionsVO();
        this.options_props = [...this.options_props, newScale];
        this.initOpenedSections(); // On réinitialise
        this.emit_change();
    }

    /**
     * Supprime l'échelle
     */
    private remove_var_chart_scales_options(index: number) {
        const copy = cloneDeep(this.options_props);
        copy.splice(index, 1);
        this.options_props = copy;

        // Remove in openedSections
        this.openedSections.splice(index, 1);
        // Remove in openedIndexes
        const idx = this.openedIndexes.indexOf(index);
        if (idx >= 0) {
            this.openedIndexes.splice(idx, 1);
        }
        // Ajuster le editTitleIndexes si nécessaire
        const idxEd = this.editTitleIndexes.indexOf(index);
        if (idxEd >= 0) {
            this.editTitleIndexes.splice(idxEd, 1);
        }

        this.emit_change();
    }

    /**
     * Update d'un item (depuis l'enfant)
     */
    private async handle_var_chart_scales_options_change(index: number, updated: VarChartScalesOptionsVO) {
        const copy = cloneDeep(this.options_props);
        copy[index] = updated;
        this.options_props = copy;
        this.emit_change();
    }

    /**
     * Indique si un item est "ouvert" (affichage du content)
     */
    private isOpen(index: number): boolean {
        return this.openedIndexes.includes(index);
    }

    /**
     * Toggle l'ouverture d'un item
     */
    private toggleSection(index: number) {
        // On évite de fermer si on est en mode édition de titre
        if (this.isEditingTitle(index)) {
            return;
        }

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
     * Renvoie le titre d'une échelle
     */
    private getScaleTitle(scale: VarChartScalesOptionsVO, index: number): string {
        const so = new VarChartScalesOptionsVO().from(scale);
        const chartId = so.chart_id != null ? so.chart_id : (1000 + index);
        const codeText = so.get_title_name_code_text(this.page_widget_id, chartId);
        const translation = this.t(codeText);
        if (translation && translation !== codeText) {
            return translation;
        }
        return `Ordonnée #${index + 1}`;
    }

    /**
     * Titre éditable ?
     */
    private isEditingTitle(index: number): boolean {
        return this.editTitleIndexes.includes(index);
    }

    /**
     * Toggle la modification de titre
     */
    private toggleEditTitle(index: number) {
        if (this.isEditingTitle(index)) {
            // on quitte l'édition
            const idx = this.editTitleIndexes.indexOf(index);
            if (idx >= 0) {
                this.editTitleIndexes.splice(idx, 1);
            }
        } else {
            // on entre en édition
            this.editTitleIndexes.push(index);
        }
    }

    /**
     * Méthode pour écouter l’événement 'update-sections-open' depuis l’enfant
     */
    private onChildSectionsOpen(index: number, newSectionsOpen: { scaleOptions: boolean; filterOptions: boolean }) {
        const copy = cloneDeep(this.openedSections);
        copy[index] = newSectionsOpen;
        this.openedSections = copy;
        if (this.openedSections.every(opt => opt.scaleOptions && opt.filterOptions)) {
            this.isAllAndChildrenOpen = true;
        } else {
            this.isAllAndChildrenOpen = false;
        }
    }


    /**
     * Émet on_change
     */
    private emit_change() {
        this.$emit('on_change', this.options_props);
    }
}
