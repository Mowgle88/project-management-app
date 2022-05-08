import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, Subject } from 'rxjs';
import { IResAuthLogin, IUseRegistrationData, Token, User } from 'src/app/core/models/request.model';
import { StorageService } from '../storage/storage.service';
import { IUserLoginData } from 'src/app/core/models/request.model';
import { RequestService } from 'src/app/core/services/request/request.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IErrorMessage } from '../../../core/models/respons-error.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _user$$ = new BehaviorSubject<IResAuthLogin | null>(null);
  private _errorMessage$$ = new Subject<IErrorMessage>();
  private _millisecondInHoure: number = 3600000;
  private _tokenLifeTime: number = 24;

  public isLoggedIn$ = this._user$$.asObservable().pipe(map((user) => {
    return (user !== null)
  }))


  public user$ = this._user$$.asObservable();
  public errorMessage$ = this._errorMessage$$.asObservable();


  constructor(
    private router: Router,
    private storage: StorageService,
    private requestService: RequestService
  ) {
    const user: IResAuthLogin | null = this.storage.getData('user');
    if (user) {
      this._user$$.next(user);
    }
  }

  registration(user: IUseRegistrationData) {
    return this.requestService.createUser(user).subscribe(
      (response: User) => {
        const userData: IUserLoginData = {
          login: user.login,
          password: user.password
        }

        this.login(userData);
      },
      (error: HttpErrorResponse) => {
        console.error(`Ощибка ${error.status} поймана`);
        const errorMessage: IErrorMessage = {
          errorMessage: '',
          isError: true,
        }

        if (error.statusText === 'Unknown Error') {
          errorMessage.errorMessage = 'Check the connection at the network'
        } else {
          errorMessage.errorMessage = error.error.message
        }
        this._errorMessage$$.next(errorMessage);
      }
    )
  }

  login(userData: IUserLoginData): void {

    this.requestService.authorizeUser(userData).subscribe(
      (response: Token) => {
        const storageData: IResAuthLogin = {
          name: userData.login,
          token: response.token,
          date: new Date().toString(),
        }
        this.storage.setData('user', storageData);
        this._user$$.next(storageData);
        this.router.navigateByUrl('/main');
      },
      (error: HttpErrorResponse) => {
        console.error(`Ощибка ${error.status} поймана`);
        const errorMessage: IErrorMessage = {
          errorMessage: '',
          isError: true,
        }

        if (error.statusText === 'Unknown Error') {
          errorMessage.errorMessage = 'Check the connection at the network'
        } else {
          errorMessage.errorMessage = error.error.message
        }
        this._errorMessage$$.next(errorMessage);
      });
  }

  logout(): void {
    this.storage.setData('user', null);
    this._user$$.next(null)
    this.router.navigateByUrl('/welcome')
  }

  checktokenExpiration(tokencreationDate: string): void {
    const dateNow = Date.now();
    const tokenDate = new Date(tokencreationDate);
    const tokenAge = (dateNow - tokenDate.getTime()) / this._millisecondInHoure;
    console.log(`tokenAge = ${tokenAge} часов`);

    if (tokenAge > this._tokenLifeTime) {
      this.logout();
      console.log(`tokenAge = ${tokenAge} часов, Токен истек`);
    }
  }
}
