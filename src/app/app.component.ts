import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule  ,RouterOutlet, RouterLink, RouterModule, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Cambia "styleUrl" por "styleUrls"
})
export class AppComponent {
  constructor(private router: Router) {}
  title = 'practice-exam';
}
