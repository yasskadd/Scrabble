import { Component, OnInit } from '@angular/core';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';

@Component({
    selector: 'app-high-scores',
    templateUrl: './high-scores.component.html',
    styleUrls: ['./high-scores.component.scss'],
})
export class HighScoresComponent implements OnInit {
    topRanker: any;
    constructor(private httpHandlerService: HttpHandlerService) {
        this.topRanker = [];
    }

    ngOnInit(): void {
        this.getHighScores();
    }

    getHighScores() {
        this.httpHandlerService.getRanking().then((res) => {
            this.topRanker = res;
        });
    }
}
