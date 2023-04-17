import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { GameClientService } from '@app/services/game-client.service';
import { UserService } from '@app/services/user.service';
import { PlayerGameResult } from '@common/interfaces/game-history-info';
import { PlayerType } from '@common/models/player-type';

@Component({
    selector: 'app-end-game-page',
    templateUrl: './end-game-page.component.html',
    styleUrls: ['./end-game-page.component.scss'],
})
export class EndGameComponent implements OnInit {
    gameResult: PlayerGameResult;
    isWinner: boolean;
    winnerImageURL: string;
    winnerUsername: string;
    winnerScore: number;

    constructor(
        private userService: UserService,
        private gameService: GameClientService,
        private httpService: HttpHandlerService,
        private ngZone: NgZone,
        private router: Router,
    ) {}

    ngOnInit(): void {
        // Get the game result from the route state
        this.gameResult = this.gameService.gameResult;
        this.isWinner = this.userService.user._id === this.gameResult.playerId;
        this.winnerScore = this.gameResult.score;
        if (this.gameResult.playerType === PlayerType.Bot) {
            this.winnerImageURL = this.userService.botImageUrl;
            this.winnerUsername = this.gameResult.playerId;
            return;
        }
        this.httpService.getChatUserInfo(this.gameResult.playerId).then((winnerInfos) => {
            this.winnerImageURL = winnerInfos.imageUrl;
            this.winnerUsername = winnerInfos.username;
        });
    }

    protected redirectHomePage() {
        this.ngZone.run(() => {
            this.router.navigate(['/home']).then();
        });
    }
}
