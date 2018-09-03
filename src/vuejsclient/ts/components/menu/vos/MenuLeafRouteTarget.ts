import MenuLeafTarget from "./MenuLeafTarget";

export default class MenuLeafRouteTarget extends MenuLeafTarget {

    public static MenuLeafTarget_TYPE: string = "route";

    public constructor(public route_name: string) {
        super(MenuLeafRouteTarget.MenuLeafTarget_TYPE);
    }
}