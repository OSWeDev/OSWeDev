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

        for (var key in obj) {
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
}