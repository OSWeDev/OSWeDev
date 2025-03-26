/**
 * SupervisionCustomColumnVO
 *  - utilisé par widget de supervision pour ajouter des colonnes custom
 */
export default class SupervisionCustomColumnVO {
    public title: string;
    public component: any;

    public static createNew(
        title: string,
        component: any,
    ): SupervisionCustomColumnVO {
        const res = new SupervisionCustomColumnVO();

        res.title = title;
        res.component = component;

        return res;
    }
}