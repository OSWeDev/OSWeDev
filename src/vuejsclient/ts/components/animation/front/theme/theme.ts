import { cloneDeep } from "lodash";
import { Component, Prop, Watch } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import DocumentVO from "../../../../../../shared/modules/Document/vos/DocumentVO";
import VarsController from "../../../../../../shared/modules/Var/VarsController";
import VarDataBaseVO from "../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import { all_promises } from "../../../../../../shared/tools/PromiseTools";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';
import VarsClientController from "../../../Var/VarsClientController";
import VueComponentBase from '../../../VueComponentBase';
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";
import { debounce } from 'lodash';

@Component({
    template: require("./theme.pug"),
    components: {}
})
export default class VueAnimationThemeComponent extends VueComponentBase {

    @Prop()
    private theme: AnimationThemeVO;

    @Prop()
    private index_theme: number;

    @Prop()
    private modules: AnimationModuleVO[];

    @Prop()
    private themes: AnimationThemeVO[];

    @Prop()
    private logged_user_id: number;

    /** Pourcentage de modules réussis, utilisé pour la barre de progression */
    private prct_atteinte_seuil_theme: number = 0;
    /** module réussi par module */
    private prct_atteinte_seuil_module: { [module_id: number]: number } = {};
    private is_ready: boolean = false;
    /** session module de l'utilisateur */
    private um_by_module_id: { [module_id: number]: AnimationUserModuleVO } = {};
    private has_any_um: boolean = false;
    private document_by_module_id: { [module_id: number]: DocumentVO } = {};
    private module_id_ranges: NumRange[] = [];
    private theme_id_ranges: NumRange[] = [];
    private ordered_modules: AnimationModuleVO[] = [];
    private prct_atteinte_seuil_theme_param: ThemeModuleDataRangesVO = null;

    private reset_any_need_reload: boolean = false;
    private reset_module_processing: { [module_id: number]: boolean } = {};
    private reset_theme_processing: { [theme_id: number]: boolean } = {};

    private class_prct_avancement_by_module: {
        success: boolean,
        warning: boolean,
        not_start: boolean,
        en_cours: boolean
    } = {
            success: false,
            warning: false,
            not_start: false,
            en_cours: false
        };

    private debounced_reloadAsyncDatas = debounce(this.reloadAsyncDatas, 200);

    private async mounted() {
        await this.reloadAsyncDatas();
    }

    @Watch('reset_any_need_reload')
    private onchange_reset_any_need_reload() {
        if (!!this.reset_any_need_reload) {
            this.debounced_reloadAsyncDatas();
        }
    }

    private async reloadAsyncDatas() {
        this.is_ready = false;

        let promises = [];

        for (let i in this.modules) {
            this.module_id_ranges.push(RangeHandler.create_single_elt_NumRange(this.modules[i].id, NumSegment.TYPE_INT));
        }

        for (let i in this.themes) {
            this.theme_id_ranges.push(RangeHandler.create_single_elt_NumRange(this.themes[i].id, NumSegment.TYPE_INT));
        }

        for (let i in this.modules) {
            let anim_module: AnimationModuleVO = this.modules[i];

            /** récupération de prct_atteinte_seuil_module_param */
            promises.push((async () => {
                let prct_atteinte_seuil_module_param = this.get_prct_atteinte_seuil_module_param(anim_module.id);
                let theme_module_dataRange: ThemeModuleDataRangesVO = await VarsClientController.getInstance().registerParamAndWait<ThemeModuleDataRangesVO>(prct_atteinte_seuil_module_param);

                this.prct_atteinte_seuil_module[anim_module.id] = VarsController.getValueOrDefault(theme_module_dataRange, 0);
            })());
            // récupération des sessions module de l'utilisateur
            promises.push((async () => {
                let um_by_module_id_ = await ModuleAnimation.getInstance().getUserModule(this.logged_user_id, anim_module.id);
                if (!!um_by_module_id_) {
                    this.has_any_um = true;
                }
                this.um_by_module_id[anim_module.id] = um_by_module_id_;
            })());

            if (anim_module.document_id) {
                promises.push((async () => this.document_by_module_id[anim_module.id] = await query(DocumentVO.API_TYPE_ID).filter_by_id(anim_module.document_id).select_vo<DocumentVO>())());
            }
        }

        await all_promises(promises);

        // trie les mosule en fonction de l'tat d'avancement (ceux réussis en dernier)
        if (this.modules) {
            this.ordered_modules = cloneDeep(this.modules).sort((a, b) => {
                let res = this.prct_atteinte_seuil_module[a.id] - this.prct_atteinte_seuil_module[b.id];

                if (!res) {
                    return a.weight - b.weight;
                }

                return res;
            });
        }

        this.set_class_prct_avancement_module();

        this.prct_atteinte_seuil_theme_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctAtteinteSeuilAnimationController_VAR_NAME,
            true,
            [RangeHandler.create_single_elt_NumRange(this.theme.id, NumSegment.TYPE_INT)],
            this.module_id_ranges,
            [RangeHandler.create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );

        this.is_ready = true;
        this.reset_any_need_reload = false;
    }

    private go_to_route_module(anim_module: AnimationModuleVO) {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            params: {
                module_id: anim_module.id.toString(),
            }
        });
    }

    private set_class_prct_avancement_module() {
        if (!this.modules || !this.modules.length) {
            return;
        }

        for (let i in this.modules) {
            let anim_module: AnimationModuleVO = this.modules[i];
            this.class_prct_avancement_by_module[anim_module.id] = {
                success: (this.prct_atteinte_seuil_module[anim_module.id] == 1),
                warning: (this.prct_atteinte_seuil_module[anim_module.id] == 0 && this.um_by_module_id[anim_module.id] && this.um_by_module_id[anim_module.id].end_date),
                not_start: !this.um_by_module_id[anim_module.id],
                en_cours: (this.um_by_module_id[anim_module.id] && !this.um_by_module_id[anim_module.id].end_date)
            };
        }
    }

    private prct_atteinte_seuil_theme_value_callback(var_value: VarDataBaseVO, component: VarDataRefComponent): number {
        if (!component || !component.var_param.var_id) {
            return;
        }

        this.prct_atteinte_seuil_theme = var_value.value;

        return this.prct_atteinte_seuil_theme;
    }

    /**
     * @param module_id les ids des modules concernés
     * @returns Un ThemeModuleDataRangesVO, le paramètre pour le calcul du pourcentage de modules réussis.
     */
    private get_prct_atteinte_seuil_module_param(module_id: number): ThemeModuleDataRangesVO {
        return ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctAtteinteSeuilAnimationController_VAR_NAME,
            true,
            this.theme_id_ranges,
            [RangeHandler.create_single_elt_NumRange(module_id, NumSegment.TYPE_INT)],
            [RangeHandler.create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );
    }

    private async resetModule(module: AnimationModuleVO) {
        if (!module?.id || !this.logged_user_id) {
            return;
        }
        if (this.reset_module_processing[module.id] || !this.is_ready) {
            return;
        }
        this.reset_module_processing[module.id] = true;

        this.$snotify.confirm(this.label('animation.module.reset.body'), this.label('animation.module.reset.title'), {
            timeout: 10000,
            titleMaxLength: 30,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: this.t('YES'),
                    action: async (toast) => {
                        this.$snotify.remove(toast.id);

                        this.snotify.async(this.label('animation.module.reset.async.wip'), '', () => new Promise(async (resolve, reject) => {
                            await ModuleAnimation.getInstance().resetThemesOrModules([this.logged_user_id], [], [module.id]).then((res: { res: boolean, label: string }) => {
                                if (!!res.res) {
                                    this.reset_module_processing[module.id] = false;
                                    this.reset_any_need_reload = true;
                                    resolve({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                } else {
                                    this.reset_module_processing[module.id] = false;
                                    reject({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                }
                            }).catch((err) => {
                                this.reset_module_processing[module.id] = false;
                                ConsoleHandler.error(err);
                            });
                        }));
                    },
                    bold: true
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                        this.reset_module_processing[module.id] = false;
                    }
                }
            ]
        });
    }

    private async resetTheme(theme: AnimationThemeVO) {
        if (!theme?.id || !this.logged_user_id) {
            return;
        }
        if (this.reset_theme_processing[theme.id] || !this.is_ready) {
            return;
        }
        this.reset_theme_processing[theme.id] = true;

        this.$snotify.confirm(this.label('animation.theme.reset.body'), this.label('animation.theme.reset.title'), {
            timeout: 10000,
            titleMaxLength: 30,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: this.t('YES'),
                    action: async (toast) => {
                        this.$snotify.remove(toast.id);

                        this.snotify.async(this.label('animation.module.reset.async.wip'), '', () => new Promise(async (resolve, reject) => {
                            await ModuleAnimation.getInstance().resetThemesOrModules([this.logged_user_id], [theme.id], []).then((res: { res: boolean, label: string }) => {
                                if (!!res.res) {
                                    this.reset_theme_processing[theme.id] = false;
                                    this.reset_any_need_reload = true;
                                    // await this.reloadAsyncDatas(); // TODO: comment on reload les datas après un reset
                                    resolve({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                } else {
                                    this.reset_theme_processing[theme.id] = false;
                                    reject({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                }
                            }).catch((err) => {
                                this.reset_theme_processing[theme.id] = false;
                                ConsoleHandler.error(err);
                            });
                        }));
                    },
                    bold: true
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                        this.reset_theme_processing[theme.id] = false;
                    }
                }
            ]
        });
    }

    get style_barre_avancement(): any {
        return {
            width: (this.prct_atteinte_seuil_theme * 100) + '%',
        };
    }
}