import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxModifyBotNamesComponent } from '@app/components/dialog-box-modify-bot-names/dialog-box-modify-bot-names.component';
import { Bot } from '@common/interfaces/bot';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { BOT_BEGINNER_NAME_LIST, BOT_EXPERT_NAME_LIST } from '@common/constants/bots-names';
import { VirtualPlayerDifficulty } from '@common/models/virtual-player-difficulty';

@Component({
    selector: 'app-admin-virtual-players',
    templateUrl: './admin-virtual-players.component.html',
    styleUrls: ['./admin-virtual-players.component.scss'],
})
export class AdminVirtualPlayersComponent {
    expertInput: string;
    beginnerInput: string;
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
            this.virtualPlayerService.addBotName(this.expertInput, VirtualPlayerDifficulty.Expert);
        }
        this.expertInput = '';
    }

    addBeginnerName() {
        this.updateBotList();
        if (this.isUniqueName(this.beginnerInput)) {
            this.virtualPlayerService.addBotName(this.beginnerInput, VirtualPlayerDifficulty.Beginner);
        }
        this.beginnerInput = '';
    }

    openReplaceNameDialog(currentName: string, difficulty: VirtualPlayerDifficulty) {
        const dialogRef = this.dialog.open(DialogBoxModifyBotNamesComponent, {
            width: this.dialogWidth,
            data: { currentName, newName: currentName },
        });

        dialogRef.afterClosed().subscribe((result) => {
            this.replaceBotName(currentName, result, difficulty);
        });
    }

    replaceBotName(currentName: string, newName: string, difficulty: VirtualPlayerDifficulty) {
        if (newName === '') return;
        this.updateBotList();
        if (this.isUniqueName(newName)) this.virtualPlayerService.replaceBotName({ currentName, newName, difficulty });
    }

    deleteBot(username: string, difficulty: VirtualPlayerDifficulty) {
        this.updateBotList();
        this.virtualPlayerService.deleteBotName(username, difficulty);
    }

    isNameDefault(username: string): boolean {
        if (BOT_BEGINNER_NAME_LIST.includes(username) || BOT_EXPERT_NAME_LIST.includes(username)) return true;
        return false;
    }

    resetBot() {
        if (this.beginnerBots.length <= 3 && this.expertBots.length <= 3) return;
        this.virtualPlayerService.resetBotNames();
    }

    updateBotList() {
        this.virtualPlayerService.updateBotNames();
    }
}
