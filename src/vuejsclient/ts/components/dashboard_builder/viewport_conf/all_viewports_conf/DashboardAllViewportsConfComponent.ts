import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardViewportVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { SyncVOs } from '../../../../tools/annotations/SyncVOs';
import { TestAccess } from '../../../../tools/annotations/TestAccess';
import VueComponentBase from '../../../VueComponentBase';
import './DashboardAllViewportsConfComponent.scss';
import { ModuleModalsAndBasicPageComponentsHolderGetter } from '../../../modals_and_basic_page_components_holder/ModalsAndBasicPageComponentsHolderStore';
import CRUDUpdateModalComponent from '../../widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import CRUDCreateModalComponent from '../../widgets/table_widget/crud_modals/create/CRUDCreateModalComponent';

@Component({
    template: require('./DashboardAllViewportsConfComponent.pug'),
    components: {
    }
})
export default class DashboardAllViewportsConfComponent extends VueComponentBase {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @Prop()
    public readonly dashboard: DashboardVO;

    @SyncVOs(DashboardViewportVO.API_TYPE_ID)
    public all_viewports: DashboardViewportVO[] = [];

    @TestAccess(DAOController.getAccessPolicyName(DashboardViewportVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE))
    public can_edit: boolean = false;

    @TestAccess(DAOController.getAccessPolicyName(DashboardViewportVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_DELETE))
    public can_delete: boolean = false;

    @TestAccess(DAOController.getAccessPolicyName(DashboardViewportVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE))
    public can_create: boolean = false;

    get get_selected_viewport(): DashboardViewportVO {
        return this.vuexGet<DashboardViewportVO>(reflect<this>().get_selected_viewport);
    }

    get activated_viewports_by_id(): { [id: number]: boolean } {
        if (!this.dashboard || !this.dashboard.activated_viewport_id_ranges) {
            return {};
        }

        const res: { [id: number]: boolean } = {};
        RangeHandler.foreach_ranges_sync(this.dashboard.activated_viewport_id_ranges, (viewport_id: number) => {
            res[viewport_id] = true;
        });
        return res;
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_selected_viewport(selected_viewport: DashboardViewportVO) {
        return this.vuexAct(reflect<this>().set_selected_viewport, selected_viewport);
    }

    private async switch_viewport_activation(viewport: DashboardViewportVO) {
        if (!this.dashboard || !this.activated_viewports_by_id) {
            return;
        }

        // Si le viewport est le viewport par défaut on peut pas le désactiver
        if (viewport.is_default && this.activated_viewports_by_id[viewport.id]) {
            return;
        }

        // On active ou désactive le viewport
        if (this.activated_viewports_by_id[viewport.id]) {
            // Désactivation
            this.dashboard.activated_viewport_id_ranges = RangeHandler.cut_ranges(RangeHandler.create_single_elt_NumRange(viewport.id, NumSegment.TYPE_INT), this.dashboard.activated_viewport_id_ranges).remaining_items || [];
        } else {
            // Activation
            this.dashboard.activated_viewport_id_ranges.push(RangeHandler.create_single_elt_NumRange(viewport.id, NumSegment.TYPE_INT));
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.dashboard);
    }

    private async edit_viewport(viewport: DashboardViewportVO) {
        await this.get_Crudupdatemodalcomponent.open_modal(
            viewport,
            this.storeDatas,
            null,
        );
    }

    private async delete_viewport(viewport: DashboardViewportVO) {
        const self = this;

        return new Promise<boolean>((accept, reject) => {

            self.snotify.confirm(self.label('DashboardAllViewportsConfComponent.delete_viewport.body'), self.label('DashboardAllViewportsConfComponent.delete_viewport.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);

                            if (!await ModuleDAO.getInstance().deleteVOs([viewport])) {
                                self.snotify.error(self.label('DashboardAllViewportsConfComponent.delete_viewport.error'));
                                accept(false);
                                return;
                            }

                            self.snotify.success(self.label('DashboardAllViewportsConfComponent.delete_viewport.deleted'));
                            accept(true);
                        },
                        bold: false
                    },
                    {
                        text: self.t('CANCEL'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                            self.snotify.warning(self.label('DashboardAllViewportsConfComponent.delete_viewport.canceled'));
                            accept(true);
                        }
                    },
                ]
            });
        });
    }

    private async create_new_viewport() {
        await this.get_Crudcreatemodalcomponent.open_modal(
            DashboardViewportVO.API_TYPE_ID,
            this.storeDatas,
            null,
        );
    }
}