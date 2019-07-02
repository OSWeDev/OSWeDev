import IRange from '../../DataRender/interfaces/IRange';

export default class RangesCutResult<T extends IRange<any>> {

    public constructor(
        public chopped_items: T[],
        public remaining_items: T[]) { }
}