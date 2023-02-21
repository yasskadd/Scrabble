export enum DictionaryEvents {
    // TODO : Language
    VALID = '',
    NOT_DICTIONARY = "Le fichier téléversé n'est pas un dictionnaire. Les champs title, description ou words sont manquant.",
    FOUND = 'Le dictionnaire existe déjà dans la base de données.',
    NO_TITLE = "Le dictionnaire n'a pas de titre.",
    NO_DESCRIPTION = "Le dictionnaire n'a pas de description.",
    NO_WORDS = "Le dictionnaire n'a pas une liste de mots.",
    ADDED = 'Ajout avec succès du nouveau dictionnaire',
    UNAVAILABLE = "Le dictionnaire n'est plus disponible. Veuillez en choisir un autre",
    TITLE_TOO_LONG = 'Le titre du dictionnaire est trop long!',
    TITLE_INVALID = 'Le titre du dictionnaire contient des espaces!',
    DESCRIPTION_TOO_LONG = 'La description du dictionnaire est trop long!',
}
