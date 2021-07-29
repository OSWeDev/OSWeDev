import MatroidBase from './MatroidBase';

export default class MatroidBaseCutResult {

    public constructor(
        public chopped_items: MatroidBase,
        public remaining_items: MatroidBase) { }
}