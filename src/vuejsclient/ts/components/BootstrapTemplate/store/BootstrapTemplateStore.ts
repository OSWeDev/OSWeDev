import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type BootstrapTemplateContext = ActionContext<IBootstrapTemplateState, any>;

export interface IBootstrapTemplateState {
    fa_navbarbtn_style: string;
    fa_sidebarmenu_style: string;
    fa_bottomnavbarbtn_style: string;
    fa_default_style: string;

    navbar: string;
    nav_bg: string;
    nav_btn: string;

    bottomnavbar: string;
    bottomnav_bg: string;
    bottomnav_btn: string;

    sidebar_bg: string;
    sidebar_nav_lvl1_text: string;
    sidebar_nav_lvl2_text: string;
    sidebar_nav_lvl3_text: string;
}

export default class BootstrapTemplateStore implements IStoreModule<IBootstrapTemplateState, BootstrapTemplateContext> {

    public static getInstance(): BootstrapTemplateStore {
        if (!BootstrapTemplateStore.instance) {
            BootstrapTemplateStore.instance = new BootstrapTemplateStore();
        }
        return BootstrapTemplateStore.instance;
    }

    private static instance: BootstrapTemplateStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IBootstrapTemplateState, BootstrapTemplateContext>;
    public mutations: MutationTree<IBootstrapTemplateState>;
    public actions: ActionTree<IBootstrapTemplateState, BootstrapTemplateContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "BootstrapTemplateStore";


        this.state = {
            fa_navbarbtn_style: 'fa-light',
            fa_sidebarmenu_style: 'fa-regular',
            fa_bottomnavbarbtn_style: 'fa-light',
            fa_default_style: 'fa-regular',

            navbar: 'navbar-light',
            nav_bg: 'bg-light',
            nav_btn: 'btn-primary',

            sidebar_bg: 'bg-light',
            sidebar_nav_lvl1_text: 'text-primary',
            sidebar_nav_lvl2_text: 'text-dark',
            sidebar_nav_lvl3_text: 'text-dark',

            bottomnavbar: 'navbar-dark',
            bottomnav_bg: 'bg-dark',
            bottomnav_btn: 'btn-light',
        };


        this.getters = {

            get_fa_navbarbtn_style(state: IBootstrapTemplateState): string { return state.fa_navbarbtn_style; },
            get_fa_sidebarmenu_style(state: IBootstrapTemplateState): string { return state.fa_sidebarmenu_style; },
            get_fa_bottomnavbarbtn_style(state: IBootstrapTemplateState): string { return state.fa_bottomnavbarbtn_style; },
            get_fa_default_style(state: IBootstrapTemplateState): string { return state.fa_default_style; },

            get_navbar(state: IBootstrapTemplateState): string { return state.navbar; },
            get_nav_bg(state: IBootstrapTemplateState): string { return state.nav_bg; },
            get_nav_btn(state: IBootstrapTemplateState): string { return state.nav_btn; },
            get_nav_outlinebtn(state: IBootstrapTemplateState): string { return state.nav_btn ? state.nav_btn.replace(/^btn-/, 'btn-outline-') : null; },

            get_sidebar_bg(state: IBootstrapTemplateState): string { return state.sidebar_bg; },
            get_sidebar_nav_lvl1_text(state: IBootstrapTemplateState): string { return state.sidebar_nav_lvl1_text; },
            get_sidebar_nav_lvl2_text(state: IBootstrapTemplateState): string { return state.sidebar_nav_lvl2_text; },
            get_sidebar_nav_lvl3_text(state: IBootstrapTemplateState): string { return state.sidebar_nav_lvl3_text; },

            get_bottomnavbar(state: IBootstrapTemplateState): string { return state.bottomnavbar; },
            get_bottomnav_bg(state: IBootstrapTemplateState): string { return state.bottomnav_bg; },
            get_bottomnav_btn(state: IBootstrapTemplateState): string { return state.bottomnav_btn; },
        };

        this.mutations = {

            set_fa_navbarbtn_style(state: IBootstrapTemplateState, fa_navbarbtn_style: string) { state.fa_navbarbtn_style = fa_navbarbtn_style; },
            set_fa_sidebarmenu_style(state: IBootstrapTemplateState, fa_sidebarmenu_style: string) { state.fa_sidebarmenu_style = fa_sidebarmenu_style; },
            set_fa_bottomnavbarbtn_style(state: IBootstrapTemplateState, fa_bottomnavbarbtn_style: string) { state.fa_bottomnavbarbtn_style = fa_bottomnavbarbtn_style; },
            set_fa_default_style(state: IBootstrapTemplateState, fa_default_style: string) { state.fa_default_style = fa_default_style; },

            set_navbar(state: IBootstrapTemplateState, navbar: string) { state.navbar = navbar; },
            set_nav_bg(state: IBootstrapTemplateState, nav_bg: string) { state.nav_bg = nav_bg; },
            set_nav_btn(state: IBootstrapTemplateState, nav_btn: string) { state.nav_btn = nav_btn; },

            set_sidebar_bg(state: IBootstrapTemplateState, sidebar_bg: string) { state.sidebar_bg = sidebar_bg; },
            set_sidebar_nav_lvl1_text(state: IBootstrapTemplateState, sidebar_nav_lvl1_text: string) { state.sidebar_nav_lvl1_text = sidebar_nav_lvl1_text; },
            set_sidebar_nav_lvl2_text(state: IBootstrapTemplateState, sidebar_nav_lvl2_text: string) { state.sidebar_nav_lvl2_text = sidebar_nav_lvl2_text; },
            set_sidebar_nav_lvl3_text(state: IBootstrapTemplateState, sidebar_nav_lvl3_text: string) { state.sidebar_nav_lvl3_text = sidebar_nav_lvl3_text; },

            set_bottomnavbar(state: IBootstrapTemplateState, bottomnavbar: string) { state.bottomnavbar = bottomnavbar; },
            set_bottomnav_bg(state: IBootstrapTemplateState, bottomnav_bg: string) { state.bottomnav_bg = bottomnav_bg; },
            set_bottomnav_btn(state: IBootstrapTemplateState, bottomnav_btn: string) { state.bottomnav_btn = bottomnav_btn; },

            activate_dark_mode(state: IBootstrapTemplateState, empty: any) {
                state.navbar = 'navbar-dark';
                state.nav_bg = 'bg-dark';
                state.nav_btn = 'btn-light';

                state.sidebar_bg = 'bg-dark';
                state.sidebar_nav_lvl1_text = 'text-white';
                state.sidebar_nav_lvl2_text = 'text-white-50';
                state.sidebar_nav_lvl3_text = 'text-white-50';

                state.bottomnavbar = 'navbar-dark';
                state.bottomnav_bg = 'bg-dark';
                state.bottomnav_btn = 'btn-light';
            },
            activate_light_mode(state: IBootstrapTemplateState, empty: any) {
                state.navbar = 'navbar-light';
                state.nav_bg = 'bg-light';
                state.nav_btn = 'btn-primary';

                state.sidebar_bg = 'bg-light';
                state.sidebar_nav_lvl1_text = 'text-primary';
                state.sidebar_nav_lvl2_text = 'text-dark';
                state.sidebar_nav_lvl3_text = 'text-dark';

                state.bottomnavbar = 'navbar-dark';
                state.bottomnav_bg = 'bg-dark';
                state.bottomnav_btn = 'btn-light';
            },
            activate_primary_mode(state: IBootstrapTemplateState, empty: any) {
                state.navbar = 'navbar-primary';
                state.nav_bg = 'bg-primary';
                state.nav_btn = 'btn-light';

                state.sidebar_bg = 'bg-primary';
                state.sidebar_nav_lvl1_text = 'text-white';
                state.sidebar_nav_lvl2_text = 'text-white-50';
                state.sidebar_nav_lvl3_text = 'text-white-50';

                state.bottomnavbar = 'navbar-dark';
                state.bottomnav_bg = 'bg-dark';
                state.bottomnav_btn = 'btn-light';
            },
        };



        this.actions = {
            set_fa_navbarbtn_style(context: BootstrapTemplateContext, fa_navbarbtn_style: string) { commit_set_fa_navbarbtn_style(context, fa_navbarbtn_style); },
            set_fa_sidebarmenu_style(context: BootstrapTemplateContext, fa_sidebarmenu_style: string) { commit_set_fa_sidebarmenu_style(context, fa_sidebarmenu_style); },
            set_fa_bottomnavbarbtn_style(context: BootstrapTemplateContext, fa_bottomnavbarbtn_style: string) { commit_set_fa_bottomnavbarbtn_style(context, fa_bottomnavbarbtn_style); },
            set_fa_default_style(context: BootstrapTemplateContext, fa_default_style: string) { commit_set_fa_default_style(context, fa_default_style); },

            set_navbar(context: BootstrapTemplateContext, navbar: string) { commit_set_navbar(context, navbar); },
            set_nav_bg(context: BootstrapTemplateContext, nav_bg: string) { commit_set_nav_bg(context, nav_bg); },
            set_nav_btn(context: BootstrapTemplateContext, nav_btn: string) { commit_set_nav_btn(context, nav_btn); },

            set_sidebar_bg(context: BootstrapTemplateContext, sidebar_bg: string) { commit_set_sidebar_bg(context, sidebar_bg); },
            set_sidebar_nav_lvl1_text(context: BootstrapTemplateContext, sidebar_nav_lvl1_text: string) { commit_set_sidebar_nav_lvl1_text(context, sidebar_nav_lvl1_text); },
            set_sidebar_nav_lvl2_text(context: BootstrapTemplateContext, sidebar_nav_lvl2_text: string) { commit_set_sidebar_nav_lvl2_text(context, sidebar_nav_lvl2_text); },
            set_sidebar_nav_lvl3_text(context: BootstrapTemplateContext, sidebar_nav_lvl3_text: string) { commit_set_sidebar_nav_lvl3_text(context, sidebar_nav_lvl3_text); },

            set_bottomnavbar(context: BootstrapTemplateContext, bottomnavbar: string) { commit_set_bottomnavbar(context, bottomnavbar); },
            set_bottomnav_bg(context: BootstrapTemplateContext, bottomnav_bg: string) { commit_set_bottomnav_bg(context, bottomnav_bg); },
            set_bottomnav_btn(context: BootstrapTemplateContext, bottomnav_btn: string) { commit_set_bottomnav_btn(context, bottomnav_btn); },

            activate_dark_mode(context: BootstrapTemplateContext, empty: any) { commit_activate_dark_mode(context, empty); },
            activate_light_mode(context: BootstrapTemplateContext, empty: any) { commit_activate_light_mode(context, empty); },
            activate_primary_mode(context: BootstrapTemplateContext, empty: any) { commit_activate_primary_mode(context, empty); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IBootstrapTemplateState, any>("BootstrapTemplateStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleBootstrapTemplateGetter = namespace('BootstrapTemplateStore', Getter);
export const ModuleBootstrapTemplateAction = namespace('BootstrapTemplateStore', Action);

export const commit_set_fa_navbarbtn_style = commit(BootstrapTemplateStore.getInstance().mutations.set_fa_navbarbtn_style);
export const commit_set_fa_sidebarmenu_style = commit(BootstrapTemplateStore.getInstance().mutations.set_fa_sidebarmenu_style);
export const commit_set_fa_bottomnavbarbtn_style = commit(BootstrapTemplateStore.getInstance().mutations.set_fa_bottomnavbarbtn_style);
export const commit_set_fa_default_style = commit(BootstrapTemplateStore.getInstance().mutations.set_fa_default_style);

export const commit_set_navbar = commit(BootstrapTemplateStore.getInstance().mutations.set_navbar);
export const commit_set_nav_bg = commit(BootstrapTemplateStore.getInstance().mutations.set_nav_bg);
export const commit_set_nav_btn = commit(BootstrapTemplateStore.getInstance().mutations.set_nav_btn);

export const commit_set_sidebar_bg = commit(BootstrapTemplateStore.getInstance().mutations.set_sidebar_bg);
export const commit_set_sidebar_nav_lvl1_text = commit(BootstrapTemplateStore.getInstance().mutations.set_sidebar_nav_lvl1_text);
export const commit_set_sidebar_nav_lvl2_text = commit(BootstrapTemplateStore.getInstance().mutations.set_sidebar_nav_lvl2_text);
export const commit_set_sidebar_nav_lvl3_text = commit(BootstrapTemplateStore.getInstance().mutations.set_sidebar_nav_lvl3_text);

export const commit_set_bottomnavbar = commit(BootstrapTemplateStore.getInstance().mutations.set_bottomnavbar);
export const commit_set_bottomnav_bg = commit(BootstrapTemplateStore.getInstance().mutations.set_bottomnav_bg);
export const commit_set_bottomnav_btn = commit(BootstrapTemplateStore.getInstance().mutations.set_bottomnav_btn);

export const commit_activate_dark_mode = commit(BootstrapTemplateStore.getInstance().mutations.activate_dark_mode);
export const commit_activate_light_mode = commit(BootstrapTemplateStore.getInstance().mutations.activate_light_mode);
export const commit_activate_primary_mode = commit(BootstrapTemplateStore.getInstance().mutations.activate_primary_mode);
