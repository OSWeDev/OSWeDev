export interface IGraphMatrix {
    [key: string]: {
        [key: string]: number
    };
}

export interface IGraphNode {
    value: string;
    isVisited: boolean;
    parent: IGraphNode | null;
}

export interface ISearchResult {
    success: boolean;
    visited: number;
    path?: any[];
}