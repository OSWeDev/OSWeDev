export default class ChartJsDataSetDescriptor {

    public constructor(
        public label: string,
        public backgroundColor: string[],
        public borderColor: string[],
        public type: string,
        public data: number[],
    ) {
        this.label = label;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.type = type;
        this.data = data;
    }
}