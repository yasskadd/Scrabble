import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';

@Component({
    selector: 'app-dialog-box-abandon-game',
    templateUrl: './dialog-box-abandon-game.component.html',
    styleUrls: ['./dialog-box-abandon-game.component.scss'],
})
export class DialogBoxAbandonGameComponent {
    constructor(private router: Router) {}

    abandonGame() {
        this.router.navigate([`${AppRoutes.HomePage}`]).then();
    }
}
