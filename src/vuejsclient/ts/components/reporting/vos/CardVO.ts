import ColumnVO from './ColumnVO';
import ColumnDataVO from './ColumnDataVO';
import GroupColumnVO from './GroupColumnVO';
import GroupColumnDataVO from './GroupColumnDataVO';

export default class CardVO {
    public constructor(
        public name: string,
        public title: string,
        public img_type: string,
        public img_src: string,
        public activable: boolean,
        public rowsColumnsDatas: { [dateIndex: string]: GroupColumnDataVO[] },
        public columnsTotal: ColumnDataVO[],
        public columnsHeader: ColumnVO[],
        public columnsHeaderSupp: GroupColumnVO[],
        public columnsFooter: ColumnVO[],
        public message_footer: string = '',
    ) { }
}