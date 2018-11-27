import DataFilterOption from '../../../../../shared/modules/DataRender/vos/DataFilterOption';

export default class FilterVO {
    public constructor(
        public name: string,
        public placeholder_select: string,
        public options: DataFilterOption[]
    ) { }
}