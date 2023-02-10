
# Cas d'utilisation

## Clavardage
@startuml

title "Cas d'utilisation pour le clavardage"

left to right direction

actor Utilisateur as user

rectangle "Polyscrabble clavardage" {
    usecase "Envoyer un message" as UC1
    usecase "Rejoindre une salle de clavardage" as UC2
    usecase "Quitter une salle de clavardage" as UC3
    usecase "Joindre plusieurs salles\ndifférentes en même temps" as UC11
    usecase "Consulter l'historique d'une\nsalle de clavardage" as UC4
    usecase "Créer une salle de clavardage" as UC6
    usecase "Supprimer une salle de clavardage" as UC7
    usecase "Consulter la liste de salle de clavardage" as UC8
    usecase "Filtrer la liste de salle de clavardage" as UC9

    package "Client lourd" {
        usecase "Ouvrir une salle de clavardage\ndans une fenêtre séparée" as UC5

        usecase "Alterner une salle de clavardage\nentre le mode fenêtré et mode intégré" as UC10
    }
}

user --> UC1
user --> UC2
user --> UC3
user --> UC4
user --> UC5
user --> UC6
user --> UC7
user --> UC8
user --> UC9
user --> UC10
user --> UC11

@enduml

# Vue de déploiement
@startuml
title "Vue de déploiement"
left to right direction
skinparam linetype polyline
skinparam noteTextAlignment center

node serveur as "<<Appareil>>\nServeur (AWS)\n{OS=Linux}" {
    component serveur_express as "<<Serveur Web>>\nInterface web"
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

serveur_express "1" -0)- "1" serveur_mongoDB
serveur_express "1" -u- "0..*" client_leger : http, socketIO:3000
serveur_express "1" -- "0..*" client_lourd : http, socketIO:3000
		
@enduml

# Vue des processus
@startuml

title "Vue des processus"



@enduml