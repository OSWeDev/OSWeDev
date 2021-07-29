import IRange from '../../DataRender/interfaces/IRange';

export default class RangesCutResult<T extends IRange> {

    public constructor(
        public chopped_items: T[],
        public remaining_items: T[]) { }
}