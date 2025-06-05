import { Component } from 'vue';
import DataFilterOptionVO from '../../../../../shared/modules/DataRender/vos/DataFilterOptionVO';

export default class CustomFilterVueTable {
    public constructor(
        public name: string,
        public callback: (row: any, query: any) => boolean,
        public component: Component,
        public default_value: any = null,
        public all_values: DataFilterOptionVO[] = null
    ) { }
}