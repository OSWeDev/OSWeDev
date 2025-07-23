#!/usr/bin/env node

/**
 * Documentation Generator for OSWeDev
 * 
 * This script automatically generates documentation for crucial and important modules
 * of the OSWeDev project, focusing on key functional points in a beginner-friendly way.
 */

const fs = require('fs');
const path = require('path');

class OSWeDevDocGenerator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.modulesPath = path.join(this.projectRoot, 'src', 'shared', 'modules');
        this.outputPath = path.join(this.projectRoot, 'docs');
        
        // Define crucial modules based on functionality and dependencies
        this.crucialModules = [
            'API',
            'DAO',
            'AccessPolicy',
            'VO',
            'Translation',
            'Menu',
            'Request',
            'File',
            'Mailer',
            'DashboardBuilder',
            'DataImport',
            'DataExport',
            'Params',
            'Trigger',
            'BGThread',
            'Cron',
            'CMS',
            'Commerce',
            'Stats',
            'Supervision'
        ];
        
        // Handle special files that don't follow the directory pattern
        this.specialModules = {
            'Module': path.join(this.modulesPath, 'Module.ts'),
            'ModulesManager': path.join(this.modulesPath, 'ModulesManager.ts'),
            'VOsTypesManager': path.join(this.modulesPath, 'VOsTypesHandler.ts'),
            'VOsTypesHandler': path.join(this.modulesPath, 'VOsTypesHandler.ts')
        };
    }

    /**
     * Main documentation generation method
     */
    async generate() {
        console.log('🚀 Starting OSWeDev documentation generation...');
        
        try {
            await this.ensureOutputDirectory();
            const documentation = await this.analyzeModules();
            await this.generateMarkdownDocs(documentation);
            
            console.log('✅ Documentation generation completed successfully!');
            console.log(`📁 Documentation available at: ${this.outputPath}`);
        } catch (error) {
            console.error('❌ Error generating documentation:', error);
            process.exit(1);
        }
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDirectory() {
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    /**
     * Analyze all crucial modules and extract documentation
     */
    async analyzeModules() {
        const documentation = {
            overview: this.generateOverview(),
            modules: []
        };

        // First, handle special modules (single files)
        for (const [moduleName, filePath] of Object.entries(this.specialModules)) {
            if (fs.existsSync(filePath)) {
                console.log(`📖 Analyzing special module: ${moduleName}`);
                const moduleDoc = await this.analyzeSpecialModule(moduleName, filePath);
                if (moduleDoc) {
                    documentation.modules.push(moduleDoc);
                }
            }
        }

        // Then handle regular modules (directories)
        for (const moduleName of this.crucialModules) {
            const modulePath = path.join(this.modulesPath, moduleName);
            
            if (fs.existsSync(modulePath)) {
                console.log(`📖 Analyzing module: ${moduleName}`);
                const moduleDoc = await this.analyzeModule(moduleName, modulePath);
                if (moduleDoc) {
                    documentation.modules.push(moduleDoc);
                }
            } else {
                console.log(`⚠️  Module not found: ${moduleName}`);
            }
        }

        return documentation;
    }

    /**
     * Generate project overview
     */
    generateOverview() {
        return {
            title: 'OSWeDev - Aperçu du projet',
            description: 'OSWeDev est une solution OpenSource basée sur NodeJS, VueJS et TypeScript, conçue pour créer des applications web robustes et modulaires.',
            architecture: {
                'Backend': 'NodeJS avec TypeScript et Express',
                'Frontend': 'VueJS avec TypeScript',
                'Base de données': 'PostgreSQL',
                'Tests': 'PlayWright pour les tests end-to-end',
                'Build': 'EsBuild pour la compilation'
            },
            keyFeatures: [
                'Architecture modulaire avec 80+ modules',
                'Générateur de code automatique',
                'Système de permissions et d\'accès',
                'API REST complète',
                'Interface d\'administration',
                'Gestion des données (import/export)',
                'Système de notifications et emails',
                'Tableaux de bord personnalisables',
                'Internationalisation complète'
            ]
        };
    }

    /**
     * Analyze special module (single file)
     */
    async analyzeSpecialModule(moduleName, filePath) {
        try {
            const moduleContent = fs.readFileSync(filePath, 'utf8');
            const moduleDoc = {
                name: moduleName,
                path: filePath,
                description: this.extractModuleDescription(moduleContent, moduleName),
                functionality: this.extractFunctionality(moduleContent, moduleName),
                keyMethods: this.extractKeyMethods(moduleContent),
                dependencies: this.extractDependencies(moduleContent),
                usageExample: this.generateUsageExample(moduleName, moduleContent)
            };

            return moduleDoc;
        } catch (error) {
            console.error(`Error analyzing special module ${moduleName}:`, error);
            return null;
        }
    }
    async analyzeModule(moduleName, modulePath) {
        try {
            const moduleFiles = this.getModuleFiles(modulePath);
            const mainModuleFile = this.findMainModuleFile(moduleFiles, moduleName);
            
            if (!mainModuleFile) {
                return null;
            }

            const moduleContent = fs.readFileSync(mainModuleFile, 'utf8');
            const moduleDoc = {
                name: moduleName,
                path: modulePath,
                description: this.extractModuleDescription(moduleContent, moduleName),
                functionality: this.extractFunctionality(moduleContent, moduleName),
                keyMethods: this.extractKeyMethods(moduleContent),
                dependencies: this.extractDependencies(moduleContent),
                usageExample: this.generateUsageExample(moduleName, moduleContent)
            };

            return moduleDoc;
        } catch (error) {
            console.error(`Error analyzing module ${moduleName}:`, error);
            return null;
        }
    }

    /**
     * Get all files in a module directory
     */
    getModuleFiles(modulePath) {
        const files = [];
        
        const readDir = (dirPath) => {
            if (fs.statSync(dirPath).isDirectory()) {
                const items = fs.readdirSync(dirPath);
                items.forEach(item => {
                    const itemPath = path.join(dirPath, item);
                    if (fs.statSync(itemPath).isDirectory()) {
                        readDir(itemPath);
                    } else if (item.endsWith('.ts')) {
                        files.push(itemPath);
                    }
                });
            } else if (dirPath.endsWith('.ts')) {
                files.push(dirPath);
            }
        };

        readDir(modulePath);
        return files;
    }

    /**
     * Find the main module file
     */
    findMainModuleFile(files, moduleName) {
        // Look for Module{Name}.ts pattern first
        const modulePattern = files.find(f => 
            f.includes(`Module${moduleName}.ts`) || 
            f.endsWith(`${moduleName}.ts`) ||
            f.includes(`Module${moduleName}`)
        );
        
        if (modulePattern) return modulePattern;
        
        // If not found, take the first .ts file
        return files.find(f => f.endsWith('.ts'));
    }

    /**
     * Extract module description from comments and code
     */
    extractModuleDescription(content, moduleName) {
        const descriptions = {
            'Module': 'Classe de base pour tous les modules du système. Définit l\'interface commune et la gestion du cycle de vie des modules.',
            'ModulesManager': 'Gestionnaire central de tous les modules. Coordonne l\'enregistrement, l\'activation et la communication entre modules.',
            'API': 'Module de gestion des API REST. Fournit l\'infrastructure pour exposer les fonctionnalités via HTTP.',
            'DAO': 'Data Access Object - Couche d\'accès aux données. Gère toutes les opérations CRUD avec la base de données PostgreSQL.',
            'AccessPolicy': 'Système de gestion des permissions et de sécurité. Contrôle l\'accès aux ressources et fonctionnalités.',
            'VO': 'Value Objects - Objets de valeur représentant les entités métier du système.',
            'VOsTypesManager': 'Gestionnaire des types d\'objets de valeur. Centralise la définition et la gestion des types de données.',
            'Translation': 'Système d\'internationalisation. Gère les traductions et la localisation de l\'interface utilisateur.',
            'Menu': 'Gestion du système de navigation et des menus de l\'application.',
            'Request': 'Gestion des requêtes HTTP et de la communication client-serveur.',
            'File': 'Système de gestion des fichiers. Upload, stockage et manipulation des documents.',
            'Mailer': 'Système d\'envoi d\'emails et de notifications par courrier électronique.',
            'DashboardBuilder': 'Constructeur de tableaux de bord personnalisables et interactifs.',
            'DataImport': 'Système d\'importation de données depuis diverses sources (CSV, Excel, etc.).',
            'DataExport': 'Système d\'exportation de données vers différents formats.',
            'Params': 'Gestion centralisée des paramètres de configuration du système.',
            'Trigger': 'Système de déclencheurs et d\'événements pour l\'automatisation.',
            'BGThread': 'Gestion des tâches de fond et du traitement asynchrone.',
            'Cron': 'Planificateur de tâches périodiques et automatisées.'
        };

        return descriptions[moduleName] || 'Module système pour la gestion de fonctionnalités spécifiques.';
    }

    /**
     * Extract key functionality from module content
     */
    extractFunctionality(content, moduleName) {
        const functionalities = {
            'Module': [
                'Définition de la structure de base des modules',
                'Gestion du cycle de vie (installation, configuration, activation)',
                'Interface pour les hooks et événements du module',
                'Gestion des tables et champs de données associés'
            ],
            'ModulesManager': [
                'Enregistrement et découverte automatique des modules',
                'Gestion des dépendances entre modules',
                'Activation/désactivation dynamique des modules',
                'Cache des instances de modules'
            ],
            'API': [
                'Définition des endpoints REST',
                'Gestion de l\'authentification et autorisation',
                'Sérialisation/désérialisation JSON',
                'Gestion des erreurs et codes de retour HTTP'
            ],
            'DAO': [
                'Opérations CRUD (Create, Read, Update, Delete)',
                'Gestion des requêtes SQL complexes',
                'Cache des données et optimisations',
                'Transactions et intégrité des données',
                'Migration et évolution du schéma de base'
            ],
            'AccessPolicy': [
                'Définition des rôles et permissions',
                'Contrôle d\'accès basé sur les rôles (RBAC)',
                'Authentification des utilisateurs',
                'Sessions et gestion des tokens'
            ]
        };

        return functionalities[moduleName] || ['Fonctionnalités spécialisées du module'];
    }

    /**
     * Extract key methods from module code
     */
    extractKeyMethods(content) {
        const methods = [];
        const methodRegex = /(?:public|private|protected)?\s+(async\s+)?(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*{/g;
        let match;

        while ((match = methodRegex.exec(content)) !== null && methods.length < 10) {
            const methodName = match[2];
            if (methodName && !methodName.startsWith('constructor') && methodName.length > 2) {
                methods.push({
                    name: methodName,
                    isAsync: !!match[1],
                    description: this.generateMethodDescription(methodName)
                });
            }
        }

        return methods;
    }

    /**
     * Generate method description based on name patterns
     */
    generateMethodDescription(methodName) {
        if (methodName.includes('get') || methodName.includes('select')) {
            return 'Récupère des données depuis la base ou le cache';
        }
        if (methodName.includes('insert') || methodName.includes('create')) {
            return 'Crée de nouveaux enregistrements';
        }
        if (methodName.includes('update') || methodName.includes('modify')) {
            return 'Met à jour des données existantes';
        }
        if (methodName.includes('delete') || methodName.includes('remove')) {
            return 'Supprime des enregistrements';
        }
        if (methodName.includes('hook')) {
            return 'Point d\'extension pour personnalisation';
        }
        if (methodName.includes('configure') || methodName.includes('init')) {
            return 'Configuration et initialisation';
        }
        return 'Méthode de traitement métier';
    }

    /**
     * Extract module dependencies
     */
    extractDependencies(content) {
        const dependencies = [];
        const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"](\.\.?\/.*?)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null && dependencies.length < 10) {
            const importPath = match[1];
            if (importPath.includes('modules/')) {
                const moduleName = importPath.split('/').pop().replace(/^Module/, '').replace(/\.ts$/, '');
                if (moduleName && !dependencies.includes(moduleName)) {
                    dependencies.push(moduleName);
                }
            }
        }

        return dependencies;
    }

    /**
     * Generate usage example for the module
     */
    generateUsageExample(moduleName, content) {
        const examples = {
            'Module': `// Création d'un nouveau module
export default class MonModule extends Module {
    constructor() {
        super("mon_module", "MonModule");
    }
    
    public async hook_module_configure(): Promise<boolean> {
        // Configuration du module
        return true;
    }
}`,
            'DAO': `// Exemple d'utilisation du DAO
import ModuleDAO from '../modules/DAO/ModuleDAO';

// Récupérer des données
const users = await ModuleDAO.getVOs(UserVO.API_TYPE_ID);

// Créer un nouvel utilisateur
const newUser = new UserVO();
newUser.name = "John Doe";
await ModuleDAO.insertOrUpdateVO(newUser);`,
            'API': `// Définition d'une API
APIControllerWrapper.registerServerApiHandler({
    name: 'get_user_data',
    handler: async (req: APIServerParams) => {
        return await UserController.getUserData(req.params.user_id);
    }
});`
        };

        return examples[moduleName] || `// Exemple d'utilisation du module ${moduleName}
const ${moduleName.toLowerCase()}Instance = Module${moduleName}.getInstance();
await ${moduleName.toLowerCase()}Instance.initialize();`;
    }

    /**
     * Generate markdown documentation
     */
    async generateMarkdownDocs(documentation) {
        // Generate main documentation file
        const mainDoc = this.generateMainDocumentation(documentation);
        fs.writeFileSync(path.join(this.outputPath, 'README.md'), mainDoc);

        // Generate individual module documentation
        for (const module of documentation.modules) {
            const moduleDoc = this.generateModuleDocumentation(module);
            fs.writeFileSync(path.join(this.outputPath, `${module.name}.md`), moduleDoc);
        }

        // Generate index
        const indexDoc = this.generateIndexDocumentation(documentation);
        fs.writeFileSync(path.join(this.outputPath, 'INDEX.md'), indexDoc);
    }

    /**
     * Generate main documentation content
     */
    generateMainDocumentation(documentation) {
        const { overview } = documentation;
        
        return `# ${overview.title}

## 📋 Description

${overview.description}

## 🏗️ Architecture

${Object.entries(overview.architecture).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## ⭐ Fonctionnalités clés

${overview.keyFeatures.map(feature => `- ${feature}`).join('\n')}

## 📚 Modules cruciaux

Cette documentation couvre les **${documentation.modules.length} modules les plus importants** du système OSWeDev :

${documentation.modules.map(module => `- [${module.name}](${module.name}.md) - ${module.description}`).join('\n')}

## 🚀 Démarrage rapide

Pour commencer avec OSWeDev :

1. **Installation des dépendances**
   \`\`\`bash
   npm install
   \`\`\`

2. **Construction du projet**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Lancement des tests**
   \`\`\`bash
   npm test
   \`\`\`

## 📖 Documentation détaillée

Consultez l'[INDEX.md](INDEX.md) pour une vue d'ensemble complète de tous les modules documentés.

---

*Cette documentation est générée automatiquement. Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}*
`;
    }

    /**
     * Generate individual module documentation
     */
    generateModuleDocumentation(module) {
        return `# Module ${module.name}

## 📖 Description

${module.description}

## ⚙️ Fonctionnalités principales

${module.functionality.map(func => `- ${func}`).join('\n')}

${module.dependencies.length > 0 ? `## 🔗 Dépendances

Ce module dépend des modules suivants :
${module.dependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}

${module.keyMethods.length > 0 ? `## 🛠️ Méthodes principales

${module.keyMethods.map(method => `### ${method.name}${method.isAsync ? ' (async)' : ''}
${method.description}
`).join('\n')}
` : ''}

## 💻 Exemple d'utilisation

\`\`\`typescript
${module.usageExample}
\`\`\`

## 📍 Localisation

**Chemin :** \`${module.path.replace(this.projectRoot, '')}\`

---

*Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}*
`;
    }

    /**
     * Generate index documentation
     */
    generateIndexDocumentation(documentation) {
        return `# Index de la documentation OSWeDev

## 📚 Modules documentés

${documentation.modules.map((module, index) => `${index + 1}. **[${module.name}](${module.name}.md)**
   ${module.description}
   
   🔧 Fonctionnalités : ${module.functionality.slice(0, 2).join(', ')}${module.functionality.length > 2 ? '...' : ''}
   
   ${module.dependencies.length > 0 ? `🔗 Dépend de : ${module.dependencies.slice(0, 3).join(', ')}${module.dependencies.length > 3 ? '...' : ''}` : ''}
`).join('\n')}

## 🎯 Modules par catégorie

### 🏗️ Architecture de base
- [Module](Module.md) - Structure de base
- [ModulesManager](ModulesManager.md) - Gestionnaire de modules
- [VO](VO.md) - Objets de valeur
- [VOsTypesManager](VOsTypesManager.md) - Gestion des types

### 🌐 API et données
- [API](API.md) - Interface REST
- [DAO](DAO.md) - Accès aux données
- [Request](Request.md) - Gestion des requêtes

### 🔐 Sécurité
- [AccessPolicy](AccessPolicy.md) - Permissions et sécurité

### 🎨 Interface utilisateur
- [Menu](Menu.md) - Navigation
- [Translation](Translation.md) - Internationalisation
- [DashboardBuilder](DashboardBuilder.md) - Tableaux de bord

### 📁 Gestion des données
- [File](File.md) - Gestion de fichiers
- [DataImport](DataImport.md) - Import de données
- [DataExport](DataExport.md) - Export de données

### 🔧 Services
- [Mailer](Mailer.md) - Envoi d'emails
- [Params](Params.md) - Configuration
- [Trigger](Trigger.md) - Événements
- [BGThread](BGThread.md) - Tâches de fond
- [Cron](Cron.md) - Planification

---

*Documentation générée automatiquement le ${new Date().toLocaleString('fr-FR')}*
`;
    }
}

// Execute if run directly
if (require.main === module) {
    const generator = new OSWeDevDocGenerator();
    generator.generate();
}

module.exports = OSWeDevDocGenerator;