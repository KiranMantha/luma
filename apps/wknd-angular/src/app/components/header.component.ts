import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type MainMenuNav = {
  menuName: string;
  subMenu: Array<{ menuName: string; url: string; iconName: string }>;
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './header.component.css',
  template: `
    <header>
      <p class="brandName">{{ general.brandName }}</p>
      <ul>
        @for (menu of menus; track menu.menuName) {
          <li>{{ menu.menuName }}</li>
        }
      </ul>
    </header>
  `,
})
export class HeaderComponent {
  @Input({ required: true }) general!: { brandName: string };
  @Input() menu1?: MainMenuNav;
  @Input() menu2?: MainMenuNav;

  get menus(): MainMenuNav[] {
    return [this.menu1, this.menu2].filter(Boolean) as MainMenuNav[];
  }
}
