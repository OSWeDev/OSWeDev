import { Component } from 'vue-property-decorator';
import VueAppController from '../../../VueAppController';
import { ModuleBootstrapTemplateAction, ModuleBootstrapTemplateGetter } from '../BootstrapTemplate/store/BootstrapTemplateStore';
import { ModuleFeedbackAction } from '../feedback_handler/store/FeedbackStore';
import VueComponentBase from '../VueComponentBase';
import './ThemeSwitchComponent.scss';

@Component({
    template: require('./ThemeSwitchComponent.pug')
})
export default class ThemeSwitchComponent extends VueComponentBase {

    @ModuleBootstrapTemplateGetter
    private get_nav_outlinebtn: string;

    @ModuleBootstrapTemplateGetter
    private get_fa_navbarbtn_style: string;

    @ModuleBootstrapTemplateAction
    private set_fa_navbarbtn_style: (fa_navbarbtn_style: string) => void;

    @ModuleBootstrapTemplateAction
    private set_fa_sidebarmenu_style: (fa_sidebarmenu_style: string) => void;


    @ModuleBootstrapTemplateAction
    private activate_dark_mode: () => void;
    @ModuleBootstrapTemplateAction
    private activate_light_mode: () => void;
    @ModuleBootstrapTemplateAction
    private activate_primary_mode: () => void;
}