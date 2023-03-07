import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    userName: string;

    // TODO
    // 1. Prendre un JWT token avec les infos du user
    // 2. On store le token
    // 3. On utilise le token comme cookie avec chaque requette de socket
    // 4. Capturer la réponse si connexion invalide
}
