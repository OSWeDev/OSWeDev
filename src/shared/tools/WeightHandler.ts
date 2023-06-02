import IWeightedItem from './interfaces/IWeightedItem';
import ObjectHandler from './ObjectHandler';

export default class WeightHandler {
    public static getInstance(): WeightHandler {
        if (!WeightHandler.instance) {
            WeightHandler.instance = new WeightHandler();
        }
        return WeightHandler.instance;
    }

    private static instance: WeightHandler = null;

    private constructor() {
    }

    public getSortedListFromWeightedVosByIds<T extends IWeightedItem>(vos_by_id: { [id: number]: T }): T[] {
        let vos_list: T[] = Object.values(vos_by_id);
        WeightHandler.getInstance().sortByWeight(vos_list);
        return vos_list;
    }

    /**
     * Sorts the array given as parameter according to the weights
     * @param items array to sort
     */
    public sortByWeight<T extends IWeightedItem>(items: T[]) {
        if (!items) {
            return null;
        }
        items.sort(this.get_sort_by_weight_cb());
    }

    public get_sort_by_weight_cb<T extends IWeightedItem>() {
        return (a: T, b: T) => {
            return a.weight - b.weight;
        };
    }

    /**
     *
     * @param sortedItemsByWeight List des éléments, classés par poids en amont
     * @param weight
     */
    public findNextHeavierItemByWeight<T extends IWeightedItem>(sortedItemsByWeight: T[], weight: number): T {
        if (sortedItemsByWeight == null || weight == null) {
            return null;
        }

        for (let i in sortedItemsByWeight) {
            if (sortedItemsByWeight[i].weight > weight) {
                return sortedItemsByWeight[i];
            }
        }

        return null;
    }
}