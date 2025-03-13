import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import CanvasDiagram from './CanvasDiagram/CanvasDiagram';
import SelectionPanel from './SelectionPanel/SelectionPanel';
import LinkPanel from './LinkPanel/LinkPanel';
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
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    components: {
        CanvasDiagram,
        SelectionPanel,
        LinkPanel,
        AddPanel
    },
    template: require('./OseliaRunGraphWidgetComponent.pug')
})
export default class OseliaRunGraphWidgetComponent extends Vue {

    private items: { [id: string]: OseliaRunTemplateVO } = {};
    private choices_of_item: OseliaRunTemplateVO[] = [];
    private links: { [id: string]: string[] } = {};
    private hidden_links: { [from: string]: { [to: string]: boolean } } =  {};

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


    get showPlusButton(): boolean {
        return true; // Condition d'affichage si besoin
    }

    public async mounted()
    {
        await this.get_templates();
    }

    /**
     * Méthode pour ajouter un item
     * (anciennement on émettait @addItem, maintenant on le fait directement ici)
     */
    public addItem(itemId: string) {
        
        this.items[itemId] = this.choices_of_item.find((item) => item.id == Number(itemId));
        // Refermer le panel d'ajout
        this.showAddPanel = false;
    }

    /**
     * Méthode pour supprimer un item
     * (anciennement on émettait @removeItem)
     */
    public removeItem(itemId: string) {
        if (!this.items[itemId]) {
            return;
        }

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
    }

    /**
     * Appelé quand on sélectionne un item dans le Canvas
     */
    public selectItem(itemId: string) {
        this.selectedItem = itemId;
        this.selectedLink = null;
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

    private async get_templates() {
        try {
            this.choices_of_item = await query(OseliaRunTemplateVO.API_TYPE_ID).exec_as_server().select_vos();
        } catch (error) {
            console.error('Erreur lors du fetch des runTemplates :', error);
        }
    }
}
