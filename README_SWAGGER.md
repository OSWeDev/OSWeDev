# SWAGGER
## OSWEDEV
Lancer la commande npm run tsoa:spec pour générer le fichier swagger.json

## APP
Dans tous les tsconfig.json, ajouter dans la section "compilerOptions" => "skipLibCheck": true
Dans le fichier package.json, ajouter "--skipLibCheck" dans "build-static-env"
Dans le fichier package.json, ajouter "tsoa:spec": "tsoa spec" dans "scripts"

## Pour générer le fichier swagger.json
Lancer la commande npm run tsoa:spec pour générer le fichier swagger.json
Dans le fichier Server.ts : 
1/ Modifier le tsconfig.json du Server pour ajouter dans la section "compilerOptions" => "resolveJsonModule": true
2/ import swaggerSpec from './swagger/swagger.json';
3/ Appeler la fonction this.setup_swagger(swaggerSpec); dans hook_configure_express()