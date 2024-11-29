import ModuleTableController from '../modules/DAO/ModuleTableController';
import NumRange from '../modules/DataRender/vos/NumRange';
import IDistantVOBase from '../modules/IDistantVOBase';
import IIsServerField from '../modules/IIsServerField';
import ConsoleHandler from './ConsoleHandler';
import RangeHandler from './RangeHandler';

export const field_names: <T extends IDistantVOBase>(obj?: T) => { [P in keyof T]?: P } = <T extends IDistantVOBase>(obj?: T): { [P in keyof T]?: P } => {

    return new Proxy({}, {
        get: (_, prop) => prop,
        set: () => {
            throw Error('Set not supported');
        },
    }) as {
            [P in keyof T]?: P;
        };
};

/**
 * La même chose que field_names au fond mais plus global
 * @param obj
 * @returns
 */
export const reflect: <T>(obj?: T) => { [P in keyof T]?: P } = <T>(obj?: T): { [P in keyof T]?: P } => {

    return new Proxy({}, {
        get: (_, prop) => prop,
        set: () => {
            throw Error('Set not supported');
        },
    }) as {
            [P in keyof T]?: P;
        };
};

export default class ObjectHandler {

    /**
     * On prend le contenu du message, et on applique les prototypes des objets qui ont été perdus lors du passage par le message
     * @param msg
     */
    public static reapply_prototypes<T extends unknown | unknown[]>(e: T, from_api_client: boolean = false): T {

        if (Array.isArray(e)) {
            return e.map((e) => this.reapply_prototypes(e)) as T;
        }

        if (!e) {
            return e;
        }

        if (typeof e != 'object') {
            return e;
        }

        // Pas un vo
        if (!e['_type']) {
            for (const i in e) {
                e[i] = this.reapply_prototypes(e[i]);
            }
            return e;
        }

        if (!ModuleTableController.vo_constructor_by_vo_type[e['_type']]) {
            throw new Error('No constructor for vo type ' + e['_type'] + ' in ModuleTableController.vo_constructor_by_vo_type. This comes probably from a pb in the priority of declaration of the modules, or you are loading data without activation of the corresponding module.');
        }

        /// Si from_api_client, le field is_server est forcé à FALSE quand on vient du client
        if (from_api_client && e[reflect<IIsServerField>().is_server]) {
            e[reflect<IIsServerField>().is_server] = false;
        }

        const res = Object.assign(new ModuleTableController.vo_constructor_by_vo_type[e['_type']](), e);

        for (const i in res) {
            if (res[i] && (typeof res[i] == 'object') || Array.isArray(res[i])) {
                res[i] = this.reapply_prototypes(res[i]);
            }
        }

        // Cas des matroids dont on doit forcer le is_pixel et index
        if ((res['is_pixel'] != null) && (res['is_pixel'] != e['_is_pixel'])) {
            res['is_pixel'] = e['_is_pixel'];
            res['_is_pixel'] = e['_is_pixel'];
        }

        if ((res['index'] != null) && (e['_index'] != null) && (res['index'] != e['_index'])) {
            res['index'] = e['_index'];
            res['_index'] = e['_index'];
        }

        return res;
    }

    public static try_get_json(e: any): any {
        try {
            return (e && (typeof e === 'string') && (
                (e.startsWith('{') && e.endsWith('}')) ||
                (e.startsWith('[') && e.endsWith(']'))
            )) ? JSON.parse(e) : e;
        } catch (error) {
            return e;
        }
    }

    public static try_is_json(e: any): boolean {
        try {
            return (e && (typeof e === 'string') && (
                (e.startsWith('{') && e.endsWith('}')) ||
                (e.startsWith('[') && e.endsWith(']'))
            )) ? (JSON.parse(e) ? true : false) : false;
        } catch (error) { /* empty */ }
        return false;
    }

    /**
     * Copie d'object VO. Pas opti mais fonctionnel
     */
    public static clone_vo<T extends IDistantVOBase>(vo: T): T {
        return ModuleTableController.translate_vos_from_api(ModuleTableController.translate_vos_to_api(vo));
    }

    public static clone_vos<T extends IDistantVOBase>(vos: T[]): T[] {
        const res: T[] = [];

        for (const i in vos) {
            res.push(ObjectHandler.clone_vo(vos[i]));
        }

        return res;
    }

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

        const customMerge = options.customMerge(key);

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
        const destination = new target.constructor();

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

        const sourceIsArray = Array.isArray(source);
        const targetIsArray = Array.isArray(target);
        const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

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
        const stringValue = Object.prototype.toString.call(value);

        return stringValue === '[object RegExp]'
            || stringValue === '[object Date]';
    }

    public static map_array_by_object_field_value<T>(target: T[], field: string): { [i: string]: T } {
        const res: { [i: string]: T } = {};

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
        const res: { [i: number]: T } = {};

        for (const i in a) {
            const e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public static sort_by_key<T>(target: T, sort_func = null): T {
        const result: T = {} as T;

        return Object.keys(target)
            .sort()
            .reduce((obj, key) => {
                obj[key] = target[key];

                return obj;
            },
                result
            );

    }

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ObjectHandler {
        if (!ObjectHandler.instance) {
            ObjectHandler.instance = new ObjectHandler();
        }

        return ObjectHandler.instance;
    }

    public static are_equal(a: any, b: any, ignore_fields: string[] = null): boolean {
        if (ignore_fields && ignore_fields.length) {
            const fields_filter = {};
            for (const i in ignore_fields) {
                fields_filter[ignore_fields[i]] = undefined;
            }

            a = Object.assign({}, a, fields_filter);
            b = Object.assign({}, b, fields_filter);

            return JSON.stringify(a) == JSON.stringify(b);
        }
        return JSON.stringify(a) == JSON.stringify(b);
    }

    public static sortObjectByKey(obj: {}, sort_func = null): {} {
        const keys = [];
        const sorted_obj = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        if (sort_func) {
            keys.sort(sort_func);
        } else {
            keys.sort();
        }

        for (const i in keys) {
            const key = keys[i];
            sorted_obj[key] = obj[key];
        }

        return sorted_obj;
    }

    public static arrayFromMap<T>(map: { [i: number]: T }): T[] {
        const res: T[] = [];

        for (const i in map) {
            res.push(map[i]);
        }
        return res;
    }

    public static mapByNumberFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: number]: T } {
        const res: { [i: number]: T } = {};

        for (const i in a) {
            const e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public static mapByStringFieldFromArray<T>(a: T[], map_index_field_id: string): { [i: string]: T } {
        const res: { [i: string]: T } = {};

        for (const i in a) {
            const e = a[i];
            res[e[map_index_field_id]] = e;
        }
        return res;
    }

    public static mapFromIdsArray(a: number[]): { [i: number]: boolean } {
        const res: { [i: number]: boolean } = {};

        for (const i in a) {
            res[a[i]] = true;
        }
        return res;
    }

    public static getIdsList(vos: IDistantVOBase[] | { [id: number]: IDistantVOBase }): number[] {
        const res: number[] = [];

        for (const i in vos) {
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
    public static getNumberMapIndexes(map: { [index: number]: any }): number[] {
        const res: number[] = [];

        for (const i in map) {
            try {
                res.push(parseInt(i.toString()));
            } catch (error) {
                ConsoleHandler.error(error);
            }
        }
        return res;
    }

    public static hasData(object): boolean {
        return (object != null) && (typeof object != "undefined");
    }

    /**
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public static hasAtLeastOneAttribute(object): boolean {
        for (const i in object) {
            return true;
        }

        return false;
    }


    /**
     * Returns true if the object has an attribute, even if the attribute is valued to null
     * @param object
     */
    public static hasOneAndOnlyOneAttribute(object): boolean {

        let res: boolean = false;
        for (const i in object) {

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
    public static shiftAttribute(object): any {
        for (const i in object) {
            const res = object[i];
            delete object[i];
            return res;
        }

        return null;
    }

    /**
     * Returns first attribute value and destroys it. Might not work if object[i] is an object ? since we return a ref to a let we delete right next ...
     * @param object
     */
    public static getFirstAttributeName(object): any {
        for (const i in object) {
            return i;
        }

        return null;
    }

    /**
     * Returns the path if exists in the object
     */
    public static getPathInObject(object, path: string): any {

        if ((!path) || (!object)) {
            return null;
        }

        const path_elts = path.split('.');
        let e = object;

        for (const i in path_elts) {
            const path_elt = path_elts[i];

            if (!e[path_elt]) {
                return null;
            }
            e = e[path_elt];
        }

        return e;
    }


    public static filterVosIdsByNumRange<T>(elts_by_id: { [id: number]: T }, range: NumRange): { [id: number]: T } {
        const res: { [id: number]: T } = {};

        for (const id in elts_by_id) {
            const elt = elts_by_id[id];

            if (RangeHandler.elt_intersects_range(parseInt(id.toString()), range)) {
                if (typeof elt != 'undefined') {
                    res[id] = elt;
                }
            }
        }

        return res;
    }

    public static filterVosIdsByNumRanges<T>(elts_by_id: { [id: number]: T }, ranges: NumRange[]): { [id: number]: T } {
        const res: { [id: number]: T } = {};

        for (const id in elts_by_id) {
            const elt = elts_by_id[id];

            if (RangeHandler.elt_intersects_any_range(parseInt(id.toString()), ranges)) {
                res[id] = elt;
            }
        }

        return res;
    }

    private static instance: ObjectHandler = null;

    private constructor() { }
}