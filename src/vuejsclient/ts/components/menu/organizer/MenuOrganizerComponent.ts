import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Component } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import INestedItem from './INestedItem';
import './MenuOrganizerComponent.scss';

@Component({
    template: require('./MenuOrganizerComponent.pug'),
    components: {
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle
    }
})
export default class MenuOrganizerComponent extends VueComponentBase {

    private nestable_items: INestedItem[] = [];

    private db_menus_by_ids: { [id: number]: MenuElementVO } = {};

    private async mounted() {
        await this.reload_from_db();
    }

    private async reload_from_db() {
        this.db_menus_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<MenuElementVO>(MenuElementVO.API_TYPE_ID));

        /**
         * On commence par mettre tous les noeuds pour pouvoir ensuite les référencer
         */
        let updated_nested_items_by_ids: { [id: number]: INestedItem } = {};
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            updated_nested_items_by_ids[db_menu.id] = {
                id: db_menu.id,
                text: this.t(db_menu.translatable_title),
                db_weight: db_menu.weight,
                db_parent_id: db_menu.menu_parent_id
            };
        }

        /**
         * Ensuite on fait le lien entre les items
         */
        for (let i in this.db_menus_by_ids) {
            let db_menu = this.db_menus_by_ids[i];

            if (db_menu.menu_parent_id) {
                if (!updated_nested_items_by_ids[db_menu.menu_parent_id].children) {
                    updated_nested_items_by_ids[db_menu.menu_parent_id].children = [];
                }
                updated_nested_items_by_ids[db_menu.menu_parent_id].children.push(updated_nested_items_by_ids[db_menu.id]);
            }
        }

        this.nestable_items = Object.values(updated_nested_items_by_ids);
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

            if (typeof item.new_weight === "undefined") {
                continue;
            }

            item.new_weight = weight_lvl_0++;
            item.new_parent_id = null;
        }

        // Reste à comparer les anciens et nouveaux
        for (let i in this.nestable_items) {
            let item = this.nestable_items[i];

            if ((item.new_weight != item.db_weight) ||
                (item.new_parent_id != item.db_parent_id)) {
                let db_menu = this.db_menus_by_ids[item.id];
                db_menu.weight = item.new_weight;
                db_menu.parent_id = item.new_parent_id;
                diffs.push(db_menu);
            }
        }

        if (diffs && diffs.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(diffs);
            await this.reload_from_db();
        }
    }
}