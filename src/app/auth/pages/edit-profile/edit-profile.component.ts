import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/services/auth/auth.service';
import { IResAuthLogin, IUseRegistrationData } from 'src/app/core/models/request.model';
import { loginFormValidators } from 'src/app/shared/utils/login-form-validators';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {

  userStorage: IResAuthLogin = <IResAuthLogin>this.storage.getData('user');

  oldUserName: string = this.userStorage.name;

  oldUserLogin: string = this.userStorage.login;


  profileEditingForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private storage: StorageService,
    public translate: TranslateService,
  ) {
    translate.addLangs(['en', 'ru']);
    translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.profileEditingForm = new FormGroup({
      userName: new FormControl(this.oldUserName, [
        Validators.required,
        Validators.minLength(2)
      ]),
      email: new FormControl(this.oldUserLogin, [Validators.email, Validators.required
      ]),
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(8),
        loginFormValidators.digitValidator,
        loginFormValidators.lowercaseValidator,
        loginFormValidators.uppercaseValidator,
        loginFormValidators.symbolsValidator,
      ]),
      confirmPassword: new FormControl(null, [
        Validators.required,
      ]),
    },
      {
        validators: (control: AbstractControl): ValidatorFn | null => {
          if (control.value.password !== control.value.confirmPassword) {
            (<AbstractControl>control.get('confirmPassword')).setErrors({ notSame: true });
          }
          return null
        }
      }
    );
  }

  get userName(): AbstractControl {
    return <AbstractControl>this.profileEditingForm.get('userName');
  }

  get email(): AbstractControl {
    return <AbstractControl>this.profileEditingForm.get('email');
  }

  get password(): AbstractControl {
    return <AbstractControl>this.profileEditingForm.get('password');
  }

  get confirmPassword(): AbstractControl {
    return <AbstractControl>this.profileEditingForm.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.profileEditingForm.valid) {

      const userData: IUseRegistrationData = {
        name: this.profileEditingForm.value.userName,
        login: this.profileEditingForm.value.email,
        password: this.profileEditingForm.value.password,
      };

      this.authService.updateUser(userData);
    }
  }

  onDelete(): void {
    this.authService.showConfirmationModalEditProfile();
  }

}
