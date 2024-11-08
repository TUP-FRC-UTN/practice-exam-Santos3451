import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Order, Product } from '../interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {


  private readonly http: HttpClient = inject (HttpClient);
  private readonly  baseUrl = 'http://localhost:3000';

  constructor() { }

  getPrducts(): Observable<Product[]> {
    const observable = this.http.get<Product[]>(`${this.baseUrl}/products`);
    return observable;

  }
  getOrders() : Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
   
  }
  getOrderEmail(email: string): Observable<Order[]> { 

    return this.http.get<Order[]>(`${this.baseUrl}/orders?email=${email}`);

  }

  //post que crea una orden
  createOrder(order: Omit<Order, 'id'>): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order);
  }
}
