import { VueConstructor } from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import IInstantiatedPageComponent from '../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleCMS from '../../../../../shared/modules/CMS/ModuleCMS';
import PageVO from '../../../../../shared/modules/CMS/vos/PageVO';
import TemplateComponentVO from '../../../../../shared/modules/CMS/vos/TemplateComponentVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import ImageViewComponent from '../../image/View/ImageViewComponent';
import CMSComponentManager from '../CMSComponentManager';
import ICMSComponentTemplateVue from '../interfaces/ICMSComponentTemplateVue';
import './CMSPageComponent.scss';
import CMSDroppableTemplateComponent from './droppable_template/CMSDroppableTemplateComponent';

@Component({
    template: require('./CMSPageComponent.pug'),
    components: {
        'image-view-component': ImageViewComponent,
        'cms_droppable_template_component': CMSDroppableTemplateComponent,
    }
})
export default class CMSPageComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop()
    private page_id: number;

    private page_vo: PageVO = null;
    private instantiated_page_components: IInstantiatedPageComponent[] = [];
    private has_access_to_cms_fo_admin: boolean = false;

    private hidden_admin: boolean = true;

    get template_components(): TemplateComponentVO[] {
        const res: TemplateComponentVO[] = [];

        for (const i in this.getStoredDatas[TemplateComponentVO.API_TYPE_ID]) {
            const templateComponent: TemplateComponentVO = this.getStoredDatas[TemplateComponentVO.API_TYPE_ID][i] as TemplateComponentVO;
            res.push(templateComponent);
        }
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

    get component_templates_by_type_id(): { [api_type_id: string]: VueConstructor<ICMSComponentTemplateVue> } {
        return CMSComponentManager.getInstance().template_component_vue_by_type_id;
    }

    @Watch("page_id", { immediate: true })
    private async onChange_page_id() {

        if (!this.page_id) {
            this.snotify.error(this.label('cms.loading.no_page_id'));
            return;
        }

        this.startLoading();
        const self = this;

        const promises: Array<Promise<any>> = [];
        promises.push((async () => {
            self.page_vo = await query(PageVO.API_TYPE_ID).filter_by_id(self.page_id).select_vo<PageVO>();
        })());
        promises.push((async () => {
            self.instantiated_page_components = await ModuleCMS.getInstance().getPageComponents(self.page_id);
            if (!self.instantiated_page_components) {
                self.instantiated_page_components = [];
            }
        })());
        promises.push((async () => {
            self.has_access_to_cms_fo_admin = await ModuleAccessPolicy.getInstance().testAccess(ModuleCMS.POLICY_BO_ACCESS);
        })());

        await all_promises(promises);
        this.stopLoading();
    }

    @Watch('has_access_to_cms_fo_admin')
    private async onChange_has_access_to_cms_fo_admin() {
        if (!this.has_access_to_cms_fo_admin) {
            return;
        }

        this.storeDatas({ API_TYPE_ID: TemplateComponentVO.API_TYPE_ID, vos: await query(TemplateComponentVO.API_TYPE_ID).select_vos<TemplateComponentVO>() });

        $("#sortable_page_component_list").sortable({
            revert: true,
            placeholder: "sortable_page_component_list_placeholder",
            receive: async (event, ui) => { await this.onReceiveNewTemplateComponent(event, ui); },
            handle: '.page_component_sort_handle',
            update: async (event, ui) => { await this.onChangeOrder(event, ui); },

        });
    }

    private async onChangeOrder(event, ui) {
        const instantiated_page_component_vo_type: string = $(ui.item).attr('instantiated_page_component_vo_type');
        if (!instantiated_page_component_vo_type) {
            return;
        }

        this.snotify.info(this.label('cms.change_order.start'));

        const instantiated_page_component_id: number = parseInt($(ui.item).attr('instantiated_page_component_id').toString());
        const instantiated_page_component: IInstantiatedPageComponent = await query(instantiated_page_component_vo_type).filter_by_id(instantiated_page_component_id).select_vo<IInstantiatedPageComponent>();
        const index = ui.item.index();

        if (!await this.updateWeights()) {
            this.snotify.error(this.label('cms.change_order.failure'));
            return;
        }

        $("#sortable_page_component_list").sortable("cancel");

        await this.update_list();
    }

    /**
     * On met simplement à jour les poids pour correspondre à l'ordre actuel
     */
    private async updateWeights(): Promise<boolean> {
        const items = $("#sortable_page_component_list>");

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            const instantiated_page_component_vo_type: string = $(item).attr('instantiated_page_component_vo_type');
            if (!instantiated_page_component_vo_type) {
                continue;
            }

            const instantiated_page_component_id: number = parseInt($(item).attr('instantiated_page_component_id').toString());
            const instantiated_page_component: IInstantiatedPageComponent = await query(instantiated_page_component_vo_type).filter_by_id(instantiated_page_component_id).select_vo<IInstantiatedPageComponent>();

            const index: number = parseInt(i.toString());

            if (index == instantiated_page_component.weight) {
                continue;
            }

            instantiated_page_component.weight = index;

            const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(instantiated_page_component);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                return false;
            }
        }

        return true;
    }

    private async onReceiveNewTemplateComponent(event, ui) {
        this.snotify.info(this.label('cms.insert_new_composant.start'));

        const template_component: TemplateComponentVO = $(ui.item).data('template_component');

        // On met à jour les poids, en profitant de la présence du placeholder que l'on va supprimer ensuite
        if (!await this.updateWeights()) {
            this.snotify.error(this.label('cms.insert_new_composant.failure'));
            return;
        }

        // Refuser de rajouter le template
        // $("#sortable_page_component_list").sortable("cancel");

        // L'index fournit est absurde, donc on va le chercher nous-mêmes en nettoyant au passage le dom
        let index: number = 0;
        const items = $('#sortable_page_component_list>');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const instantiated_page_component_vo_type: string = $(item).attr('instantiated_page_component_vo_type');
            if (instantiated_page_component_vo_type) {
                continue;
            }

            // si on a pas de type, c'est qu'on est sur l'insert
            index = parseInt(i.toString());
        }
        $('#sortable_page_component_list>:nth-child(' + (index + 1) + ')').remove();

        const new_composant_constructor: IInstantiatedPageComponent = {
            id: null,
            _type: template_component.type_id,
            page_id: this.page_id,
            weight: index
        };

        const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_composant_constructor);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('cms.insert_new_composant.failure'));
            return;
        }
        new_composant_constructor.id = insertOrDeleteQueryResult.id;

        await this.update_list();
    }

    private async deleteComponent(instantiated_page_component: IInstantiatedPageComponent) {
        const self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('cms.delete.confirmation.body'), self.label('cms.delete.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('cms.delete.start'));

                        const insertOrDeleteQueryResult_: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([instantiated_page_component]);
                        if ((!insertOrDeleteQueryResult_) || (insertOrDeleteQueryResult_.length != 1)) {
                            self.snotify.error(self.label('cms.delete.error'));
                            return;
                        }

                        await this.update_list();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async update_list(force: boolean = false) {

        if (force) {
            for (const i in ModuleCMS.getInstance().registered_template_components_by_type) {
                const registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([registered_template_component.type_id]);
            }
            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([TemplateComponentVO.API_TYPE_ID]);
        }

        $("#sortable_page_component_list").sortable("destroy");

        this.instantiated_page_components = await ModuleCMS.getInstance().getPageComponents(this.page_id);
        if (!this.instantiated_page_components) {
            this.instantiated_page_components = [];
        }

        this.storeDatas({ API_TYPE_ID: TemplateComponentVO.API_TYPE_ID, vos: await query(TemplateComponentVO.API_TYPE_ID).select_vos<TemplateComponentVO>() });

        // $("#sortable_page_component_list").sortable({
        //     revert: true,
        //     placeholder: "sortable_page_component_list_placeholder",
        //     receive: async (event, ui) => { await this.onReceiveNewTemplateComponent(event, ui); },
        //     handle: '.page_component_sort_handle',
        //     update: async (event, ui) => { await this.onChangeOrder(event, ui); },

        // });

        // Waiting for an update of the lists
        const self = this;
        this.$nextTick(() => {
            // $("#sortable_page_component_list").sortable("refresh");
            $("#sortable_page_component_list").sortable({
                revert: true,
                placeholder: "sortable_page_component_list_placeholder",
                receive: async (event, ui) => { await this.onReceiveNewTemplateComponent(event, ui); },
                handle: '.page_component_sort_handle',
                update: async (event, ui) => { await this.onChangeOrder(event, ui); },

            });
            self.snotify.success(self.label('cms.action.ok'));
        });
    }
}