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
            component: () => import("./_base/animation"),
        }, {
            path: '/animation/module/:module_id',
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            component: () => import("./module/module"),
            props: (route) => ({
                module_id: parseInt(route.params.module_id),
            })
        }, {
            path: '/animation/module/:module_id/feedback',
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE_FEEDBACK,
            component: () => import("./feedback/feedback"),
            props: (route) => ({
                module_id: parseInt(route.params.module_id),
            })
        }, {
            path: '/animation_reporting',
            name: AnimationController.ROUTE_NAME_ANIMATION_REPORTING,
            component: () => import("./reporting/_base/reporting"),
        }];
    }
}