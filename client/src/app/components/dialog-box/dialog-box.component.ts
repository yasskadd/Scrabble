import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-box',
    templateUrl: './dialog-box.component.html',
    styleUrls: ['./dialog-box.component.scss'],
})
export class DialogBoxComponent implements OnInit {
    multiplayerCreateLink: string;
    multiplayerjoinLink: string;
    singleplayerLink: string;
    gameMode: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}
    ngOnInit(): void {
        this.gameMode = this.data;
        // this.multiplayerCreateLink = '/game';
        this.multiplayerCreateLink = `/${this.data}/multijoueur/creer`;
        this.multiplayerjoinLink = `/${this.gameMode}/multijoueur/rejoindre`;
        this.singleplayerLink = `${this.gameMode}/solo`;
    }
}
