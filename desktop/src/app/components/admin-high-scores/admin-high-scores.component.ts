import { Component } from '@angular/core';
import { HighScoresService } from '@app/services/high-scores.service';

@Component({
    selector: 'app-admin-high-scores',
    templateUrl: './admin-high-scores.component.html',
    styleUrls: ['./admin-high-scores.component.scss'],
})
export class AdminHighScoresComponent {
    constructor(private highScoresService: HighScoresService) {}

    resetHighScores() {
        this.highScoresService.resetHighScores();
    }
}
