import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

import CanvasDiagram from './CanvasDiagram/CanvasDiagram';
import SelectionPanel from './SelectionPanel/SelectionPanel';
import LinkPanel from './LinkPanel/LinkPanel';
import AddPanel from './AddPanel/AddPanel';
import './OseliaRunGraphWidgetComponent.scss';

import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';

import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageGetter, ModuleDashboardPageAction } from '../../page/DashboardPageStore';
import { ModuleOseliaGetter, ModuleOseliaAction } from '../oselia_thread_widget/OseliaStore';

import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunVO';

import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';

import VueComponentBase from '../../../VueComponentBase';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';

import CRUDUpdateModalComponent from '../table_widget/crud_modals/update/CRUDUpdateModalComponent';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';

import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import OseliaRunFunctionCallVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';

@Component({
    components: {
        CanvasDiagram,
        SelectionPanel,
        LinkPanel,
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
    public selectedLink: { from: string; to: string } | null = null;

    /**
     * items : c’est ce qui est réellement passé au CanvasDiagram (dictionnaire d’items).
     */
    private items: { [id: string]: OseliaRunTemplateVO | OseliaRunVO } = {};

    private links: { [id: string]: string[] } = {};
    private hidden_links: { [from: string]: { [to: string]: boolean } } = {};


    private updatedItem: OseliaRunTemplateVO | OseliaRunVO = null;
    private reDraw: boolean = false;

    get showClearButton(): boolean {
        return Object.keys(this.items).length > 0;
    }
    // -------------------------------------------------------------------------
    // WATCHERS
    // -------------------------------------------------------------------------
    @Watch('choices_of_item', { immediate:true, deep: true})
    private async onChoicesOfItemChange() {
        // Si on est en mode single run, on n’utilise pas le vieux mécanisme
        if (this.is_single_run_found) {
            return;
        }

        try {
            this.links = {};

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

            } else if (this.choices_of_item.length !== 0) {
                // Ancienne logique : plus d’un item => show panel
                this.has_agent = true;
                if (this.choices_of_item.length >= 1) {
                    this.showAddPanel = true;
                    this.showPlusButton = true;
                }
            }
        } catch (error) {
            console.error('Erreur lors du fetch des agents :', error);
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
    }

    // -------------------------------------------------------------------------
    // Méthodes existantes pour ajouter / retirer un item (mode template)
    // -------------------------------------------------------------------------
    public async addItem(itemId: string) {
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
                    if(this.choices_of_item.findIndex((item) => item.id == Number(child.id)) != -1) {
                        this.choices_of_item.splice(this.choices_of_item.findIndex((item) => item.id == Number(child.id)), 1);
                    }
                }
            }
        }
        this.$set(this.items, itemId, itemAdded);
        if(this.choices_of_item.findIndex((item) => item.id == Number(itemId)) != -1) {
            this.choices_of_item.splice(this.choices_of_item.findIndex((item) => item.id == Number(itemId)), 1);
        }
    }


    public removeItem(itemId: string) {
        if (!this.items[itemId]) {
            return;
        }
        this.choices_of_item.push(this.items[itemId]);

        this.$delete(this.items, itemId);

        // Nettoyage des links
        if (this.links[itemId]) {
            this.$delete(this.links, itemId);
        }
        for (const fromId in this.links) {
            this.links[fromId] = this.links[fromId].filter(to => to !== itemId);
        }

        if (this.selectedItem === itemId) {
            this.selectedItem = null;
            this.selectedItemRunInfo = null;
        }
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
        this.selectedLink = null;
        this.showAddPanel = false;
    }

    public selectLink(linkObj: { from: string; to: string }) {
        this.selectedLink = linkObj;
        this.selectedItem = null;
        this.selectedItemRunInfo = null;
    }

    public onSwitchHidden(itemId: string, linkTo: string, hidden: boolean) {
        if (!this.hidden_links[itemId]) {
            this.$set(this.hidden_links, itemId, {});
        }
        this.$set(this.hidden_links[itemId], linkTo, hidden);
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
        // Si c’est un agent, aller chercher ses enfants (OseliaRunVO) et les insérer
        if (this.single_run.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            this.has_agent = true;
            await this.addRunChildrenRecursively(this.single_run.id);
        }
    }

    private async clearAll() {
        this.items = {};
        this.selectedItem = null;
        this.selectedItemRunInfo = null;
        this.selectedLink = null;
        this.showAddPanel = false;
        this.showPlusButton = true;
        this.has_agent = false;
        this.choices_of_item = [];
        await this.chargeChoices();
    }

    private async chargeChoices() {
        // ---------------------------------------------------------------------
        // 1) On essaie d’abord de récupérer les OseliaRunVO
        //    avec les filtres actifs (comme pour les templates)
        // ---------------------------------------------------------------------
        const active_filters = FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters);
        const context_filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(active_filters);

        const found_runs = await query(OseliaRunVO.API_TYPE_ID)
            .add_filters(context_filters)
            .select_vos<OseliaRunVO>();

        if (found_runs.length === 1) {
            // => On a EXACTEMENT 1 run => on adopte la nouvelle logique
            this.is_single_run_found = true;
            this.single_run = found_runs[0];

            // On construit nos items depuis ce run unique
            await this.buildItemsFromSingleRun();

            // await this.register_vo_updates_on_list(
            //     OseliaRunVO.API_TYPE_ID,
            //     reflect<OseliaRunGraphWidgetComponent>().choices_of_item,
            //     context_filters,
            // );
            return;
        } else {
            // Si on avait un run unique avant, on le supprime
            if(this.is_single_run_found) {
                this.is_single_run_found = false;
                this.single_run = null;
                this.items = {};
                if (this.selectedItem) {
                    this.selectedItem = null;
                    this.selectedItemRunInfo = null;
                }
            }
            this.choices_of_item = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .add_filters(
                    [
                        filter(OseliaRunTemplateVO.API_TYPE_ID,
                            field_names<OseliaRunTemplateVO>().run_type)
                            .by_num_eq(OseliaRunVO.RUN_TYPE_AGENT)
                    ])
                .select_vos<OseliaRunTemplateVO>();
            for (const item of this.choices_of_item) {
                if (this.items[item.id]) {
                    if(this.choices_of_item.findIndex((i) => i.id == item.id) != -1) {
                        this.choices_of_item.splice(this.choices_of_item.findIndex((i) => i.id == item.id), 1);
                    }
                }
            }

            return;
        }
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

    // -------------------------------------------------------------------------
    // beforeDestroy
    // -------------------------------------------------------------------------
    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }
}
