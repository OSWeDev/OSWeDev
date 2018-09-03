import MenuLeafTarget from "./MenuLeafTarget";

export default class MenuLeafHREFTarget extends MenuLeafTarget {

    public static MenuLeafTarget_TYPE: string = "href";

    public constructor(public href: string = null) {
        super(MenuLeafHREFTarget.MenuLeafTarget_TYPE);
    }
}