# Vue de déploiement
@startuml
title "Vue de déploiement"
left to right direction
skinparam linetype polyline
skinparam noteTextAlignment center

node serveur as "<<Appareil>>\nServeur (AWS)\n{OS=Linux}" {
    component serveur_express as "<<Serveur Web>>\nInterface web"
    component serveur_postgres as "<<Base de données>>\nBase de donnée des comptes\n{Vendeur=Postgres}"
}

node mongoDB as "<<Appareil>>\nServeur MongoDB\n{OS=Linux}" {
    component serveur_mongoDB as "<<Base de données>>\nBase de donnée des scores\n{Vendeur=MongoDB}"
}

together {
    node tablet_android as "<<Appareil>>\n Tablette\n{OS=Android}" {
        component client_leger as "<<Application Flutter>>\nClient Léger\nPolyScrabble"
    }
    
    node PC as "<<Appareil>>\n Ordinateur personnel\n{OS=Windows, MacOS, Linux}"{
        component client_lourd as "<<Application Tauri>>\nClient Lourd\nPolyScrabble"
    }
}

serveur_express "1" -d0)- "1" serveur_postgres
serveur_express "1" -0)- "1" serveur_mongoDB
serveur_express "1" -u- "0..*" client_leger : http, socketIO:3000
serveur_express "1" -- "0..*" client_lourd : http, socketIO:3000
		
@enduml

# Vue des processus
@startuml
title "Vue des processus"
		
@enduml