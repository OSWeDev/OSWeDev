import MenuElementBase from './MenuElementBase';

export default class MenuBranch extends MenuElementBase {

    /**
     *
     * @param UID exemple : mybranchuid
     * @param title exemple : My Branch Title
     * @param priority exemple : MenuElementBase.PRIORITY_MEDIUM
     * @param fa_class exemple : fa-dashboard
     * @param menuElements exemple : []
     */
    public constructor(
        UID: string,
        priority: number,
        fa_class: string,
        public menuElements: MenuElementBase[]) {
        super(UID, priority, fa_class);
        this.type = "Branch";
    }
}