import IDistantVOBase from '../modules/IDistantVOBase.1';

export default class ObjectHandler {
    public static getInstance(): ObjectHandler {
        if (!ObjectHandler.instance) {
            ObjectHandler.instance = new ObjectHandler();
        }
        return ObjectHandler.instance;
    }

    private static instance: ObjectHandler = null;

    private constructor() {
    }

    public sortObjectByKey(obj: {}): {} {
        var keys = [];
        var sorted_obj = {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        keys.sort();

        for (let i in keys) {
            let key = keys[i];
            sorted_obj[key] = obj[key];
        }

        return sorted_obj;
    }

    public arrayFromMap<T>(map: {}): T[] {
        let res: T[] = [];

        for (let i in map) {
            res.push(map[i]);
        }
        return res;
    }

    public getIdsList(vos: IDistantVOBase[]): number[] {
        let res: number[] = [];

        for (let i in vos) {
            if (!vos[i]) {
                continue;
            }
            res.push(vos[i].id);
        }
        return res;
    }

    public hasData(object): boolean {
        return (object != null) && (typeof object != "undefined");
    }
}