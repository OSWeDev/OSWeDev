import IMatroid from '../interfaces/IMatroid';

export default class MatroidCutResult<T extends IMatroid> {

    public constructor(
        public chopped_items: T[],
        public remaining_items: T[]) { }
}