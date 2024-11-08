import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Order, Product, OrderProduct, OrderForm, ProductoForm } from '../interfaces';
import { ApiServiceService } from '../Services/api-service.service';
import { ValidationService } from '../Services/validation.service';
import Swal from 'sweetalert2';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { 
  FormBuilder, 
  FormGroup, 
  FormArray, 
  Validators, 
  ReactiveFormsModule,
  FormControl, 
  AbstractControl
} from '@angular/forms';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule], 
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent implements OnInit {
  private apiService = inject(ApiServiceService);
  private validationService = inject(ValidationService);
  private fb = inject(FormBuilder);

  showProductForm = false;
  products: Product[] = [];

  orderForm = this.fb.group<OrderForm>({
    customerName: this.fb.control('', {
      validators: [Validators.required,
        Validators.minLength(3),
        Validators.maxLength(15)
      ], 
      nonNullable: true
    }),
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email],
      asyncValidators: [this.validationService.checkEmailOrders()],
      nonNullable: true
    }),
    products: this.fb.array<FormGroup<ProductoForm>>([], 
      [this.validationService.noDuplicateProducts()]
    )
  });

  ngOnInit(): void {
    this.apiService.getPrducts().subscribe({
      next: (products) => {
        this.products = products;
        console.log('Productos cargados:', products);
      }
    });
  }

  get productosArray() {
    return this.orderForm.get('products') as FormArray<FormGroup<ProductoForm>>;
  }

  createProductFormGroup(): FormGroup<ProductoForm> {
    return this.fb.group<ProductoForm>({
      productId: this.fb.control('', {
        validators: [Validators.required], 
        nonNullable: true
      }),
      quantity: this.fb.control(1, { 
        validators: [Validators.required, Validators.min(1)], 
        nonNullable: true 
      }),
      price: this.fb.control({ 
        value: 0, 
        disabled: true 
      }, { 
        nonNullable: true 
      }),
      stock: this.fb.control({ 
        value: 0, 
        disabled: true 
      }, { 
        nonNullable: true 
      })
    });
  }

  addProduct() {
    this.showProductForm = true;
    const productForm: FormGroup = new FormGroup({
      price: new FormControl(0),
      productId: new FormControl(''),
      quantity: new FormControl(1),
      stock: new FormControl(0)


    })
    this.productosArray.push(productForm);
  }

  onProductSelect(event: Event, index: number) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedProduct = this.products.find(p => p.id === selectElement.value);
    
    if (selectedProduct) {
      const productGroup = this.productosArray.at(index);
      productGroup.patchValue({
        price: selectedProduct.price,
        stock: selectedProduct.stock
      });
      this.productosArray.updateValueAndValidity();
    }
  }

  removeProduct(index: number) {
    this.productosArray.removeAt(index);
    this.productosArray.updateValueAndValidity();
    
    if (this.productosArray.length === 0) {
      this.showProductForm = false;
    }
  }

  getProductName(productId: string | null | undefined): string {
    if (!productId) return '';
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : '';
  }

  getTotal(): number {
    return this.productosArray.controls.reduce((total, control) => {
      const subtotal = this.getProductTotal(control);
      if (total + subtotal > 1000) {
        return (total + subtotal) - ((total + subtotal) * 0.1);
      }
      return total + subtotal;
    }, 0);
  }

  getProductTotal(productGroup: FormGroup): number {
    const quantity = productGroup.get('quantity')?.value || 0;


    const price = productGroup.get('price')?.value || 0;

    return quantity * price;
  }

  // Métodos delegados al servicio de validación
  isDuplicatedProduct(control: AbstractControl): boolean {
    return this.validationService.isDuplicatedProduct(control, this.productosArray);
  }

  isFieldValid(fieldName: string): boolean {
    return this.validationService.isFieldValid(this.orderForm.get(fieldName));
  }

  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.orderForm.get(fieldName));
  }

  getEmailError(): string {
    return this.validationService.getEmailError(this.orderForm.get('email'));
  }

  getProductError(control: AbstractControl): string {
    return this.validationService.getProductError(control);
  }

  getCustomerNameError(): string {
    return this.validationService.getCustomerNameError(this.orderForm.get('customerName'));
  }
  onSubmit() {
    
    if (this.orderForm.invalid) {
  
      const emailControl = this.orderForm.get('email');
      if (emailControl?.errors?.['tooManyOrders']) {
        Swal.fire('Error', 'Has excedido el límite de pedidos en las últimas 24 horas', 'error');
        return;
      }
  
 
  
    
    }
    if (this.orderForm.invalid) {
      Object.keys(this.orderForm.controls).forEach(key => {
        const control = this.orderForm.get(key);
        control?.markAsTouched();
      });
  
      this.productosArray.controls.forEach(control => {
        Object.keys(control.controls).forEach(key => {
          control.get(key)?.markAsTouched();
        });
      });
  
      Swal.fire('Error', 'Por favor, complete todos los campos requeridos', 'error');
      return;
    }
  
    if (this.productosArray.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
      return;
    }
  
    // Preparar los datos para enviar
    const formValue = this.orderForm.getRawValue();
    const orderData: Omit<Order, 'id'> = {
      customerName: formValue.customerName ?? '', // Usar operador de coalescencia nula
      email: formValue.email ?? '',
      products: formValue.products.map(p => ({
        productId: p.productId ?? '', // Aseguramos que nunca sea null
        quantity: p.quantity ?? 0,
        price: p.price ?? 0,
        stock: p.stock ?? 0
      })),
      total: this.getTotal(),
      orderCode: this.generateOrderCode(),
      timestamp: new Date().toISOString()
    };
  
    Swal.fire({
      title: 'Procesando',
      text: 'Creando orden...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    this.apiService.createOrder(orderData).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Éxito!',
          text: `Orden creada correctamente. Código: ${response.orderCode}`,
          icon: 'success',
          confirmButtonText: 'Ok'
        }).then((result) => {
          if (result.isConfirmed) {
            this.orderForm.reset();
            while (this.productosArray.length) {
              this.productosArray.removeAt(0);
            }
            this.showProductForm = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al crear la orden:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear la orden. Por favor, intente nuevamente.',
          icon: 'error'
        });
      }
    });
  }
  // Método auxiliar para generar código de orden
  private generateOrderCode(): string {
    const formValue = this.orderForm.getRawValue();
  
  // Manejar valores null con operador de coalescencia
  const customerName = formValue.customerName ?? '';
  const email = formValue.email ?? '';
  
  // Obtener primera letra del nombre (convertida a mayúscula)
  const firstLetterName = customerName.charAt(0).toUpperCase();
  
  // Obtener últimos 4 caracteres del email
  const lastFourEmail = email.slice(-4);
  
  // Obtener timestamp
  const timestamp = new Date().getTime();
  
  // Construir el código asegurándonos que nunca sea null
  const orderCode = `${firstLetterName || 'X'}${lastFourEmail || 'XXXX'}-${timestamp}`;
  
  console.log('Código generado:', orderCode);
  
  return orderCode;
  }
}