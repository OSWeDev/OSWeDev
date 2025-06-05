import { ActionContext, ActionTree, GetterTree } from "vuex";
import { namespace } from 'vuex-class/lib/bindings';
import { ActionHandlerWithPayload, getStoreAccessors } from "vuex-typescript";
import RoleVO from '../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import AnimationModuleVO from '../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationThemeVO from '../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from "../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import DataFilterOptionVO from '../../../../../shared/modules/DataRender/vos/DataFilterOptionVO';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from "../../../../../shared/modules/DataRender/vos/NumSegment";
import RangeHandler from "../../../../../shared/tools/RangeHandler";
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type AnimationReportingContext = ActionContext<IAnimationReportingVueXState, any>;

export interface IAnimationReportingVueXState {
    all_anim_theme_by_ids: { [id: number]: AnimationThemeVO };
    filter_anim_theme_active_options: DataFilterOptionVO[];
    anim_theme_id_ranges: NumRange[];

    all_anim_module_by_ids: { [id: number]: AnimationModuleVO };
    filter_anim_module_active_options: DataFilterOptionVO[];
    anim_module_id_ranges: NumRange[];

    all_role_by_ids: { [id: number]: RoleVO };
    filter_role_active_options: DataFilterOptionVO[];
    role_id_ranges: NumRange[];

    all_user_by_ids: { [id: number]: UserVO };
    filter_user_active_options: DataFilterOptionVO[];
    user_id_ranges: NumRange[];

    filter_module_termine_active_option: DataFilterOptionVO;
    filter_module_valide_active_option: DataFilterOptionVO;
    percent_module_finished: number;

    all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } };
}

export default class AnimationReportingStoreModule implements IStoreModule<IAnimationReportingVueXState, AnimationReportingContext> {

    private static instance: AnimationReportingStoreModule;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IAnimationReportingVueXState, AnimationReportingContext>;
    public mutations = {
        set_all_anim_theme_by_ids: (state: IAnimationReportingVueXState, all_anim_theme_by_ids: { [id: number]: AnimationThemeVO }) => state.all_anim_theme_by_ids = all_anim_theme_by_ids,
        set_filter_anim_theme_active_options: (state: IAnimationReportingVueXState, filter_anim_theme_active_options: DataFilterOptionVO[]) => state.filter_anim_theme_active_options = filter_anim_theme_active_options,
        set_anim_theme_id_ranges: (state: IAnimationReportingVueXState) => {
            const res: NumRange[] = [];

            const theme_ids: number[] = state.filter_anim_theme_active_options ? state.filter_anim_theme_active_options.map((s) => s.id) : [];

            for (const anim_theme_id in state.all_aum_by_theme_module_user) {
                if (theme_ids.length > 0) {
                    if (theme_ids.indexOf(parseInt(anim_theme_id)) == -1) {
                        continue;
                    }
                }

                res.push(RangeHandler.create_single_elt_NumRange(parseInt(anim_theme_id), NumSegment.TYPE_INT));
            }

            state.anim_theme_id_ranges = res;
        },

        set_all_anim_module_by_ids: (state: IAnimationReportingVueXState, all_anim_module_by_ids: { [id: number]: AnimationModuleVO }) => state.all_anim_module_by_ids = all_anim_module_by_ids,
        set_filter_anim_module_active_options: (state: IAnimationReportingVueXState, filter_anim_module_active_options: DataFilterOptionVO[]) => state.filter_anim_module_active_options = filter_anim_module_active_options,
        set_anim_module_id_ranges: (state: IAnimationReportingVueXState) => {
            const res: NumRange[] = [];

            const module_ids: number[] = state.filter_anim_module_active_options ? state.filter_anim_module_active_options.map((s) => s.id) : [];

            for (const anim_theme_id in state.all_aum_by_theme_module_user) {
                for (const anim_module_id in state.all_aum_by_theme_module_user[anim_theme_id]) {
                    const module_id: number = parseInt(anim_module_id);

                    if (module_ids.length > 0) {
                        if (module_ids.indexOf(module_id) == -1) {
                            continue;
                        }
                    }

                    if (state.anim_theme_id_ranges && state.anim_theme_id_ranges.length > 0) {
                        const anim_module: AnimationModuleVO = state.all_anim_module_by_ids[module_id];

                        if (!anim_module) {
                            continue;
                        }

                        const anim_theme: AnimationThemeVO = state.all_anim_theme_by_ids[anim_module.theme_id];

                        if (!anim_theme) {
                            continue;
                        }

                        if (!RangeHandler.elt_intersects_any_range(anim_theme.id, state.anim_theme_id_ranges)) {
                            continue;
                        }
                    }

                    res.push(RangeHandler.create_single_elt_NumRange(module_id, NumSegment.TYPE_INT));
                }
            }

            state.anim_module_id_ranges = res;
        },

        set_all_role_by_ids: (state: IAnimationReportingVueXState, all_role_by_ids: { [id: number]: RoleVO }) => state.all_role_by_ids = all_role_by_ids,
        set_filter_role_active_options: (state: IAnimationReportingVueXState, filter_role_active_options: DataFilterOptionVO[]) => state.filter_role_active_options = filter_role_active_options,
        set_role_id_ranges: (state: IAnimationReportingVueXState) => {
            const res: NumRange[] = [];

            const role_ids: number[] = state.filter_role_active_options ? state.filter_role_active_options.map((s) => s.id) : [];
            const role_id_add: { [role_id: number]: boolean } = {};

            for (const anim_theme_id in state.all_aum_by_theme_module_user) {
                for (const anim_module_id in state.all_aum_by_theme_module_user[anim_theme_id]) {
                    const anim_module: AnimationModuleVO = state.all_anim_module_by_ids[anim_module_id];

                    if (!anim_module) {
                        continue;
                    }

                    if (anim_module.role_id_ranges && anim_module.role_id_ranges.length > 0) {
                        RangeHandler.foreach_ranges_sync(anim_module.role_id_ranges, (role_id: number) => {
                            if (role_id_add[role_id]) {
                                return;
                            }

                            if (role_ids.length > 0 && role_ids.indexOf(role_id) == -1) {
                                return;
                            }

                            role_id_add[role_id] = true;

                            res.push(RangeHandler.create_single_elt_NumRange(role_id, NumSegment.TYPE_INT));
                        });
                    }
                }
            }

            state.role_id_ranges = res;
        },

        set_all_user_by_ids: (state: IAnimationReportingVueXState, all_user_by_ids: { [id: number]: UserVO }) => state.all_user_by_ids = all_user_by_ids,
        set_filter_user_active_options: (state: IAnimationReportingVueXState, filter_user_active_options: DataFilterOptionVO[]) => state.filter_user_active_options = filter_user_active_options,
        set_user_id_ranges: (state: IAnimationReportingVueXState) => {
            const res: NumRange[] = [];

            const user_id_add: { [id: number]: boolean } = {};
            const user_ids: number[] = state.filter_user_active_options ? state.filter_user_active_options.map((s) => s.id) : [];

            for (const anim_theme_id in state.all_aum_by_theme_module_user) {
                for (const anim_module_id in state.all_aum_by_theme_module_user[anim_theme_id]) {
                    for (const user_id in state.all_aum_by_theme_module_user[anim_theme_id][anim_module_id]) {
                        if (user_id_add[user_id]) {
                            continue;
                        }

                        if (user_ids.length > 0) {
                            if (user_ids.indexOf(parseInt(user_id)) == -1) {
                                continue;
                            }
                        }

                        user_id_add[user_id] = true;
                        res.push(RangeHandler.create_single_elt_NumRange(parseInt(user_id), NumSegment.TYPE_INT));
                    }
                }
            }

            state.user_id_ranges = res;
        },

        set_all_aum_by_theme_module_user: (state: IAnimationReportingVueXState, all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } }) => state.all_aum_by_theme_module_user = all_aum_by_theme_module_user,

        set_filter_module_termine_active_option: (state: IAnimationReportingVueXState, filter_module_termine_active_option: DataFilterOptionVO) => state.filter_module_termine_active_option = filter_module_termine_active_option,
        set_filter_module_valide_active_option: (state: IAnimationReportingVueXState, filter_module_valide_active_option: DataFilterOptionVO) => state.filter_module_valide_active_option = filter_module_valide_active_option,

        set_percent_module_finished: (state: IAnimationReportingVueXState) => {
            let total_aum: number = 0;
            let total_finished_aum: number = 0;

            for (const anim_theme_id in state.all_aum_by_theme_module_user) {
                for (const anim_module_id in state.all_aum_by_theme_module_user[anim_theme_id]) {
                    for (const user_id in state.all_aum_by_theme_module_user[anim_theme_id][anim_module_id]) {
                        const aum: AnimationUserModuleVO = state.all_aum_by_theme_module_user[anim_theme_id][anim_module_id][user_id];

                        total_aum++;

                        if (aum.end_date) {
                            total_finished_aum++;
                        }
                    }
                }
            }

            state.percent_module_finished = total_aum ? (total_finished_aum / total_aum) : 0;
        },

        init: (state: IAnimationReportingVueXState, params: {
            all_anim_theme_by_ids: { [id: number]: AnimationThemeVO },
            all_anim_module_by_ids: { [id: number]: AnimationModuleVO },
            all_role_by_ids: { [id: number]: RoleVO },
            all_user_by_ids: { [id: number]: UserVO },
            all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } },
        }) => {
            state.all_anim_theme_by_ids = params.all_anim_theme_by_ids;
            state.all_anim_module_by_ids = params.all_anim_module_by_ids;
            state.all_role_by_ids = params.all_role_by_ids;
            state.all_user_by_ids = params.all_user_by_ids;
            state.all_aum_by_theme_module_user = params.all_aum_by_theme_module_user;
        },
    };
    public actions: ActionTree<IAnimationReportingVueXState, AnimationReportingContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "AnimationReportingVuexStore";

        this.state = {
            all_anim_theme_by_ids: {},
            filter_anim_theme_active_options: [],
            anim_theme_id_ranges: [],

            all_anim_module_by_ids: {},
            filter_anim_module_active_options: [],
            anim_module_id_ranges: [],

            all_role_by_ids: {},
            filter_role_active_options: [],
            role_id_ranges: [],

            all_user_by_ids: {},
            filter_user_active_options: [],
            user_id_ranges: [],

            filter_module_termine_active_option: null,
            filter_module_valide_active_option: null,
            percent_module_finished: 0,

            all_aum_by_theme_module_user: {},
        };

        this.getters = {
            get_all_anim_theme_by_ids: (state: IAnimationReportingVueXState) => state.all_anim_theme_by_ids,
            get_filter_anim_theme_active_options: (state: IAnimationReportingVueXState) => state.filter_anim_theme_active_options,
            get_anim_theme_id_ranges: (state: IAnimationReportingVueXState) => state.anim_theme_id_ranges,

            get_all_anim_module_by_ids: (state: IAnimationReportingVueXState) => state.all_anim_module_by_ids,
            get_filter_anim_module_active_options: (state: IAnimationReportingVueXState) => state.filter_anim_module_active_options,
            get_anim_module_id_ranges: (state: IAnimationReportingVueXState) => state.anim_module_id_ranges,

            get_all_role_by_ids: (state: IAnimationReportingVueXState) => state.all_role_by_ids,
            get_filter_role_active_options: (state: IAnimationReportingVueXState) => state.filter_role_active_options,
            get_role_id_ranges: (state: IAnimationReportingVueXState) => state.role_id_ranges,

            get_all_user_by_ids: (state: IAnimationReportingVueXState) => state.all_user_by_ids,
            get_filter_user_active_options: (state: IAnimationReportingVueXState) => state.filter_user_active_options,
            get_user_id_ranges: (state: IAnimationReportingVueXState) => state.user_id_ranges,

            get_filter_module_termine_active_option: (state: IAnimationReportingVueXState) => state.filter_module_termine_active_option,
            get_filter_module_valide_active_option: (state: IAnimationReportingVueXState) => state.filter_module_valide_active_option,

            get_percent_module_finished: (state: IAnimationReportingVueXState) => state.percent_module_finished,

            get_all_aum_by_theme_module_user: (state: IAnimationReportingVueXState) => state.all_aum_by_theme_module_user,
        };

        this.actions = {
            set_all_anim_theme_by_ids: (context: AnimationReportingContext, all_anim_theme_by_ids: { [id: number]: AnimationThemeVO }) => context.commit(store_mutations_names(this).set_all_anim_theme_by_ids, all_anim_theme_by_ids),
            set_filter_anim_theme_active_options: (context: AnimationReportingContext, filter_anim_theme_active_options: DataFilterOptionVO[]) => context.commit(store_mutations_names(this).set_filter_anim_theme_active_options, filter_anim_theme_active_options),
            set_anim_theme_id_ranges: (context: AnimationReportingContext) => context.commit(store_mutations_names(this).set_anim_theme_id_ranges, null),

            set_all_anim_module_by_ids: (context: AnimationReportingContext, all_anim_module_by_ids: { [id: number]: AnimationModuleVO }) => context.commit(store_mutations_names(this).set_all_anim_module_by_ids, all_anim_module_by_ids),
            set_filter_anim_module_active_options: (context: AnimationReportingContext, filter_anim_module_active_options: DataFilterOptionVO[]) => context.commit(store_mutations_names(this).set_filter_anim_module_active_options, filter_anim_module_active_options),
            set_anim_module_id_ranges: (context: AnimationReportingContext) => context.commit(store_mutations_names(this).set_anim_module_id_ranges, null),

            set_all_role_by_ids: (context: AnimationReportingContext, all_role_by_ids: { [id: number]: RoleVO }) => context.commit(store_mutations_names(this).set_all_role_by_ids, all_role_by_ids),
            set_filter_role_active_options: (context: AnimationReportingContext, filter_role_active_options: DataFilterOptionVO[]) => context.commit(store_mutations_names(this).set_filter_role_active_options, filter_role_active_options),
            set_role_id_ranges: (context: AnimationReportingContext) => context.commit(store_mutations_names(this).set_role_id_ranges, null),

            set_all_user_by_ids: (context: AnimationReportingContext, all_user_by_ids: { [id: number]: UserVO }) => context.commit(store_mutations_names(this).set_all_user_by_ids, all_user_by_ids),
            set_filter_user_active_options: (context: AnimationReportingContext, filter_user_active_options: DataFilterOptionVO[]) => context.commit(store_mutations_names(this).set_filter_user_active_options, filter_user_active_options),
            set_user_id_ranges: (context: AnimationReportingContext) => context.commit(store_mutations_names(this).set_user_id_ranges, null),

            set_all_aum_by_theme_module_user: async (context: AnimationReportingContext, all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } }) => {
                context.commit(store_mutations_names(this).set_all_aum_by_theme_module_user, all_aum_by_theme_module_user);
                await set_all_datas_for_filter(context, null);
            },

            set_all_datas_for_filter: (context: AnimationReportingContext) => {
                context.commit(store_mutations_names(this).set_anim_theme_id_ranges, null);
                context.commit(store_mutations_names(this).set_anim_module_id_ranges, null);
                context.commit(store_mutations_names(this).set_role_id_ranges, null);
                context.commit(store_mutations_names(this).set_user_id_ranges, null);
                context.commit(store_mutations_names(this).set_percent_module_finished, null);
            },

            set_filter_module_termine_active_option: (context: AnimationReportingContext, filter_module_termine_active_option: DataFilterOptionVO) => context.commit(store_mutations_names(this).set_filter_module_termine_active_option, filter_module_termine_active_option),
            set_filter_module_valide_active_option: (context: AnimationReportingContext, filter_module_valide_active_option: DataFilterOptionVO) => context.commit(store_mutations_names(this).set_filter_module_valide_active_option, filter_module_valide_active_option),

            set_percent_module_finished: (context: AnimationReportingContext) => context.commit(store_mutations_names(this).set_percent_module_finished, null),

            init: async (context: AnimationReportingContext, params: {
                all_anim_theme_by_ids: { [id: number]: AnimationThemeVO },
                all_anim_module_by_ids: { [id: number]: AnimationModuleVO },
                all_role_by_ids: { [id: number]: RoleVO },
                all_user_by_ids: { [id: number]: UserVO },
                all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } },
            }) => {
                context.commit(store_mutations_names(this).init, params);

                await set_all_datas_for_filter(context, null);
            },
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): AnimationReportingStoreModule {
        if (!AnimationReportingStoreModule.instance) {
            AnimationReportingStoreModule.instance = new AnimationReportingStoreModule();
        }
        return AnimationReportingStoreModule.instance;
    }
}

export const AnimationReportingVuexStore = AnimationReportingStoreModule.getInstance();

const { commit, read, dispatch } = getStoreAccessors<IAnimationReportingVueXState, any>("AnimationReportingVuexStore");

const __namespace = namespace('AnimationReportingVuexStore');
export const ModuleAnimationReportingVuexGetter = __namespace.Getter;
export const ModuleAnimationReportingVuexAction = __namespace.Action;

export const set_all_datas_for_filter = dispatch(AnimationReportingVuexStore.actions.set_all_datas_for_filter as ActionHandlerWithPayload<IAnimationReportingVueXState, any, any, {}>);