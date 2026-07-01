import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rich-text',
  standalone: true,
  template: `
    <section style="padding: 2rem; max-width: 760px; margin: 0 auto;">
      <div [innerHTML]="general?.body ?? '<p>Rich text content</p>'"></div>
    </section>
  `,
})
export class RichTextComponent {
  @Input() id!: string;
  @Input() general?: { body?: string };
}
