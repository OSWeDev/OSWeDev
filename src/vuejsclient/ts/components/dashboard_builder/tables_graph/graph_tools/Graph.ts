//https://github.com/CraigHarley/SimpleGraphJS
import { range } from "lodash";
import { IGraphMatrix, IGraphNode, ISearchResult } from "./types";
import { MatrixCtor } from 'mathjs';
export class Graph {
    public matrix: IGraphMatrix = {}; //Matrix as a dictionnary type.

    public adj_matrix: MatrixCtor; //Adj matrix representing matrix :IGraphMatrix used for computations with mathjs
    public display_matrix() {
        /*
        Return the displayed matrix
        */
        return console.table(this.matrix, Object.keys(this.matrix));
    }

    public update_matrix() {
        let size: number = Object.keys(this.matrix).length;
        //TODO function which create the computable adj_matrix
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
        //update_matrix()
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
        const graph: Graph = new Graph();
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
}


