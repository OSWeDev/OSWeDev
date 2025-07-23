#!/bin/bash

# Script de configuration pour l'automatisation périodique de la documentation OSWeDev

echo "🔧 Configuration de l'automatisation de documentation OSWeDev"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_PATH="$PROJECT_DIR/docs-generator/auto-generate.sh"

echo "📁 Projet situé dans: $PROJECT_DIR"
echo "📄 Script d'automatisation: $SCRIPT_PATH"

# Vérification que le script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script d'automatisation non trouvé: $SCRIPT_PATH"
    exit 1
fi

# Rendre le script exécutable
chmod +x "$SCRIPT_PATH"

echo ""
echo "⏰ Configuration de la tâche cron périodique:"
echo ""
echo "Pour configurer l'exécution automatique, ajoutez une des lignes suivantes à votre crontab:"
echo ""
echo "# Génération quotidienne à 6h00 du matin:"
echo "0 6 * * * $SCRIPT_PATH"
echo ""
echo "# Génération hebdomadaire le dimanche à 2h00:"
echo "0 2 * * 0 $SCRIPT_PATH"
echo ""
echo "# Génération mensuelle le 1er du mois à 3h00:"
echo "0 3 1 * * $SCRIPT_PATH"
echo ""
echo "# Génération toutes les 6 heures:"
echo "0 */6 * * * $SCRIPT_PATH"
echo ""

# Proposer d'éditer le crontab
echo "🤔 Voulez-vous ouvrir l'éditeur crontab maintenant ? (y/N)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "📝 Ouverture de l'éditeur crontab..."
    crontab -e
else
    echo "✋ Configuration manuelle requise."
    echo ""
    echo "Pour configurer manuellement, exécutez:"
    echo "  crontab -e"
    echo ""
    echo "Puis ajoutez une des lignes proposées ci-dessus."
fi

echo ""
echo "🧪 Test d'exécution manuelle:"
echo "  $SCRIPT_PATH"
echo ""
echo "📋 Vérification des tâches cron actuelles:"
echo "  crontab -l"
echo ""
echo "✅ Configuration terminée!"