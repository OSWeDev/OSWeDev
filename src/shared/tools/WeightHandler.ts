import IWeightedItem from './interfaces/IWeightedItem';

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

    /**
     * Sorts the array given as parameter according to the weights
     * @param items array to sort
     */
    public sortByWeight(items: IWeightedItem[]) {
        items.sort((a: IWeightedItem, b: IWeightedItem) => {
            return a.weight - b.weight;
        });
    }
}