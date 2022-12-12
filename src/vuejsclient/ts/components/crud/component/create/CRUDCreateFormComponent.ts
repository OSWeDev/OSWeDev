import { Component, Prop, Watch } from 'vue-property-decorator';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleCRUDGetter } from '../../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import DatatableComponent from '../../../datatable/component/DatatableComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import "./CRUDCreateFormComponent.scss";

/*Import pour la copie d'un widget*/
import { cloneDeep } from "lodash";
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import { ModuleDroppableVoFieldsAction } from '../../../../components/dashboard_builder/droppable_vo_fields/DroppableVoFieldsStore';
import TranslatableTextVO from '../../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../../shared/modules/Translation/vos/TranslationVO';
import DashboardBuilderController from '../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import ModuleTranslation from "../../../../../../shared/modules/Translation/ModuleTranslation";
import { ModuleTranslatableTextAction } from '../../../InlineTranslatableText/TranslatableTextStore';

@Component({
    template: require('./CRUDCreateFormComponent.pug'),
    components: {
        Datatable: DatatableComponent,
        Inlinetranslatabletext: InlineTranslatableText //copy_widget
    },
})
export default class CRUDCreateFormComponent extends VueComponentBase {


    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    private updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    private removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    private storeData: (vo: IDistantVOBase) => void;

    @ModuleCRUDGetter
    private getSelectedVOs: IDistantVOBase[];

    @ModuleAlertAction
    private clear_alerts: () => void;
    @ModuleAlertAction
    private register_alerts: (alerts: Alert[]) => void;

    @Prop({ default: null })
    private api_type_id: string;

    @Prop({ default: false })
    private close_on_submit: boolean;

    @Prop({ default: null })
    private vo_init: IDistantVOBase;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: false })
    private show_placeholder: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_createDatatable_key: number = 0;
    private crud: CRUD<any> = null;

    /*Propriété pour la copie d'un widget */


    @ModuleTranslatableTextAction
    private set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    @Prop({ default: null })
    private copy_widget: boolean;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;  //Contenant du widget à copier/déplacer

    @Prop({ default: null })
    private pages: DashboardPageVO[];


    @Prop({ default: null })
    private page_id: number; //Page en cours

    private copy_to_page: DashboardPageVO = null; //Page vers laquel on souhaite copier/déplacer

    public async update_key() {
        if (this.crud && (this.crud_createDatatable_key != this.crud.createDatatable.key)) {
            await this.prepareNewVO();
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
    }

    @Watch("api_type_id", { immediate: true })
    private async onchange_api_type_id() {
        if (!this.api_type_id) {
            if (this.crud) {
                this.crud = null;
            }
            return;
        }

        if (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id]) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.api_type_id,
                null,
                null,
                null
            );
        }

        if ((!this.crud) || (this.crud.api_type_id != this.api_type_id)) {
            this.crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];
        }
    }

    @Watch("vo_init")
    private async on_change_vo_init() {
        await this.prepareNewVO();
    }

    private async loaddatas() {

        this.isLoading = true;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            this.isLoading = false;
            return;
        }

        /**
         * On ne veut pas charger par défaut (sauf ref reflective dans un champ de l'objet) tous les vos du type du vo modifié
         */
        await all_promises(CRUDFormServices.getInstance().loadDatasFromDatatable(this.crud.createDatatable, this.api_types_involved, this.storeDatas, true));

        await this.prepareNewVO();

        this.isLoading = false;
    }

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {
        if (this.crud) {
            await this.reload_datas();
        }
    }

    @Watch("page_id", { immediate: true })
    private async updated_page_id() { //Si jamais on change d'onglet
        if (this.copy_to_page) {
            this.copy_to_page = null;
        }
    }

    private async prepareNewVO() {

        this.newVO = await CRUDFormServices.getInstance().getNewVO(
            this.crud, this.vo_init, this.onChangeVO
        );
    }



    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', {
            datatable_title:
                this.t(VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].label.code_text)
        });
    }




    private async createVO() {
        let self = this;
        self.snotify.async(self.label('crud.create.starting'), () =>
            new Promise(async (resolve, reject) => {


                self.creating_vo = true;
                let createdVO = null;

                if ((!self.newVO) || (self.newVO._type !== self.crud.readDatatable.API_TYPE_ID)) {
                    self.creating_vo = false;
                    reject({
                        body: self.label('crud.create.errors.newvo_failure'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                if (!!self.newVO.id) {
                    self.newVO.id = null;
                }

                try {

                    if (!CRUDFormServices.getInstance().checkForm(
                        self.newVO, self.crud.createDatatable, self.clear_alerts, self.register_alerts)) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.check_form.field_required'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On passe la traduction depuis IHM sur les champs
                    let apiokVo = CRUDFormServices.getInstance().IHMToData(self.newVO, self.crud.createDatatable, false);

                    // On utilise le trigger si il est présent sur le crud
                    if (self.crud.preCreate) {
                        let errorMsg = await self.crud.preCreate(apiokVo, self.newVO);
                        if (errorMsg) {
                            //comme il a eut une erreur on abandonne la création
                            self.creating_vo = false;
                            reject({
                                body: self.label(errorMsg),
                                config: {
                                    timeout: 10000,
                                    showProgressBar: true,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                },
                            });
                            return;
                        }
                    }

                    let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
                    if ((!res) || (!res.id)) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.create.errors.create_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    let id = res.id ? res.id : null;
                    self.newVO.id = id;
                    apiokVo.id = id;

                    let n_createdVO = await ModuleDAO.getInstance().getVoById<any>(self.crud.readDatatable.API_TYPE_ID, id);
                    createdVO = n_createdVO ? n_createdVO : apiokVo;
                    /**
                     * A SUIVRE en prod suivant les projets
                     *  mais a priori si on a un res.id mais qu'on peut pas recharger le vo directement, c'est qu'on a pas le droit peut-etre
                     *  par ce qu'il est pas complet. donc on le rempli quand même
                     */

                    if (n_createdVO && ((n_createdVO.id !== id) || (n_createdVO._type !== self.crud.readDatatable.API_TYPE_ID))) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.create.errors.create_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
                    await CRUDFormServices.getInstance().updateManyToMany(self.newVO, self.crud.createDatatable, createdVO, self.removeData, self.storeData, self);
                    await CRUDFormServices.getInstance().updateOneToMany(self.newVO, self.crud.createDatatable, createdVO, self.getStoredDatas, self.updateData);

                    if (self.crud.postCreate) {
                        await self.crud.postCreate(self.newVO);
                    }

                    self.storeData(createdVO);
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    self.creating_vo = false;
                    reject({
                        body: self.label('crud.create.errors.create_failure') + ": " + error,
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                self.creating_vo = false;

                self.$emit(createdVO._type + '_create', createdVO);
                await self.callCallbackFunctionCreate();
                if (self.crud.reset_newvo_after_each_creation) {
                    await self.prepareNewVO();
                }

                if (self.close_on_submit) {
                    self.$emit('close');
                } else {
                    self.crud.createDatatable.refresh();
                    self.crud_createDatatable_key = self.crud.createDatatable.key;
                }

                resolve({
                    body: self.label('crud.create.success'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
    }

    private onChangeVO(vo: IDistantVOBase) {
        if (this.crud_createDatatable_key != this.crud.createDatatable.key) {
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }

        if (this.crud && this.crud.isReadOnlyData) {
            this.is_only_readable = this.crud.isReadOnlyData(vo);
        } else {
            this.is_only_readable = false;
        }
    }

    private async reload_datas() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
    }

    private async callCallbackFunctionCreate(): Promise<void> {
        if (this.crud && this.crud.callback_function_create) {
            await this.crud.callback_function_create(this.newVO);
        }
    }

    get callback_route(): string {
        let callback: string = this.getCRUDLink(this.api_type_id);
        if (CRUDComponentManager.getInstance().getCallbackRoute(false)) {
            callback = CRUDComponentManager.getInstance().getCallbackRoute();
        }

        return callback;
    }

    get isModuleParamTable() {
        return VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID] ?
            VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].isModuleParamTable : false;
    }

    get has_createDatatable(): boolean {
        if (this.crud && this.crud.createDatatable && this.crud.createDatatable.fields) {
            return true;
        }

        return false;
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param vo
     * @param field
     * @param fileVo
     */
    private async uploadedFile_(vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO) {
        await CRUDFormServices.getInstance().uploadedFile(vo, field, fileVo, this.api_type_id, this.editableVO, this.updateData, this);
    }

    private async cancel() {
        this.$emit('cancel');
    }

    /*Fonctions utiles à la copie d'un widget */
    get page_to_copy_in_id(): number {

        if (!this.page_id) {
            return null;
        }

        if (this.pages.length < 2) {
            return null;
        }

        if (this.copy_to_page == null) {
            //Default case
            let pagei = 0;

            for (let i in this.pages) {
                let page = this.pages[i];
                if (page.id == this.page_id) {
                    pagei = parseInt(i);
                }
            }
            if (pagei == (this.pages.length - 1)) {
                return this.pages[0].id;
            }
            return this.pages[pagei + 1].id;
        } else {
            return this.copy_to_page.id;
        }
    }

    get pages_name_code_text(): string[] {
        let res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (let i in this.pages) {
            let page = this.pages[i];

            res.push(page.translatable_name_code_text ? page.translatable_name_code_text : null);
        }

        return res;
    }


    private find_page_by_id(find_page_id: number): DashboardPageVO {
        /* Retourne la page correspondant à l'identifiant indiqué */

        for (let i in this.pages) {
            let page = this.pages[i];
            if (page.id == find_page_id) {
                return page;
            }
        }
        console.log("Id de page introuvable !");
    }

    private async generate_i_and_weight(find_page_id: number, page_widget_to_copy: DashboardPageWidgetVO) {
        /*
        Retourne un i (identifient cellule pour griditem) existant parmis les widgets
        de la page indiquée
        */

        //Identification de la page vers laquelle copier
        let current_page: DashboardPageVO = this.find_page_by_id(find_page_id);
        let this_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_num_eq('page_id', current_page.id).select_vos<DashboardPageWidgetVO>();

        //Eviter ces i afin d'avoir des cellules qui ont un identifiant griditem différent
        let i_to_avoid: number[] = [];
        let max_weight: number = 0;
        for (let i in this_page_widgets) {
            let widget = this_page_widgets[i];
            i_to_avoid.push(widget.i);
            if (widget.weight >= max_weight) {
                max_weight = widget.weight + 1;
            }
        }

        //Attribution d'un i et d'un weight cohérent au nouveau widget
        page_widget_to_copy.i = i_to_avoid.reduce((a, b) => Math.max(a, b), -Infinity) + 1;
        page_widget_to_copy.weight = max_weight;
    }

    private async transfert_trad(page_widget_to_copy_id: number) {
        /* Permet de transférer ou copier les traductions d'un tableau (widget) vers un autre */

        let page_widget_trads: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', [
            DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget.id + '.',
            DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget.id + '.'
        ]).select_vos<TranslatableTextVO>();

        let page_widget_to_copy_trads: TranslatableTextVO[] = cloneDeep(page_widget_trads); //Copie des traductions


        for (let j in page_widget_to_copy_trads) {
            let page_widget_trad: TranslatableTextVO = page_widget_to_copy_trads[j];
            //Changement des identifiants widget de ces trads.
            let code = page_widget_trad.code_text;
            // Text
            let translations: TranslationVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<TranslationVO>(
                TranslationVO.API_TYPE_ID, 'text_id', [page_widget_trad.id]);

            delete page_widget_trad.id; //On supprime l'identifiant pour éviter les confusions

            if (code.indexOf(DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget.id) == 0) {
                page_widget_trad.code_text =
                    DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX +
                    + page_widget_to_copy_id +
                    code.substring((DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget_to_copy_id).length, code.length);
            } else if (code.indexOf(DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget.id) == 0) {
                page_widget_trad.code_text =
                    DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX +
                    + page_widget_to_copy_id +
                    code.substring((DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget_to_copy_id).length, code.length);
            }

            let insertOrDeleteQueryResulttt: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget_trad); //Ajout en base.
            page_widget_trad.id = insertOrDeleteQueryResulttt.id;

            page_widget_to_copy_trads[j] = page_widget_trad;

            //Activation de la traduction
            let menu_translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(translations[0].lang_id, page_widget_trad.id);
            if (!menu_translation) {
                menu_translation = new TranslationVO();
                menu_translation.lang_id = translations[0].lang_id;
                menu_translation.text_id = page_widget_trad.id;
                menu_translation.translated = translations[0].translated;
                let resi = await ModuleDAO.getInstance().insertOrUpdateVO(menu_translation);
                if (resi && resi.id) {
                    this.set_flat_locale_translation({
                        code_text: page_widget_trad.code_text,
                        value: translations[0].translated
                    });
                }
            }

        }

    }

    private async do_transfert_widget(copy_it: boolean = false) {
        /*Déplace un widget d'un onglet vers un autre onglet*/


        let page_widget_to_copy: DashboardPageWidgetVO = new DashboardPageWidgetVO();
        page_widget_to_copy = cloneDeep(this.page_widget);


        //Attribution d'un i et d'un poids cohérent au nouveau widget
        await this.generate_i_and_weight(this.page_to_copy_in_id, page_widget_to_copy);

        //Déplacement
        delete page_widget_to_copy.id;
        let to_which_page_id: number = this.page_to_copy_in_id;
        page_widget_to_copy.page_id = to_which_page_id;

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget_to_copy);

        let page_widget_to_copy_id: number = insertOrDeleteQueryResult['id'];

        //Transfert des traductions
        if (this.page_widget._type == 'dashboard_pwidget') {
            this.transfert_trad(page_widget_to_copy_id);
        }

        //Suppression du widget (recharge la page par la même occasion)
        if (copy_it) {

            this.$emit('reload_widgets');
        } else {
            this.$emit('suppress_widget'); //Si on refuse la suppression , le widget est tout de même copié.
        }


        //Fermeture de la modale

        this.$emit('cancel');
    }

    private async do_copy_widget() {
        /*Copie un widget d'un onglet vers un autre onglet*/

        this.do_transfert_widget(true);
    }

    private select_page_to_copy_in(page: DashboardPageVO) {
        this.copy_to_page = page;
    }

    private async suppress_widget() {
        this.$emit('supress_widget');
    }

    private async reload_widgets() {
        //On recharge les widgets
        this.$emit('reload_widgets');

    }

}