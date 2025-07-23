#!/bin/bash

# Script d'automatisation pour la génération périodique de documentation OSWeDev
# Ce script peut être exécuté via cron pour générer automatiquement la documentation

echo "🕐 $(date) - Début de génération automatique de documentation OSWeDev"

# Chemin vers le projet OSWeDev
PROJECT_DIR="$(dirname "$0")/.."
DOCS_DIR="$PROJECT_DIR/docs"
LOG_FILE="$PROJECT_DIR/docs-generator/generation.log"

# Création du répertoire de logs si nécessaire
mkdir -p "$(dirname "$LOG_FILE")"

# Fonction de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Sauvegarde de l'ancienne documentation si elle existe
if [ -d "$DOCS_DIR" ]; then
    log "📁 Sauvegarde de l'ancienne documentation"
    mv "$DOCS_DIR" "$DOCS_DIR.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Génération de la nouvelle documentation
log "🚀 Génération de la nouvelle documentation"
cd "$PROJECT_DIR/docs-generator" || exit 1

if node generate-docs.js >> "$LOG_FILE" 2>&1; then
    log "✅ Documentation générée avec succès"
    log "📁 Documentation disponible dans: $DOCS_DIR"
    
    # Nettoyage des anciennes sauvegardes (garde les 5 dernières)
    find "$PROJECT_DIR" -name "docs.backup.*" -type d | sort | head -n -5 | xargs rm -rf
    
    # Optionnel: commit et push automatique si c'est un repo git
    if [ -d "$PROJECT_DIR/.git" ]; then
        log "🔄 Commit automatique de la documentation"
        cd "$PROJECT_DIR" || exit 1
        git add docs/
        git commit -m "📚 Mise à jour automatique de la documentation - $(date '+%Y-%m-%d %H:%M:%S')" || true
        # Décommentez la ligne suivante si vous voulez un push automatique
        # git push origin main || log "⚠️ Échec du push automatique"
    fi
    
else
    log "❌ Erreur lors de la génération de documentation"
    
    # Restauration de la sauvegarde si elle existe
    LATEST_BACKUP=$(find "$PROJECT_DIR" -name "docs.backup.*" -type d | sort | tail -n 1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "🔄 Restauration de la dernière sauvegarde"
        mv "$LATEST_BACKUP" "$DOCS_DIR"
    fi
    
    exit 1
fi

log "🏁 Fin de génération automatique de documentation"