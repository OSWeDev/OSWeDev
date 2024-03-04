export default interface IIsServerField {
    /**
     * Ce champ est forcé à false à la réception des requêtes client pour bloquer l'usage de ce champs côté client
     */
    is_server: boolean;
}