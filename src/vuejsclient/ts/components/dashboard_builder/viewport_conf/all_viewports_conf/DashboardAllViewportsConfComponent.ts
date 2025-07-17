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
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';

@Component({
    template: require('./DashboardAllViewportsConfComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardAllViewportsConfComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @SyncVOs(DashboardViewportVO.API_TYPE_ID, {
        debug: true,
    })
    public all_viewports: DashboardViewportVO[] = [];

    @TestAccess(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DashboardViewportVO.API_TYPE_ID))
    public can_edit: boolean = false;

    @TestAccess(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, DashboardViewportVO.API_TYPE_ID))
    public can_delete: boolean = false;

    @TestAccess(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DashboardViewportVO.API_TYPE_ID))
    public can_create: boolean = false;

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_dashboard_current_viewport);
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<this>().get_dashboard);
    }

    get has_only_one_activated_viewport(): boolean {
        return this.get_dashboard && this.get_dashboard.activated_viewport_id_ranges &&
            (RangeHandler.getCardinalFromArray(this.get_dashboard.activated_viewport_id_ranges) === 1);
    }

    get activated_viewports_by_id(): { [id: number]: boolean } {
        if (!this.get_dashboard || !this.get_dashboard.activated_viewport_id_ranges) {
            return {};
        }

        const res: { [id: number]: boolean } = {};
        RangeHandler.foreach_ranges_sync(this.get_dashboard.activated_viewport_id_ranges, (viewport_id: number) => {
            res[viewport_id] = true;
        });
        return res;
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public set_dashboard_current_viewport(dashboard_current_viewport: DashboardViewportVO) {

        if (!this.activated_viewports_by_id[dashboard_current_viewport.id]) {
            return;
        }

        return this.vuexAct(reflect<this>().set_dashboard_current_viewport, dashboard_current_viewport);
    }

    private async switch_viewport_activation(viewport: DashboardViewportVO) {
        if (!this.get_dashboard || !this.activated_viewports_by_id) {
            return;
        }

        // Si le viewport est le dernier activé, on peut pas le désactiver
        if (this.has_only_one_activated_viewport && this.activated_viewports_by_id[viewport.id]) {
            this.snotify.warning(this.label('DashboardAllViewportsConfComponent.switch_viewport_activation.last_viewport'));
            return;
        }

        // On active ou désactive le viewport
        if (this.activated_viewports_by_id[viewport.id]) {
            // Désactivation
            this.get_dashboard.activated_viewport_id_ranges = RangeHandler.cut_ranges(RangeHandler.create_single_elt_NumRange(viewport.id, NumSegment.TYPE_INT), this.get_dashboard.activated_viewport_id_ranges).remaining_items || [];
        } else {
            // Activation
            this.get_dashboard.activated_viewport_id_ranges.push(RangeHandler.create_single_elt_NumRange(viewport.id, NumSegment.TYPE_INT));
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.get_dashboard);
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