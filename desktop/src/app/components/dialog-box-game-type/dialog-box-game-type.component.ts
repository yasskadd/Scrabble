import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppRoutes } from '@app/models/app-routes';

@Component({
    selector: 'app-dialog-box-game-type',
    templateUrl: './dialog-box-game-type.component.html',
    styleUrls: ['./dialog-box-game-type.component.scss'],
})
export class DialogBoxGameTypeComponent implements OnInit {
    multiplayerCreateLink: string;
    multiplayerjoinLink: string;
    singleplayerLink: string;
    gameMode: string;

    constructor(@Inject(MAT_DIALOG_DATA) protected data: string) {}

    ngOnInit(): void {
        this.gameMode = this.data;
        this.multiplayerCreateLink = `/${AppRoutes.MultiGameCreationPage}/${this.data}`;
        this.multiplayerjoinLink = `/${AppRoutes.MultiJoinPage}/${this.gameMode}`;
        this.singleplayerLink = `/${AppRoutes.SoloGameCreationPage}/${this.gameMode}`;
    }
}
