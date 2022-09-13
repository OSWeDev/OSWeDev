import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckList from '../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import ModuleContextFilter from '../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import VueComponentBase from '../VueComponentBase';
import './CheckListComponent.scss';
import CheckListControllerBase from './CheckListControllerBase';
import CheckListItemComponent from './Item/CheckListItemComponent';
import CheckListModalComponent from './modal/CheckListModalComponent';
import Vue from 'vue';


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
    private checkpoints: { [id: number]: ICheckPoint } = {};

    private infos_cols_labels: string[] = [];

    private filter_text: string = null;

    private show_anyway: boolean = false;

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
        let self = this;
        this.stopLoading();
        this.debounced_loading();

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
        let self = this;
        let promises = [];

        let checklist: ICheckList = null;
        let checklistitems: { [id: number]: ICheckListItem } = {};

        promises.push((async () => {

            let filter = new ContextFilterVO();
            filter.field_id = 'checklist_id';
            filter.vo_type = self.checklist_shared_module.checklistitem_type_id;
            filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
            filter.param_numeric = self.list_id;

            checklist = await ModuleDAO.getInstance().getVoById<ICheckList>(self.checklist_shared_module.checklist_type_id, self.list_id);
            if (!checklist) {
                return;
            }

            let query_: ContextQueryVO = query(self.checklist_shared_module.checklistitem_type_id).set_limit(checklist.limit_affichage ? checklist.limit_affichage : 0, 0);
            query_.base_api_type_id = self.checklist_shared_module.checklistitem_type_id;
            query_.active_api_type_ids = [self.checklist_shared_module.checklistitem_type_id];
            query_.filters = [filter];
            query_.set_sort(new SortByVO(self.checklist_shared_module.checklistitem_type_id, 'id', false));

            /**
             * On utilise pas l'offset par ce que le filtrage va déjà avoir cet effet, les states sont mis à jour
             */
            let items: ICheckListItem[] = await ModuleContextFilter.getInstance().select_vos<ICheckListItem>(query_);
            items = (items && items.length) ? items.filter((e) => !e.archived) : [];
            checklistitems = (items && items.length) ? VOsTypesManager.getInstance().vosArray_to_vosByIds(items) : [];
        })());

        let checkpoints: { [id: number]: ICheckPoint } = {};
        promises.push((async () => {
            checkpoints = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPoint>(
                self.checklist_shared_module.checkpoint_type_id, 'checklist_id', [self.list_id]));
        })());

        await Promise.all(promises);

        // promises = [];
        // let checkpoints_ids = ObjectHandler.getInstance().getIdsList(checkpoints);

        // let checkpointsdeps: ICheckPointDep[] = [];
        // promises.push((async () => {
        //     checkpointsdeps = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPointDep>(
        //         this.checklist_shared_module.checkpoint_type_id, 'checkpoint_id', checkpoints_ids);
        // })());

        // let checklistitemcheckpoints: ICheckListItemCheckPoints[] = [];
        // promises.push((async () => {
        //     checklistitemcheckpoints = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckListItemCheckPoints>(
        //         this.checklist_shared_module.checklistitemcheckpoints_type_id, 'checkpoint_id', checkpoints_ids);
        // })());

        // await Promise.all(promises);

        self.checklist = checklist;
        self.checklistitems = checklistitems;
        self.checkpoints = checkpoints;

        if (this.item_id) {
            this.selected_checklist_item = this.checklistitems[this.item_id];
        }

        await this.checklist_controller.component_hook_onAsyncLoading(
            this.getStoredDatas, this.storeDatas, this.checklist, this.checklistitems, this.checkpoints);

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

            if (!!self.selected_checklist_item) {

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

        if (!!self.item_id) {
            self.$nextTick(tryOpenModal);
        } else {
            if ($('#checklist_item_modal')) {
                $('#checklist_item_modal').modal('hide');
            }
        }
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
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(
            await this.checklist_controller.getCheckListItemNewInstance()
        );
        if ((!res) || !res.id) {
            ConsoleHandler.getInstance().error('CheckListComponent:createNew:failed');
            this.debounced_loading();
            return;
        }
        this.$router.push(this.global_route_path + '/' + this.list_id + '/' + res.id);

        this.debounced_loading();
    }

    private async deleteSelectedItem(item: ICheckListItem) {
        let res: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([item]);
        if ((!res) || (!res.length) || (!res[0]) || (!res[0].id)) {
            this.snotify.error(this.label('CheckListComponent.deleteSelectedItem.failed'));
            return;
        }
        delete this.checklistitems[item.id];
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems)) {
            this.checklistitems = {};
        }
        this.$router.push(this.global_route_path + '/' + this.list_id);
    }

    private async onchangevo(vo: ICheckListItem) {

        if (!vo) {
            return;
        }

        Vue.set(this.checklistitems, vo.id, await ModuleDAO.getInstance().getVoById(this.checklist_shared_module.checklistitem_type_id, vo.id));

        this.selected_checklist_item = this.checklistitems[vo.id];

        if (this.checklistitems[vo.id].archived) {
            delete this.checklistitems[vo.id];
        }
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems)) {
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
                for (let i in e) {
                    let field = e[i];

                    if (typeof field !== 'string') {
                        continue;
                    }

                    if (field.indexOf(this.filter_text) >= 0) {
                        return true;
                    }
                }

                let infos_cols_content = this.checklist_controller.get_infos_cols_content(e);
                for (let i in infos_cols_content) {
                    let field = infos_cols_content[i];

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
        if ((!this.checkpoints) || (!this.step_id)) {
            return null;
        }

        return this.checkpoints[this.step_id];
    }

    get ordered_checkpoints(): ICheckPoint[] {

        if ((!this.checkpoints) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checkpoints))) {
            return null;
        }

        let res: ICheckPoint[] = [];

        res = Object.values(this.checkpoints);
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

    get has_checklistitems() {
        if (!this.checklistitems) {
            return false;
        }

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checklistitems);
    }
}