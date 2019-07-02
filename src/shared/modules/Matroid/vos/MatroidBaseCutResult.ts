import MatroidBase from './MatroidBase';

export default class MatroidBaseCutResult<T> {

    public constructor(
        public chopped_items: MatroidBase<T>,
        public remaining_items: MatroidBase<T>) { }
}