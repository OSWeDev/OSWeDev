import { RouteConfig } from "vue-router/types/router";
import IModuleBase from "../../../shared/modules/IModuleBase";

export default interface IVueModule extends IModuleBase {
  routes: RouteConfig[];
}
