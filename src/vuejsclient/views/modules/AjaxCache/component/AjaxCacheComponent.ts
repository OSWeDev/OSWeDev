import ModuleAjaxCache from "../../../../../shared/modules/AjaxCache/ModuleAjaxCache";
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import VueComponentBase from "../../../../ts/components/VueComponentBase";
import 'oswedev/vuejsclient/views/modules/AjaxCache/component/AjaxCacheComponent.scss';

@Component({
    template: require('./AjaxCacheComponent.pug')
})
export default class AjaxCacheComponent extends VueComponentBase {
    public module_ajax_cache = ModuleAjaxCache.getInstance();
}