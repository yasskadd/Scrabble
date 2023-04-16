import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { GameClientService } from '@app/services/game-client.service';
import { LetterPlacementService } from '@services/letter-placement.service';
import { first } from 'rxjs/operators';

const TIMEOUT = 3000;

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    isLoading: boolean;

    constructor(
        public gameClientService: GameClientService,
        protected letterService: LetterPlacementService,
        private router: Router,
        private ngZone: NgZone,
        private snackBar: MatSnackBar,
    ) {
        this.isLoading = true;

        // TODO : Remove this. For debugging only
        this.isLoading = false;
    }

    ngOnInit(): void {
        this.gameClientService.gameboardUpdated.pipe(first()).subscribe(() => (this.isLoading = false));
    }

    ngOnDestroy(): void {
        this.gameClientService.abandonGame();
        this.ngZone.run(() => {
            this.router.navigate([`${AppRoutes.HomePage}`]).then();
        });
        this.openSnackBar();
    }

    openSnackBar(): void {
        this.snackBar.open('Vous avez abandonné la partie', 'fermer', {
            duration: TIMEOUT,
            verticalPosition: 'top',
        });
    }
}
