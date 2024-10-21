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
import { Vue } from "vue-property-decorator";
import ObjectHandler from "../../../../../../shared/tools/ObjectHandler";

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
    private counter_um_with_value: number = 0;
    private document_by_module_id: { [module_id: number]: DocumentVO } = {};
    private module_id_ranges: NumRange[] = [];
    private theme_id_ranges: NumRange[] = [];
    private ordered_modules: AnimationModuleVO[] = [];
    private prct_atteinte_seuil_theme_param: ThemeModuleDataRangesVO = null;

    private reset_module_processing: { [module_id: number]: boolean } = {};
    private reset_theme_processing: boolean = false;

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

    private async mounted() {
        this.is_ready = false;

        const promises = [];

        for (const i in this.modules) {
            this.module_id_ranges.push(RangeHandler.create_single_elt_NumRange(this.modules[i].id, NumSegment.TYPE_INT));
        }

        for (const i in this.themes) {
            this.theme_id_ranges.push(RangeHandler.create_single_elt_NumRange(this.themes[i].id, NumSegment.TYPE_INT));
        }

        for (const i in this.modules) {
            const anim_module: AnimationModuleVO = this.modules[i];

            /** récupération de prct_atteinte_seuil_module_param */
            promises.push((async () => {
                const prct_atteinte_seuil_module_param = this.get_prct_atteinte_seuil_module_param(anim_module.id);
                const theme_module_dataRange: ThemeModuleDataRangesVO = await VarsClientController.getInstance().registerParamAndWait<ThemeModuleDataRangesVO>(prct_atteinte_seuil_module_param);

                this.prct_atteinte_seuil_module[anim_module.id] = VarsController.getValueOrDefault(theme_module_dataRange, 0);
            })());
            // récupération des sessions module de l'utilisateur
            promises.push((async () => {
                let um_by_module_id_ = await ModuleAnimation.getInstance().getUserModule(this.logged_user_id, anim_module.id);
                if (!!um_by_module_id_) {
                    this.counter_um_with_value++;
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
                const res = this.prct_atteinte_seuil_module[a.id] - this.prct_atteinte_seuil_module[b.id];

                if (!res) {
                    return a.weight - b.weight;
                }

                return res;
            });
        }

        this.set_class_prct_avancement_all_module();

        this.prct_atteinte_seuil_theme_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctAtteinteSeuilAnimationController_VAR_NAME,
            true,
            [RangeHandler.create_single_elt_NumRange(this.theme.id, NumSegment.TYPE_INT)],
            this.module_id_ranges,
            [RangeHandler.create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );

        this.is_ready = true;
    }

    private go_to_route_module(anim_module: AnimationModuleVO) {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            params: {
                module_id: anim_module.id.toString(),
            }
        });
    }

    private set_class_prct_avancement_all_module() {
        if (!this.modules || !this.modules.length) {
            return;
        }

        for (let i in this.modules) {
            let anim_module: AnimationModuleVO = this.modules[i];
            this.set_class_prct_avancement_one_module(anim_module.id);
        }
    }

    private set_class_prct_avancement_one_module(module_id: number) {
        if (!module_id) {
            return;
        }

        this.class_prct_avancement_by_module[module_id] = {
            success: (this.prct_atteinte_seuil_module[module_id] == 1),
            warning: (this.prct_atteinte_seuil_module[module_id] == 0 && this.um_by_module_id[module_id] && this.um_by_module_id[module_id].end_date),
            not_start: !this.um_by_module_id[module_id],
            en_cours: (this.um_by_module_id[module_id] && !this.um_by_module_id[module_id].end_date)
        };

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
                        Vue.set(this.reset_module_processing, module.id, true);

                        this.snotify.async(this.label('animation.module.reset.async.wip'), '', () => new Promise(async (resolve, reject) => {
                            await ModuleAnimation.getInstance().resetThemesOrModules([this.logged_user_id], [], [module.id]).then((res: { res: boolean, label: string }) => {
                                if (!!res.res) {
                                    Vue.delete(this.um_by_module_id, module.id);
                                    this.counter_um_with_value--;
                                    Vue.set(this.reset_module_processing, module.id, false);
                                    Vue.set(this.prct_atteinte_seuil_module, module.id, null);
                                    this.set_class_prct_avancement_one_module(module.id);

                                    resolve({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                } else {
                                    Vue.set(this.reset_module_processing, module.id, false);
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
                                Vue.set(this.reset_module_processing, module.id, false);
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
                    }
                }
            ]
        });
    }

    private async resetTheme(theme: AnimationThemeVO) {
        if (!theme?.id || !this.logged_user_id) {
            return;
        }
        if (this.reset_theme_processing || !this.is_ready) {
            return;
        }

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
                        this.reset_theme_processing = true;

                        this.snotify.async(this.label('animation.module.reset.async.wip'), '', () => new Promise(async (resolve, reject) => {
                            /**
                             * remise à zero des modules et themes pour les utilisateurs
                             * suppression AnimationUserModuleVO (module_id|user_id)
                             * suppression AnimationUserQRVO WHERE (qr_id = QR.module_id) && (user_id in user_ids)
                             */
                            await ModuleAnimation.getInstance().resetThemesOrModules([this.logged_user_id], [theme.id], []).then((res: { res: boolean, label: string }) => {
                                if (!!res.res) {
                                    this.reset_theme_processing = false;

                                    for (let i in this.ordered_modules) {
                                        Vue.delete(this.um_by_module_id, this.ordered_modules[i].id);
                                        this.counter_um_with_value--;
                                        Vue.set(this.prct_atteinte_seuil_module, this.ordered_modules[i].id, null);
                                    }
                                    this.set_class_prct_avancement_all_module();

                                    resolve({
                                        title: '',
                                        body: this.label(res.label),
                                        config: {
                                            closeOnClick: true,
                                            timeout: 2000
                                        }
                                    });
                                } else {
                                    this.reset_theme_processing = false;

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
                                this.reset_theme_processing = false;

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

    get isThemeResetable(): boolean {
        return !!this.is_ready
            && !this.reset_theme_processing
            && this.counter_um_with_value > 0;
    }
}