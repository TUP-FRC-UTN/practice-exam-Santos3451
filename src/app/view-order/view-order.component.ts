import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiServiceService } from '../Services/api-service.service';
import { Order } from '../interfaces';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-order.component.html',
  styleUrls: ['./view-order.component.css']
})
export class ViewOrderComponent implements OnInit {
  private apiService = inject(ApiServiceService);
  
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchTerm: string = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.apiService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = orders;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
  }

  filterOrders(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredOrders = this.orders;
      return;
    }

    this.filteredOrders = this.orders.filter(order => 
      order.customerName.toLowerCase().includes(term) ||
      order.email.toLowerCase().includes(term)
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTotal(total: number): string {
    return total.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'ARS'
    });
  }
}