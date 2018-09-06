# Modification des imports [<= 0.3.5] -> [*]

## DataImportDescriptorVO
    Suppression du champ copy_folder au profit du champ file_id
    Suppression du champ datatable_fullname au profit du champ api_type_id
    Suppression du champ post_traitement_module au profit de post_exec_module_id
    Renommage du champ import_name en import_uid

## DataImportHistoricVO
    Suppression du champ target_date  au profit de params
    Suppression du champ filepath au profit de file_id
    Ajout d'un lien vers l'initiateur de l'import : user_id

    Changement des codes de status des DataImportHistoricVO :
    INFO : IMPORTATION_STATE_UPLOADED => 0 (trigger à la création/modification du champ pour gérer le lancement du formattage)

    TODO : IMPORT_STATE_STARTED 0 => Supprimer ces historiques, pour éviter un réimport
    TODO : IMPORT_STATE_OK 1 => ModuleDataImport.IMPORTATION_STATE_POSTTREATED
    TODO : IMPORT_STATE_NODATA 5 => ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED
    TODO : IMPORT_STATE_FAILED 10 => ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION
    TODO : IMPORT_STATE_POSTTRAITMENT_FAILED 20 => ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT

## DataImportColumnVO
    Renommage de la colonne name en title
    Ajout de la colonne vo_field_name

## DataImportLogVO
    Ajout de la colonne code_text    
    Le champ log_level est devenu un enum, donc un nombre en base.
    Le champ message n'est plus not null

## NotificationVO
    Ajout du champ dao_notif_id
    Ajout du champ dao_notif_type

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