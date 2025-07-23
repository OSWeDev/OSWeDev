import { Component, Prop, Watch } from 'vue-property-decorator';

import CanvasDiagram from './CanvasDiagram/CanvasDiagram';
import SelectionPanel from './SelectionPanel/SelectionPanel';
import AddPanel from './AddPanel/AddPanel';
import './OseliaRunGraphWidgetComponent.scss';

import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';

import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageGetter, ModuleDashboardPageAction } from '../../page/DashboardPageStore';
import { ModuleOseliaGetter, ModuleOseliaAction } from '../oselia_thread_widget/OseliaStore';

import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunVO';

import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';

import VueComponentBase from '../../../VueComponentBase';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';

import CRUDUpdateModalComponent from '../table_widget/crud_modals/update/CRUDUpdateModalComponent';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';

import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import OseliaRunFunctionCallVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import Throttle from '../../../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ThreadHandler from '../../../../../../shared/tools/ThreadHandler';

interface OseliaRunGraphWidgetOptions {
    auto_refresh?: boolean;
    auto_refresh_seconds?: number;
}

@Component({
    components: {
        CanvasDiagram,
        SelectionPanel,
        AddPanel
    },
    template: require('./OseliaRunGraphWidgetComponent.pug')
})
export default class OseliaRunGraphWidgetComponent extends VueComponentBase {

    @ModuleOseliaGetter
    private get_show_hidden_messages: boolean;
    @ModuleOseliaAction
    private set_show_hidden_messages: (show_hidden_messages: boolean) => void;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;
    @ModuleOseliaGetter
    private get_left_panel_open: boolean;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageGetter
    private get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDAOAction
    private storeDatas!: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private readonly thread_id: number;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    /**
     * Ancienne logique : on utilisait choices_of_item pour stocker un ensemble de templates (ou runs).
     * On conserve ce tableau pour le fallback (0 ou plusieurs runs trouvés).
     */
    public choices_of_item: Array<OseliaRunTemplateVO | OseliaRunVO> = [];
    public showAddPanel: boolean = false;
    public showPlusButton: boolean = true;
    public has_agent: boolean = true;
    // -------------------------------------------------------------------------
    // CHANGEMENT : Gestion Run unique vs fallback
    // -------------------------------------------------------------------------
    /**
     * Indique si on a trouvé exactement un OseliaRunVO
     */
    public is_single_run_found: boolean = false;

    /**
     * Le run unique si on en a trouvé exactement un
     */
    public single_run: OseliaRunVO = null;

    /**
     * Mode d’édition template (quand on a un run unique, on peut “basculer”)
     */
    public show_edit_template: boolean = false;

    // -------------------------------------------------------------------------
    // Sélections (hérité du code existant)
    // -------------------------------------------------------------------------
    public selectedItem: string | null = null;
    public selectedItemRunInfo: OseliaRunFunctionCallVO | null = null;
    public display_mode: 'runs' | 'templates' = 'templates';

    /**
     * items : c’est ce qui est réellement passé au CanvasDiagram (dictionnaire d’items).
     */
    private items: { [id: string]: OseliaRunTemplateVO | OseliaRunVO } = {};

    private showAutofitButton: boolean = false;
    private showSelectionPanelButton: boolean = false;
    private showSelectionPanel: boolean = false;

    private updatedItem: OseliaRunTemplateVO | OseliaRunVO = null;
    private reDraw: boolean = false;
    private localThreadId: number = null;
    private executeAutofit: boolean = false;
    private run_choices: OseliaRunVO[] = [];
    private template_choices: OseliaRunTemplateVO[] = [];
    private type_of_item_displayed: 'template' | 'run' | 'none' = 'none';

    // Options pour l'auto-refresh
    private auto_refresh_timer: NodeJS.Timeout = null;
    private is_loading_choices: boolean = false; // Protection contre les chargements simultanés

    get widget_options(): OseliaRunGraphWidgetOptions {
        if (!this.page_widget) {
            return {
                auto_refresh: true,
                auto_refresh_seconds: 5
            };
        }

        try {
            const options = JSON.parse(this.page_widget.json_options) as OseliaRunGraphWidgetOptions;
            return options;
        } catch (error) {
            return {
                auto_refresh: true,
                auto_refresh_seconds: 5
            };
        }
    }

    get showClearButton(): boolean {
        return Object.keys(this.items).length > 0;
    }

    get isRunDiagram(): boolean {
        return this.display_mode === 'runs' || this.is_single_run_found;
    }
    // -------------------------------------------------------------------------
    // WATCHERS
    // -------------------------------------------------------------------------
    @Watch('display_mode')
    private onDisplayModeChange(newVal: 'runs' | 'templates', oldVal: 'runs' | 'templates') {
        this.applyDisplayMode();
        if (newVal != oldVal) {
            this.clearAll();
        }
        this.reDraw = !this.reDraw;
    }

    @Watch('items')
    private onItemsChange() {
        // On notifie le store des items
        this.type_of_item_displayed = Object.values(this.items).every(item => item._type === OseliaRunTemplateVO.API_TYPE_ID) ? 'template' : ( Object.values(this.items).every(item => item._type === OseliaRunVO.API_TYPE_ID) ? 'run' : 'none');
    }

    @Watch('choices_of_item', { immediate:true, deep: true})
    private async onChoicesOfItemChange() {
        // Protection contre les modifications en cours
        if (this.is_loading_choices) {
            return;
        }
        // Si on est en mode single run, on n’utilise pas le vieux mécanisme
        if (this.is_single_run_found) {
            return;
        }

        try {
            this.is_loading_choices = true;
            if (this.choices_of_item.length === 1 && Object.values(this.items).length === 0) {
                // Ancienne logique : on suppose qu’on a choisi un agent template
                if (Object.values(this.items).length > 0) {
                    return;
                }
                this.addItem(String(this.choices_of_item[0].id));
                this.choices_of_item = [];
                this.showAddPanel = false;
                this.showPlusButton = false;
                this.has_agent = true;

            } else if (this.choices_of_item.length !== 0  && Object.values(this.items).length === 0) {
                // Ancienne logique : plus d’un item => show panel
                this.has_agent = true;
                if (this.choices_of_item.length >= 1) {
                    this.showAddPanel = true;
                    this.showPlusButton = true;
                }
            }
        } catch (error) {
            console.error('Erreur lors du fetch des agents :', error);
        } finally {
            this.is_loading_choices = false;  // ← AJOUTER CETTE LIGNE
        }
    }

    @Watch('thread_id', { immediate: true })
    private async onThreadIdChange() {
        // Si le thread_id a changé, on le met à jour dans le store
        if (this.thread_id !== this.localThreadId) {
            this.localThreadId = this.thread_id;
            await this.chargeChoices();
        }
    }
    // -------------------------------------------------------------------------
    // Mise à jour d’un item déjà affiché (ex: après CRUDUpdateModal)
    // -------------------------------------------------------------------------
    @Watch('updatedItem')
    private onUpdatedItemChange() {
        if (this.updatedItem) {
            this.$set(this.items, this.updatedItem.id, this.updatedItem);
            this.reDraw = !this.reDraw;
        }
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onActiveFieldFiltersChange() {
        await this.chargeChoices();
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
        leading: true,
    })
    private async chargeChoices() {
        if (this.is_loading_choices) {
            return;
        }
        console.log('[CHARGE_CHOICES] Début du chargement...');
        this.is_loading_choices = true;
        try {
            const active_filters = FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters);
            const context_filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(active_filters);

            let runs: OseliaRunVO[] = [];
            if (this.localThreadId != null) {
                console.log(`[CHARGE_CHOICES] Recherche des runs pour le thread ${this.localThreadId}`);
                runs = await query(OseliaRunVO.API_TYPE_ID)
                    .filter_by_num_eq('thread_id', this.localThreadId)
                    .select_vos<OseliaRunVO>();  // Pas de exec_as_server pour éviter les problèmes
            } else {
                console.log('[CHARGE_CHOICES] Recherche des runs avec les filtres contextuels');
                runs = await query(OseliaRunVO.API_TYPE_ID)
                    .add_filters(context_filters)
                    .select_vos<OseliaRunVO>();  // Pas de exec_as_server pour éviter les problèmes
            }

            // PROTECTION : Limiter le nombre de runs pour éviter les problèmes
            if (runs.length > 20) {
                console.warn(`[CHARGE_CHOICES] Trop de runs (${runs.length}), limitation à 20 pour éviter les problèmes`);
                runs = runs.slice(0, 20);
            }

            // FORCE LA RÉACTIVITÉ : Copie les objets pour forcer la détection des changements
            this.run_choices = runs.map(run => ({ ...run }));

            console.log(`[CHARGE_CHOICES] Thread ${this.localThreadId}: trouvé ${runs.length} runs:`, runs.map(r => `${r.id}(${r.name})`));

            this.template_choices = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .select_vos<OseliaRunTemplateVO>();

            if (this.run_choices.length > 0) {
                // Si on a des runs, on les affiche directement sur le graphique
                this.display_mode = 'runs';
                await this.buildItemsFromAllRuns();
                this.has_agent = true;
                this.showAddPanel = false;
                this.showPlusButton = false;
                this.choices_of_item = [];

                // FORCE LE REDRAW pour s'assurer que les changements visuels sont appliqués
                this.reDraw = !this.reDraw;
            } else {
                // Pas de runs : on affiche les templates comme choix
                this.has_agent = this.template_choices.length > 0;
                this.applyDisplayMode();
            }

            console.log('[CHARGE_CHOICES] Chargement terminé');
            return;
        } finally {
            this.is_loading_choices = false;
        }
    }


    // -------------------------------------------------------------------------
    // CHANGEMENT : Gestion du bouton "Edit" en mode Single Run
    // -------------------------------------------------------------------------
    /**
     * Au clic sur "Edit", on veut basculer sur l’édition du template correspondant.
     * S’il n’est pas déjà chargé, on le récupère, puis on refait un items = ...
     */
    public async toggleEditTemplate() {
        this.show_edit_template = !this.show_edit_template;
        if (this.show_edit_template) {
            // => On charge le template lié à single_run
            const run = this.single_run;
            if (!run.template_id) {
                // Pas de template relié => rien à faire
                return;
            }
            await this.buildItemsFromTemplate(run.template_id);
        } else {
            // => On repasse en mode run
            await this.buildItemsFromSingleRun();
        }
    }

    // -------------------------------------------------------------------------
    // MOUNTED
    // -------------------------------------------------------------------------
    public async mounted() {
        await this.chargeChoices();

        // Démarrer l'auto-refresh si activé
        if (this.widget_options && this.widget_options.auto_refresh) {
            await this.start_auto_refresh();
        }
    }

    public async beforeDestroy() {
        // Nettoyer le timer d'auto-refresh
        if (this.auto_refresh_timer) {
            clearTimeout(this.auto_refresh_timer);
            this.auto_refresh_timer = null;
        }

        await this.unregister_all_vo_event_callbacks();
    }


    // -------------------------------------------------------------------------
    // Méthodes existantes pour ajouter / retirer un item (mode template)
    // -------------------------------------------------------------------------
    public async addItem(itemId: string) {
        // Protection contre les modifications simultanées
        if (this.is_loading_choices) {
            return;
        }
        this.is_loading_choices = true;
        try {
            // Ancienne logique
            this.showAddPanel = false;
            const itemAdded: OseliaRunTemplateVO | OseliaRunVO = this.choices_of_item.find((item) => item.id == Number(itemId));
            if (itemAdded._type == OseliaRunTemplateVO.API_TYPE_ID) {
                const local_itemAdded = itemAdded as OseliaRunTemplateVO;
                if (local_itemAdded.children && local_itemAdded.children.length) {
                    const _children = await query(OseliaRunTemplateVO.API_TYPE_ID)
                        .filter_by_ids(local_itemAdded.children)
                        .set_sort(new SortByVO(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().weight, true))
                        .select_vos<OseliaRunTemplateVO>();
                    for (const child of _children) {
                        if (this.choices_of_item.findIndex((item) => item.id == Number(child.id)) != -1) {
                            this.choices_of_item.splice(this.choices_of_item.findIndex((item) => item.id == Number(child.id)), 1);
                        }
                    }
                }
            } else if (itemAdded._type == OseliaRunVO.API_TYPE_ID) {
                const runItem = itemAdded as OseliaRunVO;
                // Récupérer les enfants seulement si c'est un agent
                if (runItem.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    const children = await query(OseliaRunVO.API_TYPE_ID)
                        .filter_by_num_eq('parent_run_id', runItem.id)
                        .select_vos<OseliaRunVO>();
                    for (const child of children) {
                        if (this.choices_of_item.findIndex((item) => item.id == child.id) !== -1) {
                            this.choices_of_item.splice(this.choices_of_item.findIndex((item) => item.id == child.id), 1);
                        }
                        this.$set(this.items, String(child.id), child);
                        if (child.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                            await this.addRunChildrenRecursively(child.id);
                        }
                    }
                }
            }
            this.$set(this.items, itemId, itemAdded);
            if (itemAdded._type == OseliaRunTemplateVO.API_TYPE_ID) {
                const idx = this.choices_of_item.findIndex((item) => item.id == Number(itemId));
                if (idx != -1) {
                    this.choices_of_item.splice(idx, 1);
                }
            } else if (itemAdded._type == OseliaRunVO.API_TYPE_ID) {
                const idx = this.choices_of_item.findIndex((item) => item.id == Number(itemId));
                if (idx != -1) {
                    this.choices_of_item.splice(idx, 1);
                }
            }
        } finally {
            this.is_loading_choices = false;
        }
    }


    public setDisplayMode(mode: 'runs' | 'templates') {
        this.display_mode = mode;
    }

    public removeItem(itemId: string) {
        if (!this.items[itemId]) {
            return;
        }
        this.choices_of_item.push(this.items[itemId]);

        this.$delete(this.items, itemId);

        if (this.selectedItem === itemId) {
            this.selectedItem = null;
            this.selectedItemRunInfo = null;
        }
        this.reDraw = !this.reDraw;
    }

    public replayFunctionCall() {
        this.reDraw = !this.reDraw;
    }

    public async editSelectItem(itemId: string) {
        if (!this.items[itemId]) {
            return;
        }
        const vo_to_update = this.items[itemId];
        await this.get_Crudupdatemodalcomponent.open_modal(
            vo_to_update,
            this.storeDatas,
            null,
            false,
            false,
            async (vo: IDistantVOBase) => {
                this.updatedItem = vo as (OseliaRunTemplateVO | OseliaRunVO);
            }
        );
    }

    // -------------------------------------------------------------------------
    // Sélection & liens
    // -------------------------------------------------------------------------
    public selectItem(itemId: string, runInfo?: OseliaRunFunctionCallVO) {
        if (runInfo) {
            this.selectedItemRunInfo = runInfo;
        }
        this.selectedItem = itemId;
        this.showSelectionPanelButton = true;
        this.showSelectionPanel = false;
        this.showAddPanel = false;
    }

    public canAutofit(_canAutofit: boolean) {
        this.showAutofitButton = _canAutofit;
        this.executeAutofit = false;
    }

    // -------------------------------------------------------------------------
    // AUTO-REFRESH
    // -------------------------------------------------------------------------
    private async start_auto_refresh() {
        console.log('[AUTO_REFRESH] Démarrage de l\'auto-refresh...');

        // Cache des options pour éviter les accès répétés au getter
        const options = this.widget_options;
        if (!options || !options.auto_refresh || !options.auto_refresh_seconds) {
            console.log('[AUTO_REFRESH] Auto-refresh désactivé ou pas de durée configurée');
            return;
        }

        // PROTECTION CONTRE LES BOUCLES INFINIES
        let refresh_count = 0;
        const MAX_REFRESH = 100; // Protection contre les boucles infinies

        // Boucle d'auto-refresh - on utilise les options cachées
        while (options.auto_refresh && refresh_count < MAX_REFRESH) {
            // Vérification additionnelle : si les options ont changé, on arrête
            const currentOptions = this.widget_options;
            if (!currentOptions || !currentOptions.auto_refresh) {
                console.log('[AUTO_REFRESH] Auto-refresh désactivé, arrêt de la boucle');
                break;
            }

            refresh_count++;
            console.log(`[AUTO_REFRESH] Cycle ${refresh_count}/${MAX_REFRESH} - Attente de ${options.auto_refresh_seconds}s...`);

            await ThreadHandler.sleep((options.auto_refresh_seconds * 1000), 'OseliaRunGraphWidgetComponent.start_auto_refresh');

            // PROTECTION : On ne recharge que si on n'est pas déjà en train de charger
            console.log(`[AUTO_REFRESH] Cycle ${refresh_count} - Rechargement des données...`);
            try {
                await this.chargeChoices();
                console.log(`[AUTO_REFRESH] Cycle ${refresh_count} - Rechargement terminé avec succès`);
            } catch (error) {
                console.error(`[AUTO_REFRESH] Erreur lors du cycle ${refresh_count}:`, error);
                // En cas d'erreur, on arrête l'auto-refresh pour éviter les problèmes
                break;
            }
        }

        if (refresh_count >= MAX_REFRESH) {
            console.error('[AUTO_REFRESH] LIMITE ATTEINTE - Arrêt forcé pour éviter une boucle infinie');
        }
        console.log(`[AUTO_REFRESH] Arrêt de l'auto-refresh après ${refresh_count} cycles`);
    }


    /**
     * CHANGEMENT : Construit le dictionnaire this.items à partir du run unique
     * en gérant potentiellement la récursivité sur les enfants (si c’est un agent).
     */
    private async buildItemsFromSingleRun() {
        this.items = {};

        if (!this.single_run) {
            return;
        }

        // On injecte ce run principal
        this.$set(this.items, this.single_run.id, this.single_run);
        this.showAddPanel = false;
        this.choices_of_item = [];
        this.showPlusButton = false;
        this.has_agent = true; // On affiche maintenant tous les runs
        // Si c'est un agent, aller chercher ses enfants (OseliaRunVO) et les insérer
        if (this.single_run.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            await this.addRunChildrenRecursively(this.single_run.id);
        }
    }

    /**
     * NOUVEAU : Construit le dictionnaire this.items à partir de tous les runs disponibles
     * et récupère récursivement leurs enfants si ce sont des agents.
     * MISE À JOUR RÉACTIVE : Force la mise à jour de tous les runs à chaque appel
     */
    private async buildItemsFromAllRuns() {
        // NE PAS vider this.items = {} car cela supprimerait les function calls
        // À la place, on met à jour les runs existants et on ajoute les nouveaux

        if (!this.run_choices || this.run_choices.length === 0) {
            return;
        }

        // On injecte/met à jour tous les runs avec $set pour forcer la réactivité
        for (const run of this.run_choices) {
            // Force la mise à jour même si le run existe déjà
            this.$set(this.items, run.id, { ...run });

            // Si c'est un agent, aller chercher ses enfants
            if (run.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                await this.addRunChildrenRecursively(run.id);
            }
        }
    }

    private async clearAll() {
        this.items = {};
        this.selectedItem = null;
        this.selectedItemRunInfo = null;
        this.showAddPanel = false;
        this.showPlusButton = true;
        // Ne pas remettre has_agent à false si on a des runs à afficher
        this.choices_of_item = [];
        this.localThreadId = null;
        this.canAutofit(false);
        await this.chargeChoices();
    }

    /**
     * Récupère tous les runs enfant d’un agent (parent_run_id = agentId),
     * et les ajoute dans this.items. Si l’enfant est lui-même un agent, on continue récursivement.
     */
    private async addRunChildrenRecursively(agentId: number) {
        const children = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_num_eq('parent_run_id', agentId)
            .select_vos<OseliaRunVO>();

        for (const child of children) {
            this.$set(this.items, child.id, child);

            if (child.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                await this.addRunChildrenRecursively(child.id);
            }
        }
    }


    /**
     * Construit this.items en se basant sur un OseliaRunTemplateVO et sa hiérarchie.
     */
    private async buildItemsFromTemplate(template_id: number) {
        this.items = {};
        const template = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_id(template_id)
            .select_vo<OseliaRunTemplateVO>();

        const rootTemplate = template;

        if (!rootTemplate) {
            return;
        }

        this.$set(this.items, rootTemplate.id, rootTemplate);

        // Si c’est un agent, on descend récursivement
        if (rootTemplate.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            await this.addTemplateChildrenRecursively(rootTemplate.id);
        }
    }

    private async activateShowSelectionPanel() {
        this.showSelectionPanelButton = !this.showSelectionPanelButton;
        this.showSelectionPanel = !this.showSelectionPanelButton;
    }

    private async addTemplateChildrenRecursively(agentTemplateId: number) {
        // On récupère l’objet complet
        const agentTemplate = this.items[agentTemplateId] as OseliaRunTemplateVO;
        if (!agentTemplate.children) {
            return;
        }

        const children = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_ids(agentTemplate.children)
            .select_vos<OseliaRunTemplateVO>();

        for (const child of children) {
            if (!child) {
                continue;
            }
            this.$set(this.items, child.id, child);

            // Si c’est un agent, on redescend
            if (child.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                await this.addTemplateChildrenRecursively(child.id);
            }
        }
    }
    private applyDisplayMode() {
        this.choices_of_item = this.display_mode === 'runs' ? this.run_choices : this.template_choices;
    }
    private async doAutofit() {
        this.executeAutofit = true;
    }
}
