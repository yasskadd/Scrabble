import { ChangeDetectorRef, Component } from '@angular/core';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
// import * as tauri from '@tauri-apps/api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    constructor(private clientSocketService: ClientSocketService, private changeDetector: ChangeDetectorRef) {
        this.clientSocketService.updateSubject.subscribe(() => {
            this.changeDetector.detectChanges();
        });
    }
}
