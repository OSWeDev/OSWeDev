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

    public sortObjectByKey(obj: {}, sort_func = null): {} {
        var keys = [];
        var sorted_obj = {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        if (!!sort_func) {
            keys.sort(sort_func);
        } else {
            keys.sort();
        }

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

    /**
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public hasAtLeastOneAttribute(object): boolean {
        for (let i in object) {
            return true;
        }

        return false;
    }

    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a var we delete right next ...
     * @param object
     */
    public shiftAttribute(object): any {
        for (let i in object) {
            let res = object[i];
            delete object[i];
            return res;
        }

        return null;
    }
}