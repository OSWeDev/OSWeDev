import NumRange from '../modules/DataRender/vos/NumRange';
import IDistantVOBase from '../modules/IDistantVOBase';
import ConsoleHandler from './ConsoleHandler';
import RangeHandler from './RangeHandler';

export default class ObjectHandler {

    public static empty_target(val) {
        return Array.isArray(val) ? [] : {};
    }

    public static clone_unless_otherwise_pecified(value, options) {
        return (options.clone !== false && options.is_mergeable_object(value))
            ? ObjectHandler.deepmerge(ObjectHandler.empty_target(value), value, options)
            : value;
    }

    public static default_array_merge(target, source, options) {
        return target.concat(source).map(function (element) {
            return ObjectHandler.clone_unless_otherwise_pecified(element, options);
        });
    }

    public static get_merge_function(key, options) {
        if (!options.customMerge) {
            return ObjectHandler.deepmerge;
        }

        let customMerge = options.customMerge(key);

        return typeof customMerge === 'function' ? customMerge : ObjectHandler.deepmerge;
    }

    public static get_enumerable_own_property_symbols(target) {
        return Object.getOwnPropertySymbols
            ? Object.getOwnPropertySymbols(target).filter((symbol) => {
                return Object.propertyIsEnumerable.call(target, symbol);
            })
            : [];
    }

    public static get_keys(target) {
        return Object.keys(target).concat(ObjectHandler.get_enumerable_own_property_symbols(target).map((symbol) => symbol.toString()));
    }

    public static property_is_on_object(object, property) {
        try {
            return property in object;
        } catch (_) {
            return false;
        }
    }

    // Protects from prototype poisoning and unexpected merging up the prototype chain.
    public static property_is_unsafe(target, key) {
        return ObjectHandler.property_is_on_object(target, key) // Properties are safe to merge if they don't exist in the target yet,
            && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
                && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
    }

    public static merge_object<T>(target, source, options): T {
        let destination = new target.constructor();

        if (options.is_mergeable_object(target)) {
            ObjectHandler.get_keys(target).forEach((key) => {
                destination[key] = ObjectHandler.clone_unless_otherwise_pecified(target[key], options);
            });
        }

        ObjectHandler.get_keys(source).forEach((key) => {
            if (ObjectHandler.property_is_unsafe(target, key)) {
                return;
            }

            if (ObjectHandler.property_is_on_object(target, key) && options.is_mergeable_object(source[key])) {
                destination[key] = ObjectHandler.get_merge_function(key, options)(target[key], source[key], options);
            } else {
                destination[key] = ObjectHandler.clone_unless_otherwise_pecified(source[key], options);
            }
        });

        return destination;
    }

    /**
     * TODO: Keep the same reference of target if possible
     *
     * @param target
     * @param source
     * @param options
     * @returns
     */
    public static deepmerge<T>(target, source, options = null): T {
        options = options || {};
        options.arrayMerge = options.arrayMerge || ObjectHandler.default_array_merge;
        options.is_mergeable_object = options.is_mergeable_object || ObjectHandler.is_mergeable_object;
        // clone_unless_otherwise_pecified is added to `options` so that custom arrayMerge()
        // implementations can use it. The caller may not replace it.
        options.clone_unless_otherwise_pecified = ObjectHandler.clone_unless_otherwise_pecified;

        let sourceIsArray = Array.isArray(source);
        let targetIsArray = Array.isArray(target);
        let sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

        if (!sourceAndTargetTypesMatch) {
            return ObjectHandler.clone_unless_otherwise_pecified(source, options);
        } else if (sourceIsArray) {
            return options.arrayMerge(target, source, options);
        } else {
            return ObjectHandler.merge_object(target, source, options);
        }
    }

    public static is_mergeable_object(value) {
        return ObjectHandler.is_non_null_object(value)
            && !ObjectHandler.is_special(value);
    }

    public static is_non_null_object(value) {
        return !!value && typeof value === 'object';
    }

    public static is_special(value) {
        let stringValue = Object.prototype.toString.call(value);

        return stringValue === '[object RegExp]'
            || stringValue === '[object Date]';
    }

    public static map_array_by_object_field_value<T>(target: T[], field: string): { [i: string]: T } {
        let res: { [i: string]: T } = {};

        for (const key in target) {
            const obj = target[key];

            if (!(typeof obj[field] == 'string')) {
                throw new Error(`ObjectHandler.map_array_by_object_field_value: field ` +
                    `${field} is not a string in ${JSON.stringify(obj)} ` +
                    `(${typeof obj[field]} givren!)`);
            }

            res[obj[field]] = obj;
        }

        return res;
    }


    public static map_by_number_field_from_array<T>(a: T[], map_index_field_id: string): { [i: number]: T } {
        let res: { [i: number]: T } = {};

        for (let i in a) {
            let e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ObjectHandler {
        if (!ObjectHandler.instance) {
            ObjectHandler.instance = new ObjectHandler();
        }
        return ObjectHandler.instance;
    }

    private static instance: ObjectHandler = null;

    private constructor() {
    }

    public are_equal(a: any, b: any): boolean {
        return JSON.stringify(a) == JSON.stringify(b);
    }

    public sortObjectByKey(obj: {}, sort_func = null): {} {
        let keys = [];
        let sorted_obj = {};

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

    public arrayFromMap<T>(map: { [i: number]: T }): T[] {
        let res: T[] = [];

        for (let i in map) {
            res.push(map[i]);
        }
        return res;
    }

    public mapByNumberFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: number]: T } {
        let res: { [i: number]: T } = {};

        for (let i in a) {
            let e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public mapByStringFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: string]: T } {
        let res: { [i: string]: T } = {};

        for (let i in a) {
            let e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public mapFromIdsArray(a: number[]): { [i: number]: boolean } {
        let res: { [i: number]: boolean } = {};

        for (let i in a) {
            res[a[i]] = true;
        }
        return res;
    }

    public getIdsList(vos: IDistantVOBase[] | { [id: number]: IDistantVOBase }): number[] {
        let res: number[] = [];

        for (let i in vos) {
            if (!vos[i]) {
                continue;
            }
            res.push(vos[i].id);
        }
        return res;
    }

    /**
     * @param map The map of type {[index:number] : any} from which we want to extract the indexes as number[]
     */
    public getNumberMapIndexes(map: { [index: number]: any }): number[] {
        let res: number[] = [];

        for (let i in map) {
            try {
                res.push(parseInt(i.toString()));
            } catch (error) {
                ConsoleHandler.error(error);
            }
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
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public hasOneAndOnlyOneAttribute(object): boolean {

        let res: boolean = false;
        for (let i in object) {

            if (!res) {
                res = true;
            } else {
                return false;
            }
        }

        return res;
    }
    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a let we delete right next ...
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

    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a let we delete right next ...
     * @param object
     */
    public getFirstAttributeName(object): any {
        for (let i in object) {
            return i;
        }

        return null;
    }

    /**
     * Returns the path if exists in the object
     */
    public getPathInObject(object, path: string): any {

        if ((!path) || (!object)) {
            return null;
        }

        let path_elts = path.split('.');
        let e = object;

        for (let i in path_elts) {
            let path_elt = path_elts[i];

            if (!e[path_elt]) {
                return null;
            }
            e = e[path_elt];
        }

        return e;
    }


    public filterVosIdsByNumRange<T>(elts_by_id: { [id: number]: T }, range: NumRange): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let id in elts_by_id) {
            let elt = elts_by_id[id];

            if (RangeHandler.elt_intersects_range(parseInt(id.toString()), range)) {
                if (typeof elt != 'undefined') {
                    res[id] = elt;
                }
            }
        }

        return res;
    }

    public filterVosIdsByNumRanges<T>(elts_by_id: { [id: number]: T }, ranges: NumRange[]): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let id in elts_by_id) {
            let elt = elts_by_id[id];

            if (RangeHandler.elt_intersects_any_range(parseInt(id.toString()), ranges)) {
                res[id] = elt;
            }
        }

        return res;
    }
}