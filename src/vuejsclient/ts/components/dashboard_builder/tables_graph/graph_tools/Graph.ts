//https://github.com/CraigHarley/SimpleGraphJS
import { IGraphMatrix, IGraphNode, ISearchResult } from "./types";
const math = require("mathjs");

export class GraphObj {
    public matrix: IGraphMatrix = {}; //Matrix as a dictionnary type.
    public adj_matrix; // FIXME Find the appropriate type.
    public red_linked_cells: Array<[string, string]>; //Cellules présentant plusieurs chemin de même degrés vers la cellule principale.
    public orange_linked_cells: Array<[string, string]>; //Cellules présentant plusieurs chemin de degrés différents vers la cellule principale.
    public reset() {
        /* reset the adj_matrix */
        this.matrix = {};
    }
    public display_matrix() {
        /*
        Return the displayed matrix
        */
        return console.table(this.matrix, Object.keys(this.matrix));
    }

    public addEdge(i: string, j: string): void {
        /*
        Add an edge to the current graph , it , by default , set (n,n) road to 0 in the adjacency matrix.
        */
        if (i == j) { //On ne s'occupe pas de ce cas
            return;
        }
        if (!this.matrix[i]) { //Si pas de ligne crée
            this.matrix[i] = {};
        }
        if (!this.matrix[i][j]) { //Si pas de case crée -> 1
            this.matrix[i][j] = 1;
        } else { //Si il existe déjà une route entre i et j , on incrémente de 1
            this.matrix[i][j] += 1;
        }

        if (!this.matrix[j]) { //Matrice de graphe non orientée donc symétrique
            this.matrix[j] = {};
        }
        if (!this.matrix[j][i]) {
            this.matrix[j][i] = 1;
        } else {
            this.matrix[j][i] += 1;
        }
    }

    public update_matrix(): void {
        let size: number = Object.keys(this.matrix).length;
        this.adj_matrix = math.zeros(size, size);
        for (var i = 1; i < size; i++) { //La matrice est symmetrique , Object.keys(this.matrix) définit les indices de celle-ci.
            for (var j = 0; j < i; j++) {
                let string_i: string = Object.keys(this.matrix)[i];
                let string_j: string = Object.keys(this.matrix)[j];
                if (this.matrix[string_i][string_j] !== undefined) {
                    this.adj_matrix = math.subset(this.adj_matrix, math.index(i, j), this.matrix[string_i][string_j]);
                    this.adj_matrix = math.subset(this.adj_matrix, math.index(j, i), this.matrix[string_j][string_i]);
                }
            }
        }
        //  this.check_path();
    }

    public breadthFirstSearch(i: string, j: string): ISearchResult {
        if (i === j || !this.matrix[i] || !this.matrix[j]) {
            return {
                success: i === j,
                visited: 0
            };
        }

        const queue: IGraphNode[] = [];
        const visitedNodes: string[] = [];

        this.getNeighbors(i)
            .forEach((value) =>
                queue.push({
                    value,
                    parent: null,
                    isVisited: false
                })
            );


        const isNotAlreadyVisited = (value: string) => visitedNodes.indexOf(value) === -1;

        while (true) {
            const currentNode = queue.shift();
            currentNode!.isVisited = true;


            if (currentNode!.value === j) {
                const path: IGraphNode[] = [];
                path.push(currentNode!);

                let parentNode = currentNode!.parent;
                while (parentNode) {
                    path.unshift(parentNode);
                    parentNode = parentNode.parent;
                }

                return {
                    path: path.map((node: IGraphNode) => node.value),
                    success: true,
                    visited: visitedNodes.length
                };
            }

            if (isNotAlreadyVisited(currentNode!.value)) {
                const neighbors = this.getNeighbors(currentNode!.value)
                    .filter(isNotAlreadyVisited);

                queue.unshift(
                    ...neighbors.map((value: string) => ({
                        value,
                        parent: currentNode!,
                        isVisited: false
                    })
                    )
                );
            }
            visitedNodes.push(currentNode!.value);

            if (!currentNode) {
                break;
            }
        }

        return {
            success: false,
            visited: visitedNodes.length
        };
    }

    public test() {
        const graph: GraphObj = new GraphObj();
        graph.addEdge('1', '2');
        graph.addEdge('2', '3');
        graph.addEdge('2', '4');
        graph.addEdge('4', '5');
        console.table(graph.matrix);
    }

    protected getNeighbors(i: string): string[] {
        if (this.matrix[i]) {
            return Object.keys(this.matrix[i]);
        }

        return [];
    }
    private check_path(): void {
        /*
        Affiche les trajectoires problèmatiques et celles qui le sont moins en analysant
        la matrice d'adajacence : this.adj_matrix <=> A.
        Il existe un nombre n de chemins entre deux sommets i et j si le coefficient dans A est n.
        Ainsi , si n>1 alors il y a confusion.
        Si A est porté à la puissance k , le coefficient aij correspond au nombre de chemin entre i et j constitués de k étapes.
         - Alors , si entre deux sommets i et j , il existe des chemins en k et k' | k>k', entre i et j , les chemins entre i et j seront orange.
         - Si le plus petit coefficient pour lequel il existe des chemins est >1 , les chemins reliant i et j seront rouge.
        Les chemins problèmatiques apparaîssent donc dans l'attribut linked_cells.
        */

        let size: number = Object.keys(this.matrix).length; //nombre de cellules connectée à v1
        let A = math.clone(this.adj_matrix);
        let connected_cells = math.zeros(size, size);
        for (var puissance = 1; puissance < size; i++) { //Mise a puissance de la matrice.
            if (puissance > 1) { A = math.multiply(A, this.adj_matrix); }
            for (var i = 1; i < size; i++) { //La matrice est symmetrique , Object.keys(this.matrix) définit les indices de celle-ci.
                for (var j = 0; j < i; j++) {
                    let string_i: string = Object.keys(this.matrix)[i];
                    let string_j: string = Object.keys(this.matrix)[j];
                    if (A['_data'][i][j] > 1) {
                        //red link
                        this.red_linked_cells.push([string_i, string_j]);
                    } else if (A['_data'][i][j] == 1) {
                        connected_cells['_data'][i][j] += 1;
                        if (connected_cells['_data'][i][j] > 1) {
                            //orange link
                            this.orange_linked_cells.push([string_i, string_j]);
                        }
                    } //TODO Finir cette fonction , attention a bien séparer orange du rouge + éviter de répéter la condition orangelink.
                }
            }
        }
    }
}


