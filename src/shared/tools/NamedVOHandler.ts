import INamedVO from '../interfaces/INamedVO';

export default class NamedVOHandler {
    public static getInstance(): NamedVOHandler {
        if (!NamedVOHandler.instance) {
            NamedVOHandler.instance = new NamedVOHandler();
        }
        return NamedVOHandler.instance;
    }

    private static instance: NamedVOHandler = null;

    private constructor() {
    }

    public sortByNames(vos: INamedVO[], sort_func = null) {

        if (!vos) {
            return null;
        }

        vos.sort(sort_func ? sort_func : (a: INamedVO, b: INamedVO) => {
            if ((!a) && (!!b)) {
                return -1;
            }

            if ((!a) && (!b)) {
                return 0;
            }

            if ((!!a) && (!b)) {
                return 1;
            }

            if (a.name < b.name) {
                return -1;
            }

            if (a.name > b.name) {
                return 1;
            }

            return 0;
        });
    }

    public getNamesList(vos: INamedVO[]): string[] {
        const res: string[] = [];

        for (const i in vos) {
            if ((!vos[i]) || (!vos[i].name)) {
                continue;
            }
            res.push(vos[i].name);
        }
        return res;
    }

    public getByName<T extends INamedVO>(vos: T[] | { [id: number]: T }, name: string): T {

        if (!name) {
            return null;
        }

        for (const i in vos) {
            if (!vos[i]) {
                continue;
            }
            if (vos[i].name != name) {
                continue;
            }
            return vos[i];
        }
        return null;
    }
}