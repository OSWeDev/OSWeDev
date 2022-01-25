== Migration ==

= NPM =
Install latest npm version :
    npm install -g npm
At least 7

= Package.json =
remove all entries from your project pakage.json that also appear in OsWedev/package.json

Make sure engines is >= 7 for npm
    "engines": {
        ...
        "npm": ">= 7"
    },

= Font Awesome PRO = 
OsWedev depends on Font Awesome PRO

'If you use Font Awesome FREE : 
'   Add 
'       fontawesome-free@next
'   package to your project's package.json

If you use Font Awesome PRO : (https://fontawesome.com/v6.0/docs/web/setup/packages)
    Add these 2 lines in the .npmrc (or create one) on base project folder (even if you have "Set Up npm Token for All Projects" => for CI)

        @fortawesome:registry=https://npm.fontawesome.com/
        //npm.fontawesome.com/:_authToken=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

    And replace the token by the one of your subscription

    Then add 
        fontawesome-pro@next
    package to your project's package.json

    And install globally the auth token for OsWedev installation (DON'T put your authtoken on a public git like OsWedev) :
        npm config set "@fortawesome:registry" https://npm.fontawesome.com/
        npm config set "//npm.fontawesome.com/:_authToken" XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

