import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxModifyBotNamesComponent } from '@app/components/dialog-box-modify-bot-names/dialog-box-modify-bot-names.component';
import { Bot } from '@app/interfaces/bot';
import { VirtualPlayer, VirtualPlayersService } from '@app/services/virtual-players.service';
import * as constants from '@common/constants/bots';

@Component({
    selector: 'app-admin-virtual-players',
    templateUrl: './admin-virtual-players.component.html',
    styleUrls: ['./admin-virtual-players.component.scss'],
})
export class AdminVirtualPlayersComponent {
    expertInput: string;
    beginnerInput: string;
    playerType: VirtualPlayer;
    private readonly dialogWidth: string = '500px';
    constructor(public virtualPlayerService: VirtualPlayersService, public dialog: MatDialog) {
        this.updateBotList();
        this.expertInput = '';
        this.beginnerInput = '';
    }

    get expertBots(): Bot[] {
        return this.virtualPlayerService.expertBotNames;
    }

    get beginnerBots(): Bot[] {
        return this.virtualPlayerService.beginnerBotNames;
    }

    isUniqueName(name: string) {
        if (this.virtualPlayerService.expertBotNames.some((bot) => bot.username.toLowerCase() === name.toString().toLowerCase())) return false;
        if (this.virtualPlayerService.beginnerBotNames.some((bot) => bot.username.toLowerCase() === name.toString().toLowerCase())) return false;
        return true;
    }

    addExpertName() {
        this.updateBotList();
        if (this.isUniqueName(this.expertInput)) {
            this.virtualPlayerService.addBotName(this.expertInput, VirtualPlayer.Expert);
        }
        this.expertInput = '';
    }

    addBeginnerName() {
        this.updateBotList();
        if (this.isUniqueName(this.beginnerInput)) {
            this.virtualPlayerService.addBotName(this.beginnerInput, VirtualPlayer.Beginner);
        }
        this.beginnerInput = '';
    }

    openReplaceNameDialog(currentName: string, difficulty: string) {
        const dialogRef = this.dialog.open(DialogBoxModifyBotNamesComponent, {
            width: this.dialogWidth,
            data: { currentName, newName: currentName },
        });

        dialogRef.afterClosed().subscribe((result) => {
            this.replaceBotName(currentName, result, difficulty);
        });
    }

    replaceBotName(currentName: string, newName: string, difficulty: string) {
        if (newName === '') return;
        this.updateBotList();
        if (this.isUniqueName(newName)) this.virtualPlayerService.replaceBotName({ currentName, newName, difficulty });
    }

    deleteBot(username: string, difficulty: string) {
        this.updateBotList();
        this.virtualPlayerService.deleteBotName(username, difficulty);
    }

    isNameDefault(username: string): boolean {
        if (constants.BOT_BEGINNER_NAME_LIST.includes(username) || constants.BOT_EXPERT_NAME_LIST.includes(username)) return true;
        return false;
    }

    resetBot() {
        if (this.beginnerBots.length <= 3 && this.expertBots.length <= 3) return;
        this.virtualPlayerService.resetBotNames();
    }

    updateBotList() {
        this.virtualPlayerService.getBotNames();
    }
}
