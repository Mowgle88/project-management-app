import { Injectable } from '@angular/core';
import {
  IBoardDescription,
  IBoardData,
  IBoardUpdate,
  IColumnsRequestData,
  IColumnsData,
} from 'src/app/core/models/request.model';
import { RequestService } from 'src/app/core/services/request/request.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, map, Observable, mergeMap } from 'rxjs';
import { IErrorMessage } from 'src/app/core/models/respons-error.model';
import { CoreDataService } from 'src/app/core/services/coreData/core-data.service';

@Injectable({
  providedIn: 'root'
})

export class PMDataService {

  private _currentBoard$$ = new Subject<IBoardData | null>();
  public currentBoard$: Observable<IBoardData | null> = this._currentBoard$$.asObservable();
  public boardDataEmpty: IBoardData = {
    id: '', title: '', description: '', columns: [],
  }
  public currentBoard: IBoardData = this.boardDataEmpty;

  private _errorMessage$$ = new Subject<IErrorMessage>();
  public errorMessage$ = this._errorMessage$$.asObservable();

  private _isModalOoen$$ = new Subject<boolean>();
  public isModalOoen$ = this._isModalOoen$$.asObservable();

  private _isModalWindowNewTaskOpen$$ = new Subject<boolean>();
  public isModalWindowNewTaskOpen$ = this._isModalWindowNewTaskOpen$$.asObservable();

  constructor(
    private requestService: RequestService,
    private router: Router,
    private coreDataService: CoreDataService,
  ) {
    this.currentBoard$.subscribe(
      (value) => {
        this.currentBoard = value ? value : this.boardDataEmpty;
        const columns = this.currentBoard.columns === undefined ? [] : this.currentBoard.columns;
        this.sortColumnsByOrder(columns);
      }
    )
  }

  createBoard(title: string, description: string) {
    const board: IBoardDescription = {
      title: title,
      description: description,
    }

    this.requestService.createBoard(board).subscribe(
      {
        next: (response: IBoardData) => {
          this._currentBoard$$.next(response);
          this.router.navigateByUrl(`main/board/${response.id}`);
        },
        error: (error: HttpErrorResponse) => {
          console.error(`${error.statusText} error caught`);
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
      }
    );

  }

  getBoard(id: string): void {

    this.requestService.getBoard(id).subscribe(
      {
        next: (response: IBoardData) => {
          this._currentBoard$$.next(response);
        },
        error: (error: HttpErrorResponse) => console.error(error.message),
      }
    );
  }

  upDateBoard(id: string, title: string, description: string): void {
    const body: IBoardUpdate = {
      title: title,
      description: description,
    }

    this.requestService.updateBoard(id, body).subscribe({
      next: (response: IBoardData) => this.getBoard(id),
      error: (error: HttpErrorResponse) => console.error(error.message)
    });
  }

  deleteBoard(id: string) {
    this.requestService.deleteBoard(id).subscribe({
      next: (response: any) => console.log(response),
      error: (error: HttpErrorResponse) => console.error(error.message),
    });
    this._currentBoard$$.next(null);
    this.router.navigateByUrl('main');
  }

  createColumn(boardId: string, title: string, orde: number): void {
    console.log('Колонки обработаны')
    if (this.currentBoard) {
      const order = this.currentBoard.columns?.length ? this.currentBoard?.columns?.length : 0;
      const id = this.currentBoard.id;
      const columnData: IColumnsRequestData = {
        title: title,
        order: (order + 1),
      }

      this.requestService.createColumn(id, columnData).subscribe({
        next: (response) => {
          if (this.currentBoard) {
            this.currentBoard.columns = response;
            this.getBoard(id);
          }
        },
        error: (error) => console.error(error),
      });

    }

  }

  updateColumns(columnId: string, title: string, order: number) {
    const body: IColumnsRequestData = {
      title: title,
      order: order
    }
    const id = this.currentBoard ? this.currentBoard.id : '';

    this.requestService.updateColumn(id, columnId, body).subscribe({
      next: (respons) => this.getBoard(id),
      error: (error) => console.error(error),
    });

  }

  deleteColumn(columnId: string) {
    const id = this.currentBoard ? this.currentBoard.id : '';
    this.requestService.deleteColumn(id, columnId).subscribe({
      next: (response) => {
        this.getBoard(id);
      },
      error: (error) => console.error(error.message),
    });
  }

  deleteTask(columnId: string, taskId: string) {
    const id = this.currentBoard ? this.currentBoard.id : '';
    this.requestService.deleteTask(id, columnId, taskId).subscribe({
      next: (response) => {
        this.getBoard(id);
      },
      error: (error) => console.error(error.message),
    });
  }

  changeErrorMessage(errorMessage: IErrorMessage) {
    this._errorMessage$$.next(errorMessage);
  }

  openCreationColumnTaskModal() {
    this._isModalOoen$$.next(true);

  }

  closeCreationColumnTaskModal() {
    this._isModalOoen$$.next(false);
  }

  showConfirmationModal(name: string, columnID?: string, taskID?: string) {
    const column = columnID ? columnID : '';
    const task = taskID ? taskID : '';
    const res = this.coreDataService.openConfirmationModal().then(() => {
      switch (name) {
        case 'board':
          this.deleteBoard(this.currentBoard.id);
          break;
        case 'column':
          this.deleteColumn(column);
          break;
        case 'task':
          this.deleteTask(column, task);
          break;

        default:
          break;
      }
    })
      .catch(() => {

      })
  }

  sortColumnsByOrder(columns: IColumnsData[]): boolean {
    let isColumnsChange = false;
    if (columns.length > 0) {

      columns.sort((a, b) => a.order - b.order);

      const id = this.currentBoard ? this.currentBoard.id : '';
      for (let i = 0; i < columns.length; i += 1) {
        const column = columns[i];
        if (column.order !== (i + 1)) {
          const newOrder = i + 1;
          if (this.currentBoard.columns) {
            this.currentBoard.columns[i].order = newOrder;
          }
          this.updateColumns(column.id, column.title, newOrder);
        }
      }
    }
    return isColumnsChange;
  }

  showModalWindowNewTask() {
    this._isModalWindowNewTaskOpen$$.next(true);
  }

  closeModalWindowNewTask() {
    this._isModalWindowNewTaskOpen$$.next(false);
  }

  OnDestroy() {
    if (this._currentBoard$$) {
      this._currentBoard$$.unsubscribe()
    }
    if (this._errorMessage$$) {
      this._errorMessage$$.unsubscribe();
    }
    if (this._isModalWindowNewTaskOpen$$) {
      this.this._isModalWindowNewTaskOpen$$.unsubscribe();
    }
  }

}
