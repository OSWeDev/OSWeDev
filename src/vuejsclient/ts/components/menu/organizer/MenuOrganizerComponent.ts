import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMenu from '../../../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import { VOsTypesManager } from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueAppController from '../../../../VueAppController';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from '../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../VueComponentBase';
import MenuController from '../MenuController';
import INestedItem from './INestedItem';
import './MenuOrganizerComponent.scss';

@Component({
    template: require('./MenuOrganizerComponent.pug'),
    components: {
        // VueNestable,
        // VueNestableHandle
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class MenuOrganizerComponent extends VueComponentBase {

    @Prop({ default: null })
    private focus_on_menu_id: number;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleTranslatableTextGetter
    private get_initialized: boolean;

    @ModuleTranslatableTextAction
    private set_flat_locale_translations: (translations: { [code_text: string]: string }) => void;
    @ModuleTranslatableTextAction
    private set_initialized: (initialized: boolean) => void;

    @ModuleTranslatableTextGetter
    private get_initializing: boolean;

    @ModuleTranslatableTextAction
    private set_initializing: (initializing: boolean) => void;

    private nestable_items: INestedItem[] = [];

    private db_menus_by_ids: { [id: number]: MenuElementVO } = {};

    private has_modif: boolean = false;

    private app_name: string = null;
    private app_names: string[] = null;

    private selected_item: MenuElementVO = null;

    private advanced_selected_item_mode: boolean = false;

    private has_modif_selected: boolean = false;

    private collapsed_options_wrapper: boolean = true;

    private reverse_collapse_options_wrapper() {
        this.collapsed_options_wrapper = !this.collapsed_options_wrapper;
    }

    private switch_selected_hidden() {
        if (!this.selected_item) {
            return;
        }
        this.selected_item.hidden = !this.selected_item.hidden;
        this.changed_selected();
    }

    private switch_advanced_selected_item_mode() {
        this.advanced_selected_item_mode = !this.advanced_selected_item_mode;
    }

    private switch_target_is_routename() {
        this.selected_item.target_is_routename = !this.selected_item.target_is_routename;
        this.has_modif_selected = true;
    }

    get selected_item_translatable_title() {
        return this.selected_item ? this.selected_item.translatable_title : null;
    }

    private changed_selected() {
        this.has_modif_selected = true;
    }

    private async unselect() {
        await this.reload_selected();
        this.selected_item = null;
        this.has_modif_selected = false;
    }

    private async update_selected() {
        if (!this.selected_item) {
            return;
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs([this.selected_item]);
        let item = await query(MenuElementVO.API_TYPE_ID).filter_by_id(this.selected_item.id).select_vo<MenuElementVO>();
        this.db_menus_by_ids[item.id] = item;
        this.selected_item = item;
        this.has_modif_selected = false;

        this.update_nested_item(item);
    }

    private async reload_selected() {
        if (!this.selected_item) {
            return;
        }

        let item = await query(MenuElementVO.API_TYPE_ID).filter_by_id(this.selected_item.id).select_vo<MenuElementVO>();
        this.db_menus_by_ids[item.id] = item;
        this.selected_item = item;
        this.has_modif_selected = false;

        this.update_nested_item(item);
    }

    private update_nested_item(item: MenuElementVO) {
        for (let i in this.nestable_items) {
            let nestable_item = this.nestable_items[i];

            if (nestable_item.id == item.id) {
                nestable_item.text = this.get_flat_locale_translations[item.translatable_title];
                nestable_item.target = item.target;
                nestable_item.hidden = item.hidden;
                return;
            }

            if (nestable_item.children && nestable_item.children.length) {

                for (let j in nestable_item.children) {
                    let nestable_item2 = nestable_item.children[j];

                    if (nestable_item2.id == item.id) {
                        nestable_item2.text = this.get_flat_locale_translations[item.translatable_title];
                        nestable_item2.target = item.target;
                        nestable_item2.hidden = item.hidden;
                        return;
                    }

                    if (nestable_item2.children && nestable_item2.children.length) {

                        for (let k in nestable_item2.children) {
                            let nestable_item3 = nestable_item2.children[k];

                            if (nestable_item3.id == item.id) {
                                nestable_item3.text = this.get_flat_locale_translations[item.translatable_title];
                                nestable_item3.target = item.target;
                                nestable_item3.hidden = item.hidden;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    private async select_menu(item: INestedItem) {
        if (!!this.selected_item) {
            await this.reload_selected();
        }
        this.selected_item = this.db_menus_by_ids[item.id];
        this.has_modif_selected = false;
    }

    @Watch('focus_on_menu_id')
    private async onchange_focus_on_menu_id() {
        await this.reload_from_db();
    }

    @Watch('app_name')
    private async onchange_app_name() {
        await this.reload_from_db();
    }

    // private nestableItems = [
    //     {
    //         key: 0,
    //         class: 'purple-text-color',
    //         text: 'Andy'
    //     }, {
    //         key: 1,
    //         class: 'blue-text-color',
    //         text: 'Harry',
    //         nested: [{
    //             key: 2,
    //             text: 'David'
    //         }]
    //     }, {
    //         key: 3,
    //         class: 'red-text-color',
    //         text: 'Lisa'
    //     }, {
    //         key: 4,
    //         text: 'I can not be nested'
    //     }
    // ];

    // private beforeMove({ dragItem, pathFrom, pathTo }) {
    //     // Item 4 can not be nested more than one level
    //     if (dragItem.key === 4) {
    //         return pathTo.length === 1;
    //     }
    //     // All other items can be
    //     return true;
    // }

    private async mounted() {
        await this.reload_from_db();
    }

    private async add_menu() {
        await ModuleMenu.getInstance().add_menu(this.app_name);
        await this.reload_from_db();
    }

    private async reload_from_db() {

        if ((!this.get_initialized) && (!this.get_initializing)) {
            this.set_initializing(true);

            this.set_flat_locale_translations(VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS);

            this.set_initializing(false);
            this.set_initialized(true);
        }

        this.db_menus_by_ids = VOsTypesManager.vosArray_to_vosByIds(await query(MenuElementVO.API_TYPE_ID).select_vos<MenuElementVO>());

        /**
         * On commence par mettre tous les noeuds de niveau 0 pour pouvoir ensuite les référencer
         */
        let updated_nested_items_by_ids: { [id: number]: INestedItem } = {};
        let dones_ids: { [id: number]: boolean } = {};
        this.app_names = [];
        this.selected_item = null;
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            if (this.focus_on_menu_id && (this.focus_on_menu_id == db_menu.id)) {
                this.selected_item = db_menu;
                this.has_modif_selected = false;
                this.app_name = db_menu.app_name;
            }

            if (this.app_names.indexOf(db_menu.app_name) < 0) {
                this.app_names.push(db_menu.app_name);
            }
            if (!this.app_name) {
                this.app_name = db_menu.app_name;
            }

            if (db_menu.menu_parent_id) {
                continue;
            }

            dones_ids[db_menu.id] = true;

            if (this.app_name && (this.app_name != db_menu.app_name)) {
                continue;
            }

            updated_nested_items_by_ids[db_menu.id] = {
                id: db_menu.id,
                text: this.get_flat_locale_translations[db_menu.translatable_title],
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: [],
                hidden: db_menu.hidden
            };
        }

        /**
         * Ensuite on ajoute le niveau 1
         */
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            if (dones_ids[db_menu.id]) {
                continue;
            }

            if (!updated_nested_items_by_ids[db_menu.menu_parent_id]) {
                continue;
            }

            dones_ids[db_menu.id] = true;

            if (!updated_nested_items_by_ids[db_menu.menu_parent_id].children) {
                updated_nested_items_by_ids[db_menu.menu_parent_id].children = [];
            }
            updated_nested_items_by_ids[db_menu.menu_parent_id].children.push({
                id: db_menu.id,
                text: this.get_flat_locale_translations[db_menu.translatable_title],
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: [],
                hidden: db_menu.hidden
            });
        }

        /**
         * Ensuite on ajoute le niveau 2
         */
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            if (dones_ids[db_menu.id]) {
                continue;
            }

            dones_ids[db_menu.id] = true;

            let lvl1_db_menu = this.db_menus_by_ids[db_menu.menu_parent_id];
            if (!updated_nested_items_by_ids[lvl1_db_menu.menu_parent_id]) {
                continue;
            }

            let lvl1_nested_menu = updated_nested_items_by_ids[lvl1_db_menu.menu_parent_id].children.find((m) => m.id == lvl1_db_menu.id);

            if (!lvl1_nested_menu.children) {
                lvl1_nested_menu.children = [];
            }
            lvl1_nested_menu.children.push({
                id: db_menu.id,
                text: this.get_flat_locale_translations[db_menu.translatable_title],
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: [],
                hidden: db_menu.hidden
            });
        }

        let res: INestedItem[] = Object.values(updated_nested_items_by_ids);
        WeightHandler.getInstance().sortByWeight(res);
        for (let i in res) {
            let n = res[i];
            if (n.children && n.children.length) {
                WeightHandler.getInstance().sortByWeight(n.children);
                for (let j in n.children) {
                    let m = n.children[j];
                    if (m.children && m.children.length) {
                        WeightHandler.getInstance().sortByWeight(m.children);
                    }
                }
            }
        }
        this.nestable_items = res;
        this.has_modif = false;
    }

    private changed_menu() {
        this.has_modif = true;
    }

    private async update_db_menu() {

        let diffs = [];

        /**
         * On commence par mettre à jour les champs weight et parent_id
         *  Si on trouve une différence, on envoie vers le serveur
         */

        /**
         * On vide le champs new_weight et new_parent_id (delete pour undefined) et on les recalcule
         */
        for (let i in this.nestable_items) {
            let item = this.nestable_items[i];
            delete item.new_parent_id;
            delete item.new_weight;
        }

        // On init d'abord les poids des éléments qu'on trouve en childs
        for (let i in this.nestable_items) {
            let item = this.nestable_items[i];

            if (item.children && item.children.length) {

                let weight = 0;
                for (let j in item.children) {
                    let child = item.children[j];
                    child.new_weight = weight++;
                    child.new_parent_id = item.id;

                    if (item.children && item.children.length) {

                        let weight_lvl2 = 0;
                        for (let k in child.children) {
                            let child2 = child.children[k];
                            child2.new_weight = weight_lvl2++;
                            child2.new_parent_id = child.id;
                        }
                    }
                }
            }
        }

        // Du coup il reste que le niveau 0
        let weight_lvl_0 = 0;
        for (let i in this.nestable_items) {
            let item = this.nestable_items[i];

            if (typeof item.new_weight !== "undefined") {
                continue;
            }

            item.new_weight = weight_lvl_0++;
            item.new_parent_id = null;
        }

        // Reste à comparer les anciens et nouveaux
        for (let i in this.nestable_items) {
            let item = this.nestable_items[i];

            if ((item.new_weight != item.weight) ||
                (item.new_parent_id != item.parent_id)) {
                let db_menu = this.db_menus_by_ids[item.id];
                db_menu.weight = item.new_weight;
                db_menu.menu_parent_id = item.new_parent_id;
                diffs.push(db_menu);
            }

            if (item.children && item.children.length) {

                for (let j in item.children) {
                    let child = item.children[j];

                    if ((child.new_weight != child.weight) ||
                        (child.new_parent_id != child.parent_id)) {
                        let db_menu = this.db_menus_by_ids[child.id];
                        db_menu.weight = child.new_weight;
                        db_menu.menu_parent_id = child.new_parent_id;
                        diffs.push(db_menu);
                    }

                    if (child.children && child.children.length) {

                        for (let k in child.children) {
                            let child2 = child.children[k];

                            if ((child2.new_weight != child2.weight) ||
                                (child2.new_parent_id != child2.parent_id)) {
                                let db_menu = this.db_menus_by_ids[child2.id];
                                db_menu.weight = child2.new_weight;
                                db_menu.menu_parent_id = child2.new_parent_id;
                                diffs.push(db_menu);
                            }
                        }
                    }
                }
            }
        }

        if (diffs && diffs.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(diffs);
        }
        await this.reload_from_db();
        await MenuController.getInstance().reload_from_db();
    }
}