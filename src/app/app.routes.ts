import { Routes } from '@angular/router';
import { CreateOrderComponent } from './create-order/create-order.component';
import { ViewOrderComponent } from './view-order/view-order.component';

export const routes: Routes = [
{
  path: '',
  redirectTo: 'create-order', 
  pathMatch: 'full'

},

  { 
    path: 'create-order', 
    component: CreateOrderComponent 
  },
  { 
    path: 'view-order', 
    component: ViewOrderComponent 
  }


];