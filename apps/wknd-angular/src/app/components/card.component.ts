import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  styleUrl: './card.component.css',
  template: `
    <div class="card">
      <img [src]="general.image" alt="Card image" class="card-image" />
      <div class="card-body">
        <h3 class="card-title">{{ general.title }}</h3>
        <p class="card-description">{{ general.description }}</p>
      </div>
    </div>
  `,
})
export class CardComponent {
  @Input({ required: true }) general!: {
    image?: string;
    title: string;
    description: string;
  };
}
