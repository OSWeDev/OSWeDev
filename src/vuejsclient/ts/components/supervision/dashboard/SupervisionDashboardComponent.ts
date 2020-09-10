import Component from 'vue-class-component';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
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

    private async switch_paused(item: ISupervisedItem) {
        if (item.state == SupervisionController.STATE_PAUSED) {
            item.state = SupervisionController.STATE_UNKOWN;
        } else {
            item.state = SupervisionController.STATE_PAUSED;
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(item);
        await this.load_supervised_items();
    }

    private async mounted() {

        this.continue_reloading = true;
        await this.load_supervised_items_and_continue();
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private async load_supervised_items_and_continue() {
        if (!this.continue_reloading) {
            return;
        }

        await this.load_supervised_items();
        setTimeout(this.load_supervised_items_and_continue.bind(this), (60000));

    }

    private async load_supervised_items() {

        let new_supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
        let promises = [];

        for (let api_type_id in SupervisionController.getInstance().registered_api_types) {

            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([api_type_id]);
            promises.push((async () => {
                let items = await ModuleDAO.getInstance().getVos<ISupervisedItem>(api_type_id);

                for (let i in items) {
                    let item = items[i];

                    new_supervised_items_by_names[item.name] = item;
                }
            })());
        }

        await Promise.all(promises);

        this.supervised_items_by_names = new_supervised_items_by_names;
    }

    get nb_errors(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                res++;
            }
        }

        return res;
    }

    get nb_warns(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_WARN) {
                res++;
            }
        }

        return res;
    }

    get nb_oks(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_OK) {
                res++;
            }
        }

        return res;
    }

    get nb_pauses(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_PAUSED) {
                res++;
            }
        }

        return res;
    }

    get nb_errors_read(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_ERROR_READ) {
                res++;
            }
        }

        return res;
    }

    get nb_warns_read(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_WARN_READ) {
                res++;
            }
        }

        return res;
    }

    get nb_unknowns(): number {
        let res: number = 0;
        for (let i in this.supervised_items_by_names) {
            let supervised_item = this.supervised_items_by_names[i];

            if (supervised_item.state == SupervisionController.STATE_UNKOWN) {
                res++;
            }
        }

        return res;
    }

    get ordered_supervised_items(): ISupervisedItem[] {
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

            res.push(supervised_item);
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

        return res;
    }
}