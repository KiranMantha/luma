// ─── Luma Preview — Angular adapter ───────────────────────────────────────────
//
// Angular-specific layer. All framework-agnostic logic lives in luma-core.ts.
// Import MapTo + LumaPageComponent here; drop luma-core.ts alongside and copy
// this lib/ folder into any Angular site — then update import-components.ts.

import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CSS,
  MODE,
  endInstanceDrag,
  extractSectionData,
  fetchPageBySlug,
  getCurrentDrag,
  getPageSlugFromUrl,
  getZoneComponents,
  handleDropOnBar,
  hasContent,
  initPostMessageBridge,
  notifyAddComponent,
  notifyInstanceClick,
  offDragChange,
  onDragChange,
  setCurrentDrag,
  sortByOrder,
  startInstanceDrag,
  type ComponentData,
  type ComponentPayload,
  type PageModel,
  type PageModelPayload,
  type ZoneInfo,
} from './luma-core';

// ── Component registry ────────────────────────────────────────────────────────

type RegistryEntry = {
  component: Type<any>;
  displayName?: string;
  placeholder?: string;
};

const componentRegistry: Record<string, RegistryEntry> = {};

export function MapTo(
  namespace: string,
  component: Type<any>,
  config: { displayName?: string; placeholder?: string } = {},
): void {
  componentRegistry[namespace] = { component, ...config };
}

export function getRegistry() {
  return componentRegistry;
}

// ── Helper: convert style object to CSS text ──────────────────────────────────

function toStyle(obj: Record<string, string | number>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      return `${prop}:${typeof v === 'number' && !['zIndex', 'fontWeight', 'opacity'].includes(k) ? `${v}px` : v}`;
    })
    .join(';');
}

// ── DropBarComponent ──────────────────────────────────────────────────────────

@Component({
  selector: 'luma-drop-bar',
  standalone: true,
  template: `<div [attr.style]="style()" (dragover)="onDragOver($event)" (dragleave)="over.set(false)" (drop)="onDrop($event)"></div>`,
})
export class DropBarComponent {
  @Input() afterIndex: number | null = null;
  @Input({ required: true }) zoneId!: string;
  @Input() zoneMaxComponents: number | null = null;
  @Input({ required: true }) zoneComponentCount!: number;

  over = signal(false);
  style = computed(() =>
    this.over() ? toStyle({ ...CSS.dropBar, ...CSS.dropBarActive }) : toStyle({ ...CSS.dropBar }),
  );

  onDragOver(e: DragEvent) {
    if (!getCurrentDrag() || !this.zoneMaxComponents || this.zoneComponentCount < this.zoneMaxComponents) {
      e.preventDefault();
      e.stopPropagation();
      this.over.set(true);
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.over.set(false);
    handleDropOnBar(this.afterIndex, this.zoneId, this.zoneMaxComponents, this.zoneComponentCount);
  }
}

// ── AddComponentButtonComponent ───────────────────────────────────────────────

@Component({
  selector: 'luma-add-button',
  standalone: true,
  template: `<button [attr.style]="btnStyle" (click)="onClick()">+ Add Component</button>`,
})
export class AddComponentButtonComponent {
  @Input({ required: true }) zoneId!: string;
  @Input() afterIndex: number | null = null;

  btnStyle = toStyle({ ...CSS.addButton });

  onClick() {
    notifyAddComponent(this.zoneId, this.afterIndex);
  }
}

// ── EmptyZoneDropTargetComponent ──────────────────────────────────────────────

@Component({
  selector: 'luma-empty-zone',
  standalone: true,
  template: `
    <div
      [attr.style]="style()"
      (dragover)="onDragOver($event)"
      (dragleave)="over.set(false)"
      (drop)="onDrop($event)">
      {{ label() }}
    </div>`,
})
export class EmptyZoneDropTargetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) zoneName!: string;
  @Input({ required: true }) locked!: boolean;

  over = signal(false);
  anyDragging = signal(false);

  private _onDragChange = (d: boolean) => this.anyDragging.set(d);

  label = computed(() => {
    if (this.locked) return `${this.zoneName} — locked`;
    if (this.anyDragging()) return `Drop here → ${this.zoneName}`;
    return `Drop components here into ${this.zoneName}`;
  });

  style = computed(() => {
    if (!this.anyDragging() || this.locked) return toStyle({ ...CSS.emptyZone });
    return this.over()
      ? toStyle({ ...CSS.emptyZone, ...CSS.emptyZoneActive })
      : toStyle({ ...CSS.emptyZone, borderColor: '#6366f1' });
  });

  ngOnInit() { onDragChange(this._onDragChange); }
  ngOnDestroy() { offDragChange(this._onDragChange); }

  onDragOver(e: DragEvent) {
    if (this.anyDragging() && !this.locked) {
      e.preventDefault();
      e.stopPropagation();
      this.over.set(true);
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.over.set(false);
    setCurrentDrag(null);
  }
}

// ── EditableWrapperComponent ──────────────────────────────────────────────────

@Component({
  selector: 'luma-editable',
  standalone: true,
  imports: [DropBarComponent],
  template: `
    <div>
      @if (showDropBar()) {
        <luma-drop-bar
          [afterIndex]="index - 1"
          [zoneId]="zoneId"
          [zoneMaxComponents]="zoneMaxComponents"
          [zoneComponentCount]="zoneComponentCount" />
      }
      <div
        style="position:relative"
        (mouseenter)="hovered.set(true)"
        (mouseleave)="hovered.set(false)">
        <ng-container #innerHost />
        <div
          [attr.style]="overlayStyle()"
          draggable="true"
          (dragstart)="onDragStart($event)"
          (dragend)="onDragEnd()"
          (click)="onClick($event)">
        </div>
        @if (hovered()) {
          <button [attr.style]="badgeStyle" (click)="onBadgeClick($event)">
            Edit · {{ displayName() }}
          </button>
        }
      </div>
    </div>`,
})
export class EditableWrapperComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) instance!: ComponentData;
  @Input({ required: true }) componentType!: string;
  @Input({ required: true }) index!: number;
  @Input({ required: true }) zoneId!: string;
  @Input() zoneMaxComponents: number | null = null;
  @Input({ required: true }) zoneComponentCount!: number;

  @ViewChild('innerHost', { read: ViewContainerRef }) innerHost!: ViewContainerRef;

  private compRef: any = null;
  private isDraggingThis = false;
  private componentEventHandler = (e: Event) => {
    const payload = (e as CustomEvent<ComponentPayload>).detail;
    if (this.compRef) {
      Object.keys(payload.config).forEach((k) => {
        try { this.compRef.setInput(k, payload.config[k]); } catch { /* skip undeclared */ }
      });
    }
  };
  private _onDragChange = (d: boolean) => this.anyDragging.set(d);

  hovered = signal(false);
  anyDragging = signal(false);
  showDropBar = computed(() => this.anyDragging() && !this.isDraggingThis);

  displayName = computed(() => componentRegistry[this.componentType]?.displayName ?? '');
  overlayStyle = computed(() =>
    toStyle({ ...CSS.overlay, ...(this.hovered() ? CSS.overlayHover : {}) }),
  );
  badgeStyle = toStyle({ ...CSS.editBadge });

  ngOnInit() {
    onDragChange(this._onDragChange);
    window.addEventListener(`luma:component:${this.instance.id}`, this.componentEventHandler);
  }

  ngAfterViewInit() {
    this.renderInner();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['instance'] && !changes['instance'].firstChange) {
      this.renderInner();
    }
  }

  ngOnDestroy() {
    offDragChange(this._onDragChange);
    window.removeEventListener(`luma:component:${this.instance.id}`, this.componentEventHandler);
    this.compRef?.destroy();
  }

  private renderInner() {
    this.innerHost.clear();
    this.compRef = null;
    const entry = componentRegistry[this.componentType];
    const config = this.instance.config as Record<string, unknown>;

    if (!hasContent(config) || !entry) return;

    const ref = this.innerHost.createComponent(entry.component);
    Object.entries(config).forEach(([k, v]) => {
      try { ref.setInput(k, v); } catch { /* skip undeclared inputs */ }
    });
    this.compRef = ref;
  }

  onDragStart(e: DragEvent) {
    this.isDraggingThis = true;
    startInstanceDrag(this.instance.id, this.index, this.zoneId, e.dataTransfer!);
    setTimeout(() => this.hovered.set(false), 0);
  }

  onDragEnd() {
    this.isDraggingThis = false;
    endInstanceDrag();
  }

  onClick(e: MouseEvent) {
    e.stopPropagation();
    notifyInstanceClick(this.instance.id, this.instance.componentId);
  }

  onBadgeClick(e: MouseEvent) {
    e.stopPropagation();
    notifyInstanceClick(this.instance.id, this.instance.componentId);
  }
}

// ── PageRendererComponent ─────────────────────────────────────────────────────

@Component({
  selector: 'luma-page-renderer',
  standalone: true,
  imports: [EditableWrapperComponent, EmptyZoneDropTargetComponent, AddComponentButtonComponent, DropBarComponent],
  template: `
    @if (isEditMode) {
      <div>
        @for (zone of sortedZones(); track zone.id) {
          @let zoneCmps = componentsByZone()(zone.id);
          <div>
            @if (zoneCmps.length === 0) {
              <luma-empty-zone [zoneName]="zone.name" [locked]="zone.locked" />
              @if (!zone.locked) {
                <luma-add-button [zoneId]="zone.id" [afterIndex]="null" />
              }
            } @else {
              @for (comp of zoneCmps; track comp.id; let i = $index) {
                <luma-editable
                  [instance]="comp"
                  [componentType]="comp.type"
                  [index]="i"
                  [zoneId]="zone.id"
                  [zoneMaxComponents]="zone.maxComponents"
                  [zoneComponentCount]="zoneCmps.length" />
              }
              <luma-drop-bar
                [afterIndex]="zoneCmps.length - 1"
                [zoneId]="zone.id"
                [zoneMaxComponents]="zone.maxComponents"
                [zoneComponentCount]="zoneCmps.length" />
              @if (!zone.locked) {
                <luma-add-button
                  [zoneId]="zone.id"
                  [afterIndex]="zoneCmps.length - 1" />
              }
            }
          </div>
        }
      </div>
    } @else {
      <main>
        <ng-container #previewHost />
      </main>
    }`,
})
export class PageRendererComponent implements OnInit, OnDestroy, OnChanges {
  @Input() components: ComponentData[] = [];

  private vcr = inject(ViewContainerRef);
  private previewRefs: any[] = [];

  readonly isEditMode = MODE === 'edit';

  zones = signal<ZoneInfo[]>([]);
  allComponents = signal<ComponentData[]>([]);

  sortedZones = computed(() => sortByOrder(this.zones()));
  componentsByZone = computed(() => {
    const all = this.allComponents();
    return (zoneId: string) => getZoneComponents(all, zoneId);
  });

  private pageModelHandler = (e: Event) => {
    const payload = (e as CustomEvent<PageModelPayload>).detail;
    this.zones.set(payload.zones);
    this.allComponents.set(payload.components);
  };

  ngOnInit() {
    if (this.isEditMode) {
      window.addEventListener('luma:pageModel', this.pageModelHandler);
    } else {
      this.renderPreview(this.components);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isEditMode && changes['components']) {
      this.renderPreview(this.components);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('luma:pageModel', this.pageModelHandler);
    this.clearPreview();
  }

  private clearPreview() {
    this.previewRefs.forEach((r) => r.destroy());
    this.previewRefs = [];
    this.vcr.clear();
  }

  private renderPreview(items: ComponentData[]) {
    this.clearPreview();
    sortByOrder(items).forEach((comp) => {
      const entry = componentRegistry[comp.type];
      if (!entry) {
        console.warn(`[Luma] No component registered for type "${comp.type}"`);
        return;
      }
      const ref = this.vcr.createComponent(entry.component);
      const sectionData = extractSectionData(comp);
      Object.entries(sectionData).forEach(([k, v]) => {
        try { ref.setInput(k, v); } catch { /* skip undeclared inputs */ }
      });
      this.previewRefs.push(ref);
    });
  }
}

// ── LumaPageComponent ─────────────────────────────────────────────────────────
// Top-level component. Initialises postMessage bridge, fetches in preview mode.

@Component({
  selector: 'luma-page',
  standalone: true,
  imports: [PageRendererComponent],
  template: `
    @if (error()) {
      <div style="padding:2rem;color:#dc2626">Error: {{ error() }}</div>
    } @else if (!page() && !isEditMode) {
      <div style="padding:2rem;color:#94a3b8">Loading…</div>
    } @else {
      <luma-page-renderer [components]="page()?.components ?? []" />
    }`,
})
export class LumaPageComponent implements OnInit, OnDestroy {
  readonly isEditMode = MODE === 'edit';
  page = signal<PageModel | null>(null);
  error = signal<string | null>(null);

  private cleanup?: () => void;

  async ngOnInit() {
    this.cleanup = initPostMessageBridge();
    if (this.isEditMode) return;
    const slug = getPageSlugFromUrl();
    if (!slug) { this.error.set('No page slug in URL path'); return; }
    try {
      this.page.set(await fetchPageBySlug(slug));
    } catch (err) {
      this.error.set(String(err));
    }
  }

  ngOnDestroy() { this.cleanup?.(); }
}

export type { ComponentData, ZoneInfo, PageModel };
