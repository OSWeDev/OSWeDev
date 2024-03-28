export default class NiveauMaturiteStyle {
    public static get_value(value: string): NiveauMaturiteStyle[] {
        let res: NiveauMaturiteStyle[] = [];

        if (value?.length > 0) {
            res = JSON.parse(value);
        }

        if (!res) {
            return res;
        }

        for (let i in res) {
            res[i].min = res[i].min ? parseInt(res[i].min.toString()) : null;
            res[i].max = res[i].max ? parseInt(res[i].max.toString()) : null;
        }

        return res;
    }

    public min: number;
    public max: number;
    public background: string;
    public color: string;
}