import debounce from 'lodash/debounce';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
import SupervisedItemComponent from '../item/SupervisedItemComponent';
import SupervisionAdminVueModule from '../SupervisionAdminVueModule';
import SupervisionItemModalComponent from './item_modal/SupervisionItemModalComponent';
import SupervisionDashboardItemComponent from './item/SupervisionDashboardItemComponent';
import { ModuleSupervisionAction, ModuleSupervisionGetter } from './SupervisionDashboardStore';
import SupervisionDashboardWidgetComponent from './widget/SupervisionDashboardWidgetComponent';
import './SupervisionDashboardComponent.scss';
import { findIndex } from 'lodash';

@Component({
    template: require('./SupervisionDashboardComponent.pug'),
    components: {
        Supervisiondashboardwidgetcomponent: SupervisionDashboardWidgetComponent,
        Supervisionitemmodalcomponent: SupervisionItemModalComponent,
        Supervisiondashboarditemcomponent: SupervisionDashboardItemComponent,
        Superviseditemcomponent: SupervisedItemComponent
    }
})
export default class SupervisionDashboardComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard_key: string;

    @Prop({ default: null })
    private supervised_item_vo_id: string;

    @Prop({ default: null })
    private supervised_item_vo_type: string;

    @ModuleSupervisionAction
    private set_selected_item: (selected_item: ISupervisedItem) => void;
    @ModuleSupervisionAction
    private set_api_type_ids: (api_type_ids: string[]) => void;
    @ModuleSupervisionAction
    private set_categorys: (categorys: SupervisedCategoryVO[]) => void;
    @ModuleSupervisionAction
    private set_selected_category: (category: SupervisedCategoryVO) => void;
    @ModuleSupervisionAction
    private set_selected_api_type_id: (selected_api_type_id: string) => void;
    @ModuleSupervisionAction
    private set_dashboard_key: (dashboard_key: string) => void;
    @ModuleSupervisionAction
    private set_filter_text_lower_case: (filter_text_lower_case: string) => void;
    @ModuleSupervisionAction
    private set_api_type_ids_by_category_ids: (api_type_ids_by_category_ids: { [id: number]: string[] }) => void;

    @ModuleSupervisionGetter
    private get_show_errors: boolean;
    @ModuleSupervisionGetter
    private get_show_errors_read: boolean;
    @ModuleSupervisionGetter
    private get_show_warns: boolean;
    @ModuleSupervisionGetter
    private get_show_warns_read: boolean;
    @ModuleSupervisionGetter
    private get_show_oks: boolean;
    @ModuleSupervisionGetter
    private get_show_pauseds: boolean;
    @ModuleSupervisionGetter
    private get_show_unknowns: boolean;
    @ModuleSupervisionGetter
    private get_selected_item: ISupervisedItem;
    @ModuleSupervisionGetter
    private get_categorys: SupervisedCategoryVO[];
    @ModuleSupervisionGetter
    private get_api_type_ids: string[];
    @ModuleSupervisionGetter
    private get_selected_category: SupervisedCategoryVO;
    @ModuleSupervisionGetter
    private get_selected_api_type_id: string;
    @ModuleSupervisionGetter
    private get_dashboard_key: string;
    @ModuleSupervisionGetter
    private get_filter_text_lower_case: string;
    @ModuleSupervisionGetter
    private get_api_type_ids_by_category_ids: { [id: number]: string[] };
    /** liste des items a effacer */
    private supervised_item_for_delete: { [name: string]: ISupervisedItem } = {};

    /** liste des sondes */
    private supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
    private continue_reloading: boolean = true;

    // private api_type_ids_by_category_ids: { [id: number]: string[] } = {};

    private nb_errors: number = 0;
    private nb_warns: number = 0;
    private nb_oks: number = 0;
    private nb_pauses: number = 0;
    private nb_errors_read: number = 0;
    private nb_warns_read: number = 0;
    private nb_unknowns: number = 0;
    private ordered_supervised_items: ISupervisedItem[] = null;
    private index: number;
    private valide: boolean = false;

    private filter_text: string = null;

    private debounced_on_change_show = debounce(this.debounce_on_change_show, 300);

    private cpt: number = 1;
    private supervised_item_selected: { [id: number]: ISupervisedItem } = {};

    @Watch('supervised_item_vo_id', { immediate: true })
    private async onchange_supervised_item_vo_id() {
        if (this.supervised_item_vo_id && this.supervised_item_vo_type) {
            this.set_selected_item(
                await ModuleDAO.getInstance().getVoById(this.supervised_item_vo_type, parseInt(this.supervised_item_vo_id))
            );
        }
    }

    @Watch('get_show_errors')
    @Watch('get_show_errors_read')
    @Watch('get_show_warns')
    @Watch('get_show_warns_read')
    @Watch('get_show_oks')
    @Watch('get_show_pauseds')
    @Watch('get_show_unknowns')
    private on_change_show() {
        this.debounced_on_change_show();
    }

    @Watch('filter_text')
    private on_change_filter_text() {
        let lower_case = this.filter_text ? this.filter_text.toLowerCase() : null;
        if (lower_case != this.get_filter_text_lower_case) {
            this.set_filter_text_lower_case(lower_case);
            this.debounced_on_change_show();
        }
    }

    @Watch('get_selected_item')
    private on_change_selected_item() {
        this.show_hide_modal();
    }

    /**
     * Rafraichit compteurs et liste des sondes.
     * @see {@link SupervisionDashboardComponent.set_ordered_supervised_items set_ordered_supervised_items}
     */
    private debounce_on_change_show() {
        this.set_ordered_supervised_items();
    }

    private async created() {
        this.show_hide_modal();
        this.continue_reloading = true;
        this.filter_text = this.get_filter_text_lower_case;
        await this.load_supervised_items_and_continue(true);
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private show_hide_modal() {
        if (!this.get_selected_item) {
            $('#supervision_item_modal').modal('hide');
        } else {
            $('#supervision_item_modal').modal('show');
        }
    }
    /**
     * Appelle {@link SupervisionDashboardComponent.load_supervised_items load_supervised_items} pour mettre à jour le visuel.
     * Se rappelle elle même toutes les 20 secondes.
     * @param first_build
     */
    private async load_supervised_items_and_continue(first_build: boolean = false) {
        if (!this.continue_reloading) {
            return;
        }

        await this.load_supervised_items(first_build);

        // On recharge toutes les 20 secondes
        setTimeout(this.load_supervised_items_and_continue.bind(this), 20000);
    }

    /**
     * Recharge les sondes (appelé toutes les 20 secondes par {@link SupervisionDashboardComponent.load_supervised_items_and_continue load_supervised_items_and_continue})
     * @param first_build true s'il s'agit de la première fois  que l'on charge les sondes
     */
    private async load_supervised_items(first_build: boolean) {

        if (this.get_dashboard_key != this.dashboard_key) {
            this.set_dashboard_key(this.dashboard_key);
            this.set_selected_item(null);
            this.set_api_type_ids(null);
            this.set_categorys(null);
            this.set_selected_category(null);
            this.set_selected_api_type_id(null);
            this.set_filter_text_lower_case(null);
            this.set_api_type_ids_by_category_ids(null);
            first_build = true;
        }

        /** liste des nouvelles sondes à afficher */
        let new_supervised_items_by_names: { [name: string]: ISupervisedItem } = {};

        // récupération des catégories et filtrage en fonction de enabled_categories
        if (!this.get_categorys || !this.get_categorys.length) {
            let categorys = await ModuleDAO.getInstance().getVos<SupervisedCategoryVO>(SupervisedCategoryVO.API_TYPE_ID);
            this.set_categorys(categorys.filter((category) => !this.enabled_categories || this.enabled_categories.includes(category.name)));
        }

        let enabled_categories_ids = this.get_categorys.map((cat) => cat.id);

        let api_type_ids: string[] = [];
        let api_type_ids_by_category_ids: { [id: number]: string[] } = {};
        let already_add_api_type_ids_by_category_ids: { [id: number]: { [api_type_id: string]: boolean } } = {};

        let registered_api_types = SupervisionController.getInstance().registered_controllers;
        let promises = [];

        for (let api_type_id in registered_api_types) {
            let registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type_id];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            // if (first_build) {
            //     api_type_ids.push(api_type_id);
            // }

            //récupération des sondes
            promises.push((async () => {
                // pour éviter de récuperer le cache
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([api_type_id]);
                let items = await ModuleDAO.getInstance().getVos<ISupervisedItem>(api_type_id);

                for (let i in items) {
                    let item = items[i];

                    if (this.is_item_accepted(item/*, (i % 1000 == 0) */) && (!item.category_id || (item.category_id && enabled_categories_ids.includes(item.category_id)))) {
                        new_supervised_items_by_names[item.name] = item;

                        if (first_build) {
                            if (!api_type_ids_by_category_ids[item.category_id]) {
                                api_type_ids_by_category_ids[item.category_id] = [];
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id]) {
                                already_add_api_type_ids_by_category_ids[item.category_id] = {};
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id][item._type]) {
                                already_add_api_type_ids_by_category_ids[item.category_id][item._type] = true;
                                api_type_ids_by_category_ids[item.category_id].push(item._type);
                                api_type_ids.push(api_type_id);
                            }
                        }
                    }
                }
            })());
        }

        await Promise.all(promises);

        if (!this.get_api_type_ids || !this.get_api_type_ids.length) {
            // if (first_build) {
            this.set_api_type_ids_by_category_ids(api_type_ids_by_category_ids);
            this.set_api_type_ids(api_type_ids);
            // }
        }

        this.supervised_items_by_names = new_supervised_items_by_names;

        this.debounced_on_change_show();
    }

    private selectCategory(category: SupervisedCategoryVO) {
        this.set_selected_category(category);
        this.set_selected_api_type_id(null);

        this.debounced_on_change_show();
    }

    private selectApiTypeId(api_type_id: string) {
        this.set_selected_api_type_id(api_type_id);

        this.debounced_on_change_show();
    }

    /**
     * dresse la liste des sondes en la triant par état
     */
    private set_ordered_supervised_items() {
        let res: ISupervisedItem[] = [];
        this.nb_errors = 0;
        this.nb_warns = 0;
        this.nb_oks = 0;
        this.nb_pauses = 0;
        this.nb_errors_read = 0;
        this.nb_warns_read = 0;
        this.nb_unknowns = 0;

        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
            if ((this.get_selected_category) && (this.get_selected_category.id != supervised_item.category_id)) {
                continue;
            }

            // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
            if ((this.get_selected_api_type_id) && (supervised_item._type != this.get_selected_api_type_id)) {
                continue;
            }

            /** pour filtrer les ligne selon le nom */
            if (this.get_filter_text_lower_case && supervised_item.name.toLowerCase().indexOf(this.get_filter_text_lower_case) < 0) {
                continue;
            }

            /** pour filtrer en fonction de la catégorie et du type de sonde selectionné */
            let is_in_state_filter: boolean = true;

            switch (supervised_item.state) {
                case SupervisionController.STATE_ERROR:
                    this.nb_errors++;
                    is_in_state_filter = !!this.get_show_errors;
                    break;
                case SupervisionController.STATE_ERROR_READ:
                    this.nb_errors_read++;
                    is_in_state_filter = !!this.get_show_errors_read;
                    break;
                case SupervisionController.STATE_OK:
                    this.nb_oks++;
                    is_in_state_filter = !!this.get_show_oks;
                    break;
                case SupervisionController.STATE_PAUSED:
                    this.nb_pauses++;
                    is_in_state_filter = !!this.get_show_pauseds;
                    break;
                case SupervisionController.STATE_UNKOWN:
                    this.nb_unknowns++;
                    is_in_state_filter = !!this.get_show_unknowns;
                    break;
                case SupervisionController.STATE_WARN:
                    this.nb_warns++;
                    is_in_state_filter = !!this.get_show_warns;
                    break;
                case SupervisionController.STATE_WARN_READ:
                    this.nb_warns_read++;
                    is_in_state_filter = !!this.get_show_warns_read;
                    break;
            }

            if (is_in_state_filter) {
                res.push(supervised_item);
            }
        }

        // tri par état
        res.sort((a: ISupervisedItem, b: ISupervisedItem) => {

            if (a.state < b.state) {
                return -1;
            }

            if (a.state > b.state) {
                return 1;
            }

            if (a.last_update && ((!b.last_update) || (a.last_update < b.last_update))) {
                return -1;
            }

            if (b.last_update && ((!a.last_update) || (b.last_update < a.last_update))) {
                return 1;
            }

            if (a.name < b.name) {
                return -1;
            }

            if (a.name > b.name) {
                return 1;
            }

            return 0;
        });

        this.ordered_supervised_items = res;
    }

    private is_cat_selected(category: SupervisedCategoryVO): boolean {
        return ((this.get_selected_category) && (this.get_selected_category.id == category.id));
    }

    private is_api_type_selected(api_type_id: string): boolean {
        return ((this.get_selected_api_type_id) && (this.get_selected_api_type_id == api_type_id));
    }

    /**
     * recupere les api_type_ids (liste des items) filtrés en fonction de la catégories selectionnée
     */
    get filtered_api_type_ids(): string[] {
        if (!this.get_api_type_ids) {
            return this.get_api_type_ids;
        }

        if (!this.get_selected_category) {
            return this.get_api_type_ids;
        }

        return this.get_api_type_ids_by_category_ids[this.get_selected_category.id];
    }

    /**
     * recupere les restrictions sur les categories s'il y en a une dans {@link SupervisionAdminVueModule} sinon null
     */
    get enabled_categories(): string[] {
        return SupervisionAdminVueModule.getInstance().enabled_categories_by_key[this.dashboard_key];
    }

    /**
     * recupere le filtre definit sur les items dans {@link SupervisionAdminVueModule} sinon renvoie une fonction qui retourne true (aucun filtre)
     */
    get is_item_accepted(): (supervised_item: ISupervisedItem, get_perf?: boolean) => boolean {
        return SupervisionAdminVueModule.getInstance().item_filter_conditions_by_key[this.dashboard_key] ? SupervisionAdminVueModule.getInstance().item_filter_conditions_by_key[this.dashboard_key] : () => true;
    }
    private select_item(item) {
        this.supervised_item_selected[item.name] = item;
    }
    private select_all() {
        this.valide = !this.valide;
        for (const z in this.ordered_supervised_items) {
            let item_selected = this.ordered_supervised_items[z];
            this.supervised_item_selected[item_selected.name] = item_selected;
        }

    }
    private item_read(item: ISupervisedItem) {
        item.state = SupervisionController.STATE_ERROR_READ;
        ModuleDAO.getInstance().insertOrUpdateVO(item);
        this.debounced_on_change_show();
        // this.ordered_supervised_items.splice(this.ordered_supervised_items.findIndex((i) => i.name == item.name), 1);
        console.log(item);
    }
    private remettre_item(item: ISupervisedItem) {
        item.state = SupervisionController.STATE_ERROR;
        ModuleDAO.getInstance().insertOrUpdateVO(item);
        this.debounced_on_change_show();
        // this.ordered_supervised_items.splice(this.ordered_supervised_items.findIndex((i) => i.name == item.name), 1);
        console.log(item);
    }


    private items_read() {
        for (const e in this.supervised_item_selected) {
            let item_selected_for_delete = this.supervised_item_selected[e];
            this.item_read(item_selected_for_delete);
        }
    }
}
