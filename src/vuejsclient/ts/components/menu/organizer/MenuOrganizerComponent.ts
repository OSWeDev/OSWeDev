import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Component } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import IWeightedItem from '../../../../../shared/tools/interfaces/IWeightedItem';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
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
        Vuenestablehandle: VueNestableHandle
    }
})
export default class MenuOrganizerComponent extends VueComponentBase {

    private nestable_items: INestedItem[] = [];

    private db_menus_by_ids: { [id: number]: MenuElementVO } = {};

    private has_modif: boolean = false;

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

    private async reload_from_db() {
        this.db_menus_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<MenuElementVO>(MenuElementVO.API_TYPE_ID));

        /**
         * On commence par mettre tous les noeuds de niveau 0 pour pouvoir ensuite les référencer
         */
        let updated_nested_items_by_ids: { [id: number]: INestedItem } = {};
        let dones_ids: { [id: number]: boolean } = {};
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            if (db_menu.menu_parent_id) {
                continue;
            }

            dones_ids[db_menu.id] = true;
            updated_nested_items_by_ids[db_menu.id] = {
                id: db_menu.id,
                text: this.t(db_menu.translatable_title),
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: []
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
                text: this.t(db_menu.translatable_title),
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: []
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
            let lvl1_nested_menu = updated_nested_items_by_ids[lvl1_db_menu.menu_parent_id].children.find((m) => m.id == lvl1_db_menu.id);

            if (!lvl1_nested_menu.children) {
                lvl1_nested_menu.children = [];
            }
            lvl1_nested_menu.children.push({
                id: db_menu.id,
                text: this.t(db_menu.translatable_title),
                weight: db_menu.weight,
                parent_id: db_menu.menu_parent_id,
                target: db_menu.target,
                children: []
            });
        }

        let res: INestedItem[] = Object.values(updated_nested_items_by_ids);
        WeightHandler.getInstance().sortByWeight(res);
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
                }
            }
        }

        if (diffs && diffs.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(diffs);
        }
        await this.reload_from_db();
        MenuController.getInstance().reload(Object.values(this.db_menus_by_ids));
    }
}