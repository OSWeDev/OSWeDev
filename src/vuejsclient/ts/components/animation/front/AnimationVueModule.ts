import AnimationController from '../../../../../shared/modules/Animation/AnimationController';
import ModuleAnimation from '../../../../../shared/modules/Animation/ModuleAnimation';
import VueModuleBase from '../../../modules/VueModuleBase';

export default class AnimationVueModule extends VueModuleBase {
    public static getInstance(): AnimationVueModule {
        if (!AnimationVueModule.instance) {
            AnimationVueModule.instance = new AnimationVueModule();
        }

        return AnimationVueModule.instance;
    }

    private static instance: AnimationVueModule = null;

    private constructor() {
        super(ModuleAnimation.getInstance().name);
    }

    public initialize() {
        this.routes = [{
            path: '/animation',
            name: AnimationController.ROUTE_NAME_ANIMATION,
            component: () => import(/* webpackChunkName: "VueAnimationComponent" */ "./_base/animation"),
        }, {
            path: '/animation/theme/:theme_id',
            name: AnimationController.ROUTE_NAME_ANIMATION_THEME,
            component: () => import(/* webpackChunkName: "VueAnimationThemeComponent" */ "./theme/theme"),
            props: (route) => ({
                theme_id: parseInt(route.params.theme_id),
            })
        }, {
            path: '/animation/theme/:theme_id/module/:module_id',
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            component: () => import(/* webpackChunkName: "VueAnimationModuleComponent" */ "./module/module"),
            props: (route) => ({
                theme_id: parseInt(route.params.theme_id),
                module_id: parseInt(route.params.module_id),
            })
        }];
    }
}