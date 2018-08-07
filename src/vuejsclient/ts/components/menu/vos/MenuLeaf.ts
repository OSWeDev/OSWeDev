import MenuElementBase from './MenuElementBase';
import MenuLeafTarget from './MenuLeafTarget';

export default class MenuLeaf extends MenuElementBase {

    /**
     *
     * @param UID
     * @param translatable_title
     * @param priority
     * @param fa_class
     * @param href Dans le cadre d'un pointer, peut être renseigné dans un second temps par le système demandant le pointer (exemple des cruds)
     */
    public constructor(
        UID: string,
        priority: number,
        fa_class: string,
        public target: MenuLeafTarget = null) {
        super(UID, priority, fa_class);
        this.type = "Leaf";
    }
}