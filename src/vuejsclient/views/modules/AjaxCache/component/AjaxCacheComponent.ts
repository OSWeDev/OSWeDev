import { Component } from "vue-property-decorator";
import '../../../../../../src/vuejsclient/views/modules/AjaxCache/component/AjaxCacheComponent.scss';
import ModuleAjaxCache from "../../../../../shared/modules/AjaxCache/ModuleAjaxCache";
import VueComponentBase from "../../../../ts/components/VueComponentBase";

@Component({
    template: require('../../../../../../src/vuejsclient/views/modules/AjaxCache/component/AjaxCacheComponent.pug')
})
export default class AjaxCacheComponent extends VueComponentBase {
    public module_ajax_cache = ModuleAjaxCache.getInstance();
}