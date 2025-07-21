export default interface ICRVersioningComponent {
    /**
     * Retourne vrai si le composant a un historique de versions
     */
    hasVersionHistory?(): boolean;

    /**
     * Retourne vrai si on peut revenir à la version précédente
     */
    canGoToPreviousVersion?(): boolean;

    /**
     * Retourne vrai si on peut aller à la version suivante
     */
    canGoToNextVersion?(): boolean;

    /**
     * Retourne les informations sur la version actuelle (ex: "Version 3/5")
     */
    getCurrentVersionInfo?(): string;

    /**
     * Force l'initialisation de l'historique de versions
     */
    initializeVersionHistory?(): void;

    /**
     * Sauvegarde la version actuelle dans l'historique
     */
    storeCurrentVersion?(): void;
}
