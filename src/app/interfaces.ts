import { FormArray, FormControl, FormGroup } from "@angular/forms";

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
  }
  
  export interface Order {
    id: string;
    customerName: string;
    email: string;
    products: OrderProduct[];
    total: number;
    orderCode: string;
    timestamp: string;
  }
  
  export interface OrderProduct {
    productId: string;
    quantity: number;
    stock: number;
    price: number;
  }

  export interface OrderForm {
    customerName: FormControl<string | null>;
    email: FormControl<string | null>;
    products: FormArray<FormGroup<ProductoForm>>;
  }
  
  export interface ProductoForm {
    
    productId: FormControl<string | null>;
    quantity: FormControl<number | null>;
    price: FormControl<number | null>;
    stock: FormControl<number | null>;
  }