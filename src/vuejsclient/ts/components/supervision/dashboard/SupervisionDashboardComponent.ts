import debounce from 'lodash/debounce';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import SupervisionDashboardItemComponent from './item/SupervisionDashboardItemComponent';
import './SupervisionDashboardComponent.scss';
import { ModuleSupervisionGetter } from './SupervisionDashboardStore';
import SupervisionDashboardWidgetComponent from './widget/SupervisionDashboardWidgetComponent';

@Component({
    template: require('./SupervisionDashboardComponent.pug'),
    components: {
        Supervisiondashboardwidgetcomponent: SupervisionDashboardWidgetComponent,
        Supervisiondashboarditemcomponent: SupervisionDashboardItemComponent
    }
})
export default class SupervisionDashboardComponent extends VueComponentBase {

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

    private supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
    private continue_reloading: boolean = true;

    private categorys: SupervisedCategoryVO[] = null;
    private selected_category: SupervisedCategoryVO = null;

    private api_type_ids: string[] = [];
    private api_type_ids_by_category_ids: { [id: number]: string[] } = {};
    private selected_api_type_id: string = null;

    private nb_errors: number = 0;
    private nb_warns: number = 0;
    private nb_oks: number = 0;
    private nb_pauses: number = 0;
    private nb_errors_read: number = 0;
    private nb_warns_read: number = 0;
    private nb_unknowns: number = 0;
    private ordered_supervised_items: ISupervisedItem[] = null;

    private debounced_on_change_show = debounce(this.debounce_on_change_show, 300);

    private cpt: number = 1;

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

    private debounce_on_change_show() {
        this.set_nb_elems();
        this.set_ordered_supervised_items();
    }

    private async mounted() {

        this.continue_reloading = true;
        await this.load_supervised_items_and_continue(true);
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private async load_supervised_items_and_continue(first_build: boolean = false) {
        if (!this.continue_reloading) {
            return;
        }

        await this.load_supervised_items(first_build);

        // On recharge toutes les 20 secondes
        setTimeout(this.load_supervised_items_and_continue.bind(this), 20000);
    }

    private async load_supervised_items(first_build: boolean) {

        let new_supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
        let promises = [];

        let already_add_api_type_ids_by_category_ids: { [id: number]: { [api_type_id: string]: boolean } } = {};

        let registered_api_types = SupervisionController.getInstance().registered_controllers;

        for (let api_type_id in registered_api_types) {
            let registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type_id];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            if (first_build) {
                this.api_type_ids.push(api_type_id);
            }

            promises.push((async () => {
                let items = await ModuleDAO.getInstance().getVos<ISupervisedItem>(api_type_id);

                for (let i in items) {
                    let item = items[i];

                    new_supervised_items_by_names[item.name] = item;

                    if (first_build) {
                        if (item.category_id) {
                            if (!this.api_type_ids_by_category_ids[item.category_id]) {
                                this.api_type_ids_by_category_ids[item.category_id] = [];
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id]) {
                                already_add_api_type_ids_by_category_ids[item.category_id] = {};
                            }

                            if (!already_add_api_type_ids_by_category_ids[item.category_id][item._type]) {
                                already_add_api_type_ids_by_category_ids[item.category_id][item._type] = true;
                                this.api_type_ids_by_category_ids[item.category_id].push(item._type);
                            }
                        }
                    }
                }
            })());
        }

        promises.push((async () => this.categorys = await ModuleDAO.getInstance().getVos<SupervisedCategoryVO>(SupervisedCategoryVO.API_TYPE_ID))());

        await Promise.all(promises);

        this.supervised_items_by_names = new_supervised_items_by_names;

        this.debounced_on_change_show();
    }

    private selectCategory(category: SupervisedCategoryVO) {
        this.selected_category = category;
        this.selected_api_type_id = null;

        this.debounced_on_change_show();
    }

    private selectApiTypeId(api_type_id: string) {
        this.selected_api_type_id = api_type_id;

        this.debounced_on_change_show();
    }

    private set_nb_elems() {
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
            if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                continue;
            }

            // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
            if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                continue;
            }

            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                this.nb_errors++;
            }

            if (supervised_item.state == SupervisionController.STATE_WARN) {
                this.nb_warns++;
            }

            if (supervised_item.state == SupervisionController.STATE_OK) {
                this.nb_oks++;
            }

            if (supervised_item.state == SupervisionController.STATE_PAUSED) {
                this.nb_pauses++;
            }

            if (supervised_item.state == SupervisionController.STATE_ERROR_READ) {
                this.nb_errors_read++;
            }

            if (supervised_item.state == SupervisionController.STATE_WARN_READ) {
                this.nb_warns_read++;
            }

            if (supervised_item.state == SupervisionController.STATE_UNKOWN) {
                this.nb_unknowns++;
            }
        }
    }

    private set_ordered_supervised_items() {
        let res: ISupervisedItem[] = [];

        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            switch (supervised_item.state) {
                case SupervisionController.STATE_ERROR:
                    if (!this.get_show_errors) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_ERROR_READ:
                    if (!this.get_show_errors_read) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_OK:
                    if (!this.get_show_oks) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_PAUSED:
                    if (!this.get_show_pauseds) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_UNKOWN:
                    if (!this.get_show_unknowns) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_WARN:
                    if (!this.get_show_warns) {
                        continue;
                    }
                    break;
                case SupervisionController.STATE_WARN_READ:
                    if (!this.get_show_warns_read) {
                        continue;
                    }
                    break;
            }

            let is_ok: boolean = true;

            // Si j'ai une catégorie et qu'elle n'est pas celle sélectionné, je refuse
            if ((this.selected_category) && (this.selected_category.id != supervised_item.category_id)) {
                is_ok = false;
            }

            // Si j'ai un api_type_id sélectionné et que ce n'est pas l'item, je refuse
            if ((this.selected_api_type_id) && (supervised_item._type != this.selected_api_type_id)) {
                is_ok = false;
            }

            if (is_ok) {
                res.push(supervised_item);
            }
        }

        res.sort((a: ISupervisedItem, b: ISupervisedItem) => {

            if (a.state < b.state) {
                return -1;
            }

            if (a.state > b.state) {
                return 1;
            }

            if (a.last_update && ((!b.last_update) || a.last_update.isBefore(b.last_update))) {
                return -1;
            }

            if (b.last_update && ((!a.last_update) || b.last_update.isBefore(a.last_update))) {
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

    get filtered_api_type_ids(): string[] {
        if (!this.api_type_ids) {
            return this.api_type_ids;
        }

        if (!this.selected_category) {
            return this.api_type_ids;
        }

        return this.api_type_ids_by_category_ids[this.selected_category.id];
    }
}