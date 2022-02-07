import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameConfigurationService } from '@app/services/game-configuration.service';

@Component({
    selector: 'app-multiplayer-create-page',
    templateUrl: './multiplayer-create-page.component.html',
    styleUrls: ['./multiplayer-create-page.component.scss'],
})
export class MultiplayerCreatePageComponent {
    playerName: string;
    navigator: Navigator;
    constructor(public gameConfiguration: GameConfigurationService, public router: Router) {}
    createGame() {
        // TODO : add server verification of playername
        this.gameConfiguration.gameInitialization({ username: this.playerName, timer: 1, dictionary: 'francais', mode: 'classique' });
        this.resetInput();
        this.navigatePage();
    }

    navigatePage() {
        this.router.navigate(['/classique/multijoueur/salleAttente']);
    }
    private resetInput() {
        this.playerName = '';
    }
}
