# Cas d'utilisation

## Cas d'utilisation du clavardage ------------------------------------------------------------------------------------

@startuml

left to right direction

actor Utilisateur as user

rectangle "PolyScrabble - Clavardage" {
usecase "Envoyer un message" as UC1
usecase "Rejoindre une salle de clavardage" as UC2
usecase "Quitter une salle de clavardage" as UC3
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

user -- UC1
user -- UC2
user -- UC3
user -- UC4
UC10 .> UC5 : includes
user -- UC6
user -- UC7
user -- UC8
user -- UC9
user -- UC10
UC9 .> UC8 : extends

@enduml

## Cas d'utilisation de la gestion de compte -----------------------------------------------------------------------------

@startuml

left to right direction

actor Utilisateur as user
actor Serveur as server
actor "Google reCAPTCHA Service" as recaptcha

rectangle "PolyScrabble - Gestion de compte" {
usecase "Créer un compte" as UC1
usecase "Entrer ses informations" as UC1.1
usecase "Choisir un avatar" as UC1.2
usecase "Remplir un captcha" as UC1.3
usecase "Se connecter à un compte" as UC2
usecase "Modifier le psoeudonyme\nou l'avatar du compte" as UC3
usecase "Modifier le mot de passe\ndu compte" as UC7
usecase "Consulter les statistiques\ndu compte" as UC4
usecase "Consulter l'historique d'activité\ndu compte" as UC5
usecase "Réinitialiser un mot de passe oublié" as UC6
usecase "Envoyer un courriel de récupération" as UC6.1
usecase "Se déconnecter du compte" as UC8
usecase "Déconnecter tous les instances\nd'un utilisateur" as UC9

    note top of UC1.1 : Courriel, psoeudonyme\net mot de passe

    note "Tous ces cas d'utilisation necessite\nd'être connecté à un compte*" as Note2

}

user -- UC1
UC1 ..> UC1.1 : includes
UC1 ..> UC1.2 : includes
UC1 ..> UC1.3 : includes
UC1.3 -- recaptcha

UC3 .. Note2
UC4 .. Note2
UC7 .. Note2
UC5 .. Note2
UC8 .. Note2

user - UC2
user -- UC3
user -- UC4
user -- UC5
user -- UC6
UC6 ..> UC6.1 : includes
UC6 .> UC7 : includes
user -- UC7
UC7 ..> UC9 : includes
user -- UC8

UC1 -- server
UC2 -- server
UC3 -- server
UC6.1 -- server
UC9 -- server

@enduml

## Cas d'utilisation du choix d'un avatar ------------------------------------------------------------------------

@startuml

left to right direction

actor Utilisateur as user
actor Serveur as server

rectangle "PolyScrabble - Salle de jeu" {
usecase "Se connecter à son compte utilisateur" as UC1
usecase "Créer un compte utilisateur" as UC2
usecase "Choisir un avatar" as UC3
usecase "Choisir d'une liste d'images" as UC4
usecase "Téléverser une image " as UC5
usecase "Modifier son avatar" as UC6
}

user -- UC1
user -- UC2
user -- UC3
user -- UC6

server -- UC1
server -- UC2
server -- UC4
server -- UC5
server -- UC6

UC3 ..> UC4 : includes
UC3 ..> UC5 : includes

@enduml

## Cas d'utilisation des modes de jeu ------------------------------------------------------------------------

@startuml

left to right direction

actor Utilisateur as user
actor Serveur as server

rectangle "PolyScrabble - Partie de jeu" {
usecase "Rejoindre une partie" as UC1
usecase "Créer une partie" as UC2
usecase "Rejoindre la salle de\nclavardage d'une partie" as UC9
usecase "Ajouter un joueur virtuel\ndans une partie" as UC5
usecase "Choisir un mode de jeu" as UC3
usecase "Consulter la liste des\njoueurs dans une partie" as UC4
usecase "Démarrer une partie" as UC6
usecase "Quitter une partie" as UC7
usecase "Abandonner une partie" as UC8

}

user -- UC1
user -- UC2
UC1 ..> UC3 : includes
UC2 ..> UC3 : includes
UC9 .> UC1 : entends
UC9 .> UC2 : extends

user -- UC4
user -- UC5
user -- UC6
user -- UC7
user -- UC8
user -- UC9
UC8 .> UC5 : includes
UC7 .u.> UC8 : includes

UC

@enduml

## VUE DEPLOIEMENT ------------------------------------------------------------------------------------------

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

serveur*express "1" -0)- "1" serveur_mongoDB
serveur_express "1" -u- "0..*" client*leger : http, socketIO:3000
serveur_express "1" -- "0..*" client_lourd : http, socketIO:3000
@enduml

# Vue des processus

@startuml

title "Vue des processus"

@enduml
