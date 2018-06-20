# oswedev
OpenSource WeDev

## Outil de développement préféré
Visual Studio Code
### Configuration conseillée 
    * DEPRECATED : Semble ne pas convenir de lancer toutes les taches en meme temps, il faut creuser. Et pour le moment lancer les taches individuellement, et avec une visibilité (donc on commente une ligne) : Installer le plugin    yukidoi.blade-runner
    * Configurer les tâches (/.vscode/.tasks.json) pour une compilation en watch du typescript de chaque sous-partie. 
Exemple de fichier tasks.json :
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "tsc watch server",
            "type": "shell",
            "command": "tsc",
            "isBackground": true,
            "args": [
                "--watch",
                "--noEmit",
                "--project",
                "./src/server"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "never",
                "echo": false,
                "focus": false,
                "panel": "dedicated"
            },
            "problemMatcher": "$tsc-watch"
        },
        {
            "label": "tsc watch generator",
            "type": "shell",
            "command": "tsc",
            "isBackground": true,
            "args": [
                "--watch",
                "--noEmit",
                "--project",
                "./src/generator"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "never",
                "echo": false,
                "focus": false,
                "panel": "dedicated"
            },
            "problemMatcher": "$tsc-watch"
        }
    ]
}