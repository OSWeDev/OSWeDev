// Exemple d'interface générique pour un "item"
export interface ItemInterface {
    [key: string]: any;
    id: string;
    name: string;
    x: number;
    y: number;
    // Autres propriétés génériques
}
