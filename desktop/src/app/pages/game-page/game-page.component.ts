import { Component, OnInit } from '@angular/core';
import { GameClientService } from '@app/services/game-client.service';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isLoading: boolean;

    constructor(private gameClientService: GameClientService) {
        this.isLoading = true;

        // TODO : Remove this. For debugging only
        this.isLoading = false;
        // this.gameClientService.updateGameboard();
    }

    ngOnInit(): void {
        this.gameClientService.gameboardUpdated.pipe(first()).subscribe(() => (this.isLoading = false));
    }
}
