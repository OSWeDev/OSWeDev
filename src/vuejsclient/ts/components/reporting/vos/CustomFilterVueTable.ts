import { Component } from 'vue';
import DataFilterOption from '../../../../../shared/modules/DataRender/vos/DataFilterOption';

export default class CustomFilterVueTable {
    public constructor(
        public name: string,
        public callback: (row: any, query: any) => boolean,
        public component: Component,
        public default_value: any = null,
        public all_values: DataFilterOption[] = null
    ) { }
}