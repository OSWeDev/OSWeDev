import debounce from 'lodash/debounce';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import ICheckList from '../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueComponentBase from '../VueComponentBase';
import CRUDFormServices from '../crud/component/CRUDFormServices';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import './CheckListComponent.scss';
import CheckListControllerBase from './CheckListControllerBase';
import CheckListItemComponent from './Item/CheckListItemComponent';
import CheckListModalComponent from './modal/CheckListModalComponent';


@Component({
    template: require('./CheckListComponent.pug'),
    components: {
        Checklistmodalcomponent: CheckListModalComponent,
        Checklistitemcomponent: CheckListItemComponent
    }
})
export default class CheckListComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @Prop()
    public global_route_path: string;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public checklist_controller: CheckListControllerBase;

    @Prop({ default: null })
    private item_id: number;

    @Prop({ default: null })
    private step_id: number;

    @Prop({ default: null })
    private list_id: number;

    @Prop({ default: null })
    private checklist_shared_module: ModuleCheckListBase;

    private modalinit: boolean = false;

    private checklist: ICheckList = null;
    private checklistitems: { [id: number]: ICheckListItem } = {};
    private checkpoints_by_id: { [id: number]: ICheckPoint } = {};

    private infos_cols_labels: string[] = [];

    private filter_text: string = null;

    private show_anyway: boolean = false;
    private is_load: boolean = false;

    private selected_checklist_item: ICheckListItem = null;

    // private checkpointsdeps: { [check_point_id: number]: number[] } = {};
    // private checklistitemcheckpoints: { [checklistitem_id: number]: { [checkpoint_id: number]: boolean } } = {};

    private debounced_loading = debounce(this.loading.bind(this), 100);

    @Watch('global_route_path')
    @Watch('modal_show')
    @Watch('checklist_controller')
    @Watch('item_id')
    @Watch('step_id')
    @Watch('checklist_id')
    @Watch('checklist_shared_module')
    private watchers() {
        if (this.item_id && this.checklistitems) {
            this.selected_checklist_item = this.checklistitems[this.item_id];
        }

        this.debounced_loading();
    }

    @Watch("$route")
    private async onrouteChange() {

        await this.handle_modal_show_hide();
    }

    private mounted() {
        const self = this;
        this.stopLoading();
        this.debounced_loading();

        $('.modal-backdrop').remove();

        this.$nextTick(async () => {
            if (!self.modalinit) {
                self.modalinit = true;
                $("#checklist_item_modal").on("hidden.bs.modal", function () {
                    self.close_modal();
                });
            }
        });
    }

    private close_modal() {
        this.$router.push(this.global_route_path + '/' + this.list_id);
    }

    private async loading() {
        const self = this;
        const promises = [];
        this.is_load = false;

        let checklist: ICheckList = null;
        let checklistitems: { [id: number]: ICheckListItem } = {};

        promises.push((async () => {

            checklist = await query(self.checklist_shared_module.checklist_type_id)
                .filter_by_id(self.list_id)
                .select_vo<ICheckList>();

            if (!checklist) {
                return;
            }

            /**
             * On utilise pas l'offset par ce que le filtrage va déjà avoir cet effet, les states sont mis à jour
             */
            const items: ICheckListItem[] = await query(self.checklist_shared_module.checklistitem_type_id)
                .filter_by_num_eq(field_names<ICheckListItem>().checklist_id, self.list_id)
                .set_limit(checklist.limit_affichage ? checklist.limit_affichage : 0, 0)
                .filter_is_false(field_names<ICheckListItem>().archived)
                .set_sort(new SortByVO(self.checklist_shared_module.checklistitem_type_id, 'id', false))
                .select_vos<ICheckListItem>();
            checklistitems = (items && items.length) ? VOsTypesManager.vosArray_to_vosByIds(items) : [];
        })());

        let checkpoints_by_id: { [id: number]: ICheckPoint } = {};

        promises.push((async () => {

            const checkpoints: ICheckPoint[] = await query(self.checklist_shared_module.checkpoint_type_id)
                .filter_by_num_eq(field_names<ICheckPoint>().checklist_id, self.list_id)
                .select_vos<ICheckPoint>();

            checkpoints_by_id = VOsTypesManager.vosArray_to_vosByIds(checkpoints);
        })());

        await all_promises(promises);

        self.checklist = checklist;
        self.checklistitems = checklistitems;
        self.checkpoints_by_id = checkpoints_by_id;

        if (this.item_id) {
            this.selected_checklist_item = this.checklistitems[this.item_id];
        }

        await this.checklist_controller.component_hook_onAsyncLoading(
            this.getStoredDatas,
            this.storeDatas
        );

        this.infos_cols_labels = this.checklist_controller.get_infos_cols_labels();

        // this.checkpointsdeps = {};
        // for (let i in checkpointsdeps) {
        //     let checkpointdep: ICheckPointDep = checkpointsdeps[i];

        //     if (!this.checkpointsdeps[checkpointdep.checkpoint_id]) {
        //         this.checkpointsdeps[checkpointdep.checkpoint_id] = [];
        //     }
        //     this.checkpointsdeps[checkpointdep.checkpoint_id].push(checkpointdep.dependson_id);
        // }

        // this.checklistitemcheckpoints = {};
        // for (let i in checklistitemcheckpoints) {
        //     let checklistitemcheckpoint: ICheckListItemCheckPoints = checklistitemcheckpoints[i];

        //     if (!this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id]) {
        //         this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id] = {};
        //     }
        //     this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id][checklistitemcheckpoint.checkpoint_id] = true;
        // }

        // On limite à 20 tentatives
        let timeout: number = 20;
        async function tryOpenModal() {

            if (self.selected_checklist_item) {

                await self.handle_modal_show_hide();
                return;
            }

            timeout--;
            if (timeout < 0) {

                // On change la route si on a pas réussi à ouvrir le rdv
                if (!self.selected_checklist_item) {
                    self.$router.push(self.global_route_path + '/' + self.list_id);
                }

                return;
            }

            setTimeout(tryOpenModal, 100);
        }

        if (self.item_id) {
            self.$nextTick(tryOpenModal);
        } else {
            if ($('#checklist_item_modal')) {
                $('#checklist_item_modal').modal('hide');
            }
        }

        this.is_load = true;
    }

    private async handle_modal_show_hide() {
        if (!this.modal_show) {
            $('#checklist_item_modal').modal('hide');
        }
        if (this.modal_show) {
            if (!this.selected_checklist_item) {
                $('#checklist_item_modal').modal('hide');
                return;
            }
            $('#checklist_item_modal').modal('show');
            return;
        }
    }

    private async createNew() {
        const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(
            await this.checklist_controller.getCheckListItemNewInstance()
        );
        if ((!res) || !res.id) {
            ConsoleHandler.error('CheckListComponent:createNew:failed');
            this.debounced_loading();
            return;
        }
        this.$router.push(this.global_route_path + '/' + this.list_id + '/' + res.id);

        this.debounced_loading();
    }

    private async deleteSelectedItem(item: ICheckListItem) {
        const res: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([item]);
        if ((!res) || (!res.length) || (!res[0]) || (!res[0].id)) {
            this.snotify.error(this.label('CheckListComponent.deleteSelectedItem.failed'));
            return;
        }
        delete this.checklistitems[item.id];
        if (!ObjectHandler.hasAtLeastOneAttribute(this.checklistitems)) {
            this.checklistitems = {};
        }
        this.$router.push(this.global_route_path + '/' + this.list_id);
    }

    private async onchangevo(vo: ICheckListItem, field: DatatableField<any, any>, value: any) {

        if (!vo) {
            return;
        }

        /**
         * Problème, avec la sauvegarde auto, dans les 2 secondes d'attente de la sauvegarde, on peut avoir modifié d'autres champs localement et pas
         *  encore côté serveur, donc on perd les données. Si des modifications sont en attente on ne fait rien du coup et on rechargera par la suite
         */

        if (CRUDFormServices.getInstance().has_auto_updates_waiting()) {
            return;
        }

        Vue.set(this.checklistitems, vo.id, await query(this.checklist_shared_module.checklistitem_type_id).filter_by_id(vo.id).select_vo());

        this.selected_checklist_item = this.checklistitems[vo.id];

        if (this.checklistitems[vo.id].archived) {
            delete this.checklistitems[vo.id];
        }
        if (!ObjectHandler.hasAtLeastOneAttribute(this.checklistitems)) {
            this.checklistitems = {};
        }
    }

    private changecheckpoint(cp: ICheckPoint) {
        this.$router.push(
            this.global_route_path + '/' + this.selected_checklist_item.checklist_id + '/' + this.selected_checklist_item.id + '/' + cp.id
        );
    }

    get ordered_checklistitems() {

        if (!this.checklist_controller) {
            return null;
        }

        let res: ICheckListItem[] = [];

        this.show_anyway = false;

        if (!this.checklistitems) {
            return [];
        }

        res = Object.values(this.checklistitems);

        if (this.filter_text) {

            // let desc_checks: ICheckListItem[] = [];
            res = res.filter((e: ICheckListItem) => {
                for (const i in e) {
                    const field = e[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                const infos_cols_content = this.checklist_controller.get_infos_cols_content(e);
                for (const i in infos_cols_content) {
                    const field = infos_cols_content[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                // desc_checks.push(e);

                return false;
            });
        }

        res.sort(this.checklist_controller.items_sorter);
        return res;
    }

    get selected_checkpoint() {
        if ((!this.checkpoints_by_id) || (!this.step_id)) {
            return null;
        }

        return this.checkpoints_by_id[this.step_id];
    }

    get ordered_checkpoints(): ICheckPoint[] {

        if ((!this.checkpoints_by_id) || (!ObjectHandler.hasAtLeastOneAttribute(this.checkpoints_by_id))) {
            return null;
        }

        let res: ICheckPoint[] = [];

        res = Object.values(this.checkpoints_by_id);
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

    get has_checklist_items() {
        if (!this.checklistitems) {
            return false;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.checklistitems);
    }
}