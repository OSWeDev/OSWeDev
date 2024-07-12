export default class ArrayHandler {

    public static removeDuplicateStrings(src: string[]): string[] {
        const map_by_string: { [key: string]: boolean } = {};

        src.forEach((value) => {
            map_by_string[value] = true;
        });

        return Object.keys(map_by_string);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ArrayHandler {
        if (!ArrayHandler.instance) {
            ArrayHandler.instance = new ArrayHandler();
        }
        return ArrayHandler.instance;
    }

    /**
     * Find the intersection of many arrays
     * @param {...Array<T>} arrays
     * @returns {Array<T>}
     */
    public static find_arrays_intersect<T>(array_from: T[], by_property?: string, arrays?: T[][]): T[] {
        // TODO: make by_property working
        return [array_from, ...arrays].reduce((p, c) => p.filter((e) => c.includes(e)));
    }

    public static find_array_intersect<T>(array1: T[], array2: T[], by_property?: string): T[] {
        return array1.filter((item) => {
            return array2.find((item2) => {
                if (by_property) {
                    return item[by_property] === item2[by_property];
                } else {
                    return item === item2;
                }
            });
        });
    }

    public static add<T>(uniquesValues: T[], item: T, by_property?: string): T[] {
        const has_item = uniquesValues.find((value) => {
            if (by_property) {
                if (value[by_property] === item[by_property]) {
                    return true;
                }
            } else {
                if (value === item) {
                    return true;
                }
            }
        });

        if (has_item) {
            return uniquesValues;
        } else {
            return uniquesValues.concat(item);
        }
    }

    public static is_same(a: any[], b: any[]): boolean {
        if ((!a) && !!b) {
            return false;
        }
        if ((!b) && !!a) {
            return false;
        }

        if (a == b) {
            return true;
        }

        const c = Array.from(b);
        for (const i in a) {
            const ae = a[i];

            let foundi = null;
            for (const j in c) {
                const ce = c[j];

                if (ce == ae) {
                    foundi = j;
                    break;
                }
            }

            if (!foundi) {
                return false;
            }

            c.splice(foundi, 1);
        }

        return !c.length;
    }

    private static instance: ArrayHandler = null;

    private constructor() { }
}