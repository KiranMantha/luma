import { Component } from '@angular/core';
import { LumaPageComponent } from '../lib/luma-preview';

// Side-effect import — registers all components via MapTo()
import '../lib/import-components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LumaPageComponent],
  template: `<luma-page />`,
})
export class AppComponent {}
