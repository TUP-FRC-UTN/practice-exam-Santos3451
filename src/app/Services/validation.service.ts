// validation.service.ts
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, AsyncValidatorFn, ValidatorFn, FormArray, FormGroup } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiServiceService } from './api-service.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  constructor(private apiService: ApiServiceService) {}

  
  checkEmailOrders(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
  
      return this.apiService.getOrderEmail(control.value).pipe(
        debounceTime(300),
        switchMap(orders => {
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - 24);
  
          const recentOrders = orders.filter(order => 
            new Date(order.timestamp) >= last24Hours
          );
  
          console.log('Órdenes recientes:', recentOrders.length);
          return of(recentOrders.length >= 3 ? { tooManyOrders: true } : null);
        }),
        catchError(error => {
          console.error('Error en validación de email:', error);
          return of({ apiError: true });
        })
      );
    };
  }

  noDuplicateProducts(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const productsArray = formArray as FormArray;
      const productIds = productsArray.controls.map(control => 
        control.get('productId')?.value
      );
      
      let duplicates: { [key: string]: boolean } = {};
      
      productIds.forEach((id, index) => {
        if (id) {
          const firstIndex = productIds.indexOf(id);
          if (firstIndex !== index) {
            duplicates[index] = true;
            duplicates[firstIndex] = true;
          }
        }
      });
      
      return Object.keys(duplicates).length > 0 ? { duplicateIndexes: duplicates } : null;
    };
  }

  isDuplicatedProduct(control: AbstractControl, formArray: FormArray): boolean {
    const index = formArray.controls.indexOf(control as FormGroup);
    const currentId = control.get('productId')?.value;
    
    if (!currentId) return false;
    
    return formArray.controls.some((otherControl, otherIndex) => 
      otherIndex !== index && 
      otherControl.get('productId')?.value === currentId
    );
  }

  isFieldValid(field: AbstractControl | null): boolean {
    return field ? field.valid && (field.dirty || field.touched) : false;
  }

  isFieldInvalid(field: AbstractControl | null): boolean {
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getEmailError(email: AbstractControl | null): string {
    if (email?.errors) {
      if (email.errors['required']) return 'El email es requerido';
      if (email.errors['email']) return 'El formato del email no es válido';
      if (email.errors['tooManyOrders']) return 'Has realizado demasiados pedidos en las últimas 24 horas';
      if (email.errors['apiError']) return 'Error al verificar el historial de pedidos';
    }
    return '';
  }

  getProductError(control: AbstractControl): string {
    return this.isDuplicatedProduct(control, control.parent as FormArray) 
      ? 'El producto ya ha sido seleccionado' 
      : '';
  }

  getCustomerNameError(control: AbstractControl | null): string {
    if (control?.errors) {
      if (control.errors['required']) return 'El nombre es requerido';
      if (control.errors['minlength']) {
        return `El nombre debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
}