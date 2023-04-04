import { Component, OnInit } from '@angular/core';
import { GameClientService } from '@app/services/game-client.service';
import { first } from 'rxjs/operators';
import { TauriEvent } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';
import { TauriStateService } from '@services/tauri-state.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    isLoading: boolean;

    constructor(private gameClientService: GameClientService, private tauriStateService: TauriStateService) {
        this.isLoading = true;

        // TODO : Remove this. For debugging only
        this.isLoading = false;

        if (this.tauriStateService.useTauri) {
            const tauriWindow = WebviewWindow.getByLabel('main');
            tauriWindow
                .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
                    alert('Cannot close while in game');
                })
                .then();
        }
    }

    ngOnInit(): void {
        this.gameClientService.gameboardUpdated.pipe(first()).subscribe(() => (this.isLoading = false));
    }
}
