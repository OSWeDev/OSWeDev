import ColumnVO from './ColumnVO';
import ColumnDataVO from './ColumnDataVO';
import GroupColumnVO from './GroupColumnVO';
import GroupColumnDataVO from './GroupColumnDataVO';

export default class CardVO {

    public static IMG_TYPE_ICON: string = "icon";
    public static IMG_TYPE_IMG: string = "img";

    public constructor(
        public name: string,
        public title: string,
        public img_type: string,
        public img_src: string,
        public activable: boolean,
        public rowsColumnsDatas: GroupColumnDataVO[],
        public columnsTotal: ColumnDataVO[],
        public columnsHeader: ColumnVO[],
        public columnsHeaderSupp: GroupColumnVO[],
        public columnsFooter: ColumnVO[],
        public message_footer: string = '',
    ) { }
}