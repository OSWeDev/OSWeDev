export default class PromiseTools {
    public querys: Array<Promise<any>>;

    /**
     * Attend le retour de toutes les promises (allSettled)
     * Si une promise retourne une erreur, on throw l'erreur
     * Sinon, on retourne le résultat de toutes les promises
     * @returns Si aucune erreur, le résultat de toutes les promises, sinon la première erreur
     */
    public async wait_all_settled(): Promise<Array<PromiseSettledResult<any>>> {
        let res: Array<PromiseSettledResult<any>> = await Promise.allSettled(this.querys);

        if (!res || !res.length) {
            throw new Error('No result');
        }

        for (let i in res) {
            let result = res[i];

            if (result.status === "rejected") {
                throw new Error(result.reason);
            }
        }

        return res;
    }
}

/**
 * Création d'une instance de PromiseTools
 * @param querys Les promises à attendre
 * @returns
 */
export const all_promises = (querys: Array<Promise<any>>): Promise<Array<PromiseSettledResult<any>>> => {
    let res = new PromiseTools();

    res.querys = querys;

    return (res.querys && (res.querys.length > 0)) ? res.wait_all_settled() : null;
};