import { Component } from "vue-property-decorator";
import './AjaxCacheComponent.scss';
import ModuleAjaxCache from "../../../../../shared/modules/AjaxCache/ModuleAjaxCache";
import VueComponentBase from "../../../../ts/components/VueComponentBase";

@Component({
    template: require('./AjaxCacheComponent.pug')
})
export default class AjaxCacheComponent extends VueComponentBase {
    public module_ajax_cache = ModuleAjaxCache.getInstance();
}