import { Component, OnInit } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { MAX_TITLE_LENGTH } from '@common/constants/dictionary';
import { AvatarData } from '@common/interfaces/avatar-data';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { ImageType } from '@common/models/image-type';
import { equalStringValidator } from '@app/directives/custom-validators';
import { UserService } from '@services/user.service';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';

@Component({
    selector: 'app-settings-page',
    templateUrl: './settings-page.component.html',
    styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit {
    protected newUsername: FormControl;
    protected newUsernameConfirmation: FormControl;
    protected profilePicForm: FormControl;

    protected imageTypes: typeof ImageType = ImageType;

    constructor(protected userService: UserService, private router: Router, private dialog: MatDialog) {
        this.newUsername = new FormControl<string>('');
        this.newUsernameConfirmation = new FormControl<string>('', [Validators.maxLength(MAX_TITLE_LENGTH)]);
        this.profilePicForm = new FormControl<AvatarData>(undefined);

        this.addPasswordValidator();
    }

    ngOnInit() {
        if (!this.userService.user) {
            this.router.navigate([AppRoutes.HomePage]).then();
        }
    }

    protected openAvatarSelector(): void {
        this.dialog
            .open(DialogBoxAvatarSelectorComponent, {
                width: '360px',
                height: '420px',
                backdropClass: 'dialog-backdrop',
                data: this.profilePicForm.value,
            })
            .afterClosed()
            .subscribe((data: AvatarData) => {
                if (data) {
                    this.profilePicForm.setValue(data);
                    this.userService.submitNewProfilePic(data);
                }
            });
    }

    protected submitUsername() {
        if (this.newUsername.invalid || this.newUsernameConfirmation.invalid) return;

        // TODO : Call method on server to change username
    }

    private addPasswordValidator(): void {
        let equalValidatorFn: ValidatorFn;
        this.newUsernameConfirmation.valueChanges.subscribe(() => {
            this.newUsernameConfirmation.removeValidators(equalValidatorFn);
            equalValidatorFn = equalStringValidator(this.newUsername.value);
            this.newUsernameConfirmation.addValidators(equalValidatorFn);
        });
    }
}
