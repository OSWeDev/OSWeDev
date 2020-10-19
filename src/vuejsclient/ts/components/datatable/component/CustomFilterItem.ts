export default class CustomFilterItem {

    public constructor(
        public label: string,
        public value: any,
        public datatable_field_uid: string,
        public id: number
    ) { }
}