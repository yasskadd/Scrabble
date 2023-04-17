import { Component, NgZone, OnInit } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogBoxAvatarSelectorComponent } from '@app/components/dialog-box-avatar-selector/dialog-box-avatar-selector.component';
import { equalStringValidator } from '@app/directives/custom-validators';
import { AppRoutes } from '@app/models/app-routes';
import { LanguageChoice } from '@app/models/language-choice';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { LanguageService } from '@app/services/language.service';
import { SnackBarService } from '@app/services/snack-bar.service';
import { ThemeService } from '@app/services/theme.service';
import { MAX_TITLE_LENGTH } from '@common/constants/dictionary';
import { AvatarData } from '@common/interfaces/avatar-data';
import { Theme } from '@common/interfaces/theme';
import { ImageType } from '@common/models/image-type';
import { UserService } from '@services/user.service';

@Component({
    selector: 'app-settings-page',
    templateUrl: './settings-page.component.html',
    styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit {
    protected newUsername: FormControl;
    protected newUsernameConfirmation: FormControl;
    protected newPassword: FormControl;
    protected newPasswordConfirmation: FormControl;
    protected profilePicForm: FormControl;
    protected selectedLanguage: string;
    protected selectedDynamic: boolean;
    protected selectedMainTheme: string;
    protected selectedLightTheme: string;
    protected selectedDarkTheme: string;
    protected imageTypes: typeof ImageType = ImageType;

    constructor(
        protected userService: UserService,
        private router: Router,
        private ngZone: NgZone,
        private dialog: MatDialog,
        private httpHandlerService: HttpHandlerService,
        private languageService: LanguageService,
        private snackBarService: SnackBarService,
        private themeService: ThemeService,
    ) {
        this.newUsername = new FormControl<string>('');
        this.newUsernameConfirmation = new FormControl<string>('', [Validators.maxLength(MAX_TITLE_LENGTH)]);
        this.newPassword = new FormControl<string>('');
        this.newPasswordConfirmation = new FormControl<string>('', [Validators.maxLength(MAX_TITLE_LENGTH)]);
        this.profilePicForm = new FormControl<AvatarData>(undefined);

        this.addPasswordValidator();
    }

    ngOnInit() {
        if (!this.userService.user) {
            this.ngZone.run(() => {
                this.router.navigate([`${AppRoutes.HomePage}`]).then();
            });
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
        if (this.newUsername.value !== this.newUsernameConfirmation.value) return;
        this.httpHandlerService
            .modifyUsername(this.newUsername.value)
            .then((res) => {
                if (res.body !== 'OK') {
                    this.languageService.getWord('user_settings.snackbar_modify_err_username').subscribe((word: string) => {
                        this.snackBarService.openError(word);
                    });
                    return;
                }
                this.userService.user.username = this.newUsername.value;
                this.newUsername.reset();
                this.newUsernameConfirmation.reset();
                this.languageService.getWord('user_settings.snackbar_modify_success').subscribe((word: string) => {
                    this.snackBarService.openInfo(word);
                });
            })
            .catch((err) => {
                this.languageService.getWord('user_settings.snackbar_modify_err_username').subscribe((word: string) => {
                    this.snackBarService.openError(word);
                });
            });
    }

    protected submitPassword() {
        if (this.newPassword.invalid || this.newPasswordConfirmation.invalid) return;
        if (this.newPassword.value !== this.newPasswordConfirmation.value) return;
        this.httpHandlerService
            .modifyPassword(this.newPassword.value)
            .then(() => {
                this.userService.user.password = this.newPassword.value;
                this.newPassword.reset();
                this.newPasswordConfirmation.reset();
                this.languageService.getWord('user_settings.snackbar_modify_success').subscribe((word: string) => {
                    this.snackBarService.openInfo(word);
                });
            })
            .catch((err) => {
                this.languageService.getWord('user_settings.snackbar_modify_err_password').subscribe((word: string) => {
                    this.snackBarService.openError(word);
                });
            });
    }

    protected submitLanguage() {
        this.httpHandlerService
            .modifyLanguage(this.selectedLanguage)
            .then(() => {
                this.languageService.setLanguage(this.selectedLanguage as LanguageChoice);
                this.selectedLanguage = undefined;
                this.languageService.getWord('user_settings.snackbar_modify_success').subscribe((word: string) => {
                    this.snackBarService.openInfo(word);
                });
            })
            .catch((err) => {
                this.languageService.getWord('user_settings.snackbar_modify_err_language').subscribe((word: string) => {
                    this.snackBarService.openError(word);
                });
            });
    }

    protected submitTheme() {
        const theme: Theme = {
            mainTheme: this.selectedMainTheme,
            lightTheme: this.selectedLightTheme,
            darkTheme: this.selectedDarkTheme,
            isDynamic: this.selectedDynamic,
        };

        this.httpHandlerService
            .modifyTheme(theme)
            .then(() => {
                this.themeService.isDarkTheme.next(this.selectedMainTheme === 'setting.dark');
                this.selectedDynamic = undefined;
                this.selectedMainTheme = undefined;
                this.selectedLightTheme = undefined;
                this.selectedDarkTheme = undefined;
                this.languageService.getWord('user_settings.snackbar_modify_success').subscribe((word: string) => {
                    this.snackBarService.openInfo(word);
                });
            })
            .catch((err) => {
                this.languageService.getWord('user_settings.snackbar_modify_err_theme').subscribe((word: string) => {
                    this.snackBarService.openError(word);
                });
            });
    }

    private addPasswordValidator(): void {
        let equalValidatorFn: ValidatorFn;
        this.newUsernameConfirmation.valueChanges.subscribe(() => {
            this.newUsernameConfirmation.removeValidators(equalValidatorFn);
            equalValidatorFn = equalStringValidator(this.newUsername.value);
            this.newUsernameConfirmation.addValidators(equalValidatorFn);
        });
    }

    protected redirectProfile() {
        this.ngZone.run(() => {
            this.router.navigate([AppRoutes.UserProfilePage]).then();
        });
    }
}
