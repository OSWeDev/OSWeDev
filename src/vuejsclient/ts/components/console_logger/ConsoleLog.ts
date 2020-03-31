import { Moment } from 'moment';

export default class ConsoleLog {

    public constructor(
        public type: string,
        public datetime: Moment,
        public value: any) { }
}