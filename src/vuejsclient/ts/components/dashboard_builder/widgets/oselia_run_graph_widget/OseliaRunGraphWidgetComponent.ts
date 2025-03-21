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
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import OseliaRunVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import VueComponentBase from '../../../VueComponentBase';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import CRUDUpdateModalComponent from '../table_widget/crud_modals/update/CRUDUpdateModalComponent';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';

@Component({
    components: {
        CanvasDiagram,
        SelectionPanel,
        LinkPanel,
        AddPanel
    },
    template: require('./OseliaRunGraphWidgetComponent.pug')
})
export default class OseliaRunGraphWidgetComponent extends VueComponentBase{

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
     * État local (sélection d'un item ou d'un lien)
     */
    public selectedItem: string | null = null;
    public selectedLink: { from: string; to: string } | null = null;

    /**
     * Contrôle l'ouverture du panel "AddPanel"
     */
    public showAddPanel: boolean = false;
    public showPlusButton: boolean = true;
    public choices_of_item: OseliaRunTemplateVO[] = [];
    private items: { [id: string]: OseliaRunTemplateVO } = {};
    private links: { [id: string]: string[] } = {};
    private hidden_links: { [from: string]: { [to: string]: boolean } } =  {};
    private has_agent: boolean = true;
    private updatedItem: OseliaRunTemplateVO = null;
    private reDraw: boolean = false;
    @Watch('choices_of_item')
    private async onChoicesOfItemChange() {
        try {
            this.links = {};
            if (this.choices_of_item.length == 1) {
                if (Object.values(this.items).length > 0) {
                    return;
                }
                this.items[0] = this.choices_of_item[0];
                this.choices_of_item = [];
                this.showAddPanel = false;
                this.showPlusButton = false;
                this.has_agent = true;
            } else if (this.choices_of_item.length != 0) {
                this.has_agent = true;
                if (this.choices_of_item.length > 1) {
                    this.showAddPanel = true;
                    this.showPlusButton = true;
                }
            }

        } catch (error) {
            console.error('Erreur lors du fetch des agents :', error);
        }
    }

    public async mounted()
    {
        await this.register_vo_updates_on_list(
            OseliaRunTemplateVO.API_TYPE_ID,
            reflect<OseliaRunGraphWidgetComponent>().choices_of_item,
            [filter(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().run_type).by_num_eq(OseliaRunVO.RUN_TYPE_AGENT)],
        );
    }

    /**
     * Méthode pour ajouter un item
     * (anciennement on émettait @addItem, maintenant on le fait directement ici)
     */
    public addItem(itemId: string) {
        // Refermer le panel d'ajout
        this.showAddPanel = false;
        this.$set(this.items, itemId, this.choices_of_item.find((item) => item.id == Number(itemId)));
        this.choices_of_item.splice(this.choices_of_item.findIndex((item) => item.id == Number(itemId)), 1);
    }

    /**
     * Méthode pour supprimer un item
     * (anciennement on émettait @removeItem)
     */
    public removeItem(itemId: string) {
        if (!this.items[itemId]) {
            return;
        }

        this.choices_of_item.push(this.items[itemId]);
        // 1) Supprimer l'item
        this.$delete(this.items, itemId);

        // 2) Nettoyer les liens
        if (this.links[itemId]) {
            this.$delete(this.links, itemId);
        }
        for (const fromId in this.links) {
            this.links[fromId] = this.links[fromId].filter(to => to !== itemId);
        }

        // Si l'item qu'on supprime était sélectionné, on nettoie la sélection
        if (this.selectedItem === itemId) {
            this.selectedItem = null;
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
                this.updatedItem = vo as OseliaRunTemplateVO;
            }
        );
    }

    /**
     * Appelé quand on sélectionne un item dans le Canvas
     */
    public selectItem(itemId: string) {
        this.selectedItem = itemId;
        this.selectedLink = null;
        this.showAddPanel = false;
    }

    /**
     * Appelé quand on sélectionne un lien dans le Canvas
     */
    public selectLink(linkObj: { from: string; to: string }) {
        this.selectedLink = linkObj;
        this.selectedItem = null;
    }

    /**
     * Masquer / montrer un lien (si vous gérez un système hidden_links)
     */
    public onSwitchHidden(itemId: string, linkTo: string, hidden: boolean) {
        // logiquement, vous pouvez set un boolean
        if (!this.hidden_links[itemId]) {
            this.$set(this.hidden_links, itemId, {});
        }
        this.$set(this.hidden_links[itemId], linkTo, hidden);
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

}
