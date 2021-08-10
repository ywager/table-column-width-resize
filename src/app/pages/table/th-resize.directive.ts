import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  HostListener,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[thResize]'
})
export class ThResizeDirective implements AfterViewInit, OnDestroy {
  @Input() tableViewRefElement: ElementRef;

  @Output() resizeEndEvent: EventEmitter<{ width: number }> = new EventEmitter<{ width: number }>();
  @Output() resizeStartEvent: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
  @Output() resizingEvent: EventEmitter<{ width: number }> = new EventEmitter<{ width: number }>();

  private document: Document;
  private resizeNodeEvent: any;
  private mouseenterNodeEvent: any;
  private mouseleaveNodeEvent: any;
  private nextElement: any;
  private element: HTMLElement;
  private resizeHandleElement: HTMLElement;
  private resizeOverlay: HTMLElement;
  private tableElement: HTMLElement;
  private resizeBarRefElement: HTMLElement;

  private resizing = false;
  private minWidth: string | number = 50;
  private maxWidth: string | number;
  private initialWidth: number;
  private totalWidth: number;
  private mouseDownScreenX: number;
  private subscription: Subscription;

  constructor(
    element: ElementRef,
    private renderer2: Renderer2,
    private zone: NgZone,
    @Inject(DOCUMENT) private doc: any,
  ) {
    this.element = element.nativeElement;
    this.document = this.doc;
  }

  ngAfterViewInit(): void {
    this.setResizeHandle();
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent): void {
    const isHandle = (<HTMLElement>event.target).classList.contains('resize-handle');

    if (isHandle) {
      this.resizeStartEvent.emit(event);

      this.initialWidth = this.element.clientWidth;
      const initialOffset = this.element.offsetLeft;
      this.mouseDownScreenX = event.clientX;
      event.stopPropagation();
      this.nextElement = this.element.nextElementSibling;
      this.resizing = true;
      this.totalWidth = this.nextElement ? this.initialWidth + this.nextElement.clientWidth : this.initialWidth;

      this.resizeOverlay = this.renderer2.createElement('div');
      this.renderer2.appendChild(this.element.firstElementChild, this.resizeOverlay);
      this.renderer2.addClass(this.resizeOverlay, 'table-resize-overlay');
      this.renderer2.listen(this.resizeOverlay, 'click', (clickEvent: Event) => clickEvent.stopPropagation());

      this.renderer2.addClass(this.tableViewRefElement.nativeElement, 'table-view-selector');

      if (!this.resizeBarRefElement) {
        const resizeBar = this.renderer2.createElement('div');
        this.renderer2.addClass(resizeBar, 'table-resize-bar');

        this.tableElement = this.tableViewRefElement.nativeElement.querySelector('.table-wrap table');
        if (this.tableElement) {
          this.renderer2.appendChild(this.tableElement, resizeBar);
          this.renderer2.setStyle(resizeBar, 'display', 'block');
          this.renderer2.setStyle(resizeBar, 'left', initialOffset + this.initialWidth + 'px');
          this.resizeBarRefElement = resizeBar;
        }
      }

      this.renderer2.addClass(this.element, 'table-hover-bg');

      const mouseup = fromEvent(this.document, 'mouseup');
      this.subscription = mouseup.subscribe((ev: any) => this.onMouseup(ev));

      this.zone.runOutsideAngular(() => {
        this.document.addEventListener('mousemove', this.bindMousemove);
      });
    }
  }

  onMouseup(event: MouseEvent): void {
    this.zone.run(() => {
      const movementX = event.clientX - this.mouseDownScreenX;
      const newWidth = this.initialWidth + movementX;
      const finalWidth = this.getFinalWidth(newWidth);
      this.resizing = false;

      this.renderer2.removeChild(this.element, this.resizeOverlay);
      this.renderer2.removeClass(this.tableViewRefElement.nativeElement, 'table-view-selector');
      this.renderer2.removeClass(this.element, 'table-hover-bg');
      if (this.tableElement) {
        this.renderer2.removeChild(this.tableElement, this.resizeBarRefElement);
      }

      this.resizeEndEvent.emit({ width: finalWidth });
    });
    if (this.subscription && !this.subscription.closed) {
      this._destroySubscription();
    }

    this.document.removeEventListener('mousemove', this.bindMousemove);
  }

  bindMousemove = (e) => {
    this.move(e);
  }

  move(event: MouseEvent): void {
    const movementX = event.clientX - this.mouseDownScreenX;
    const newWidth = this.initialWidth + movementX;

    const finalWidth = this.getFinalWidth(newWidth);
    if (finalWidth <= this.minWidth) {
      this.resizingEvent.emit({ width: finalWidth });
      this.onMouseup(event);
      return;
    }
    const leftWidth = finalWidth + this.element.offsetLeft;
    if (this.resizeBarRefElement) {
      this.renderer2.setStyle(this.resizeBarRefElement, 'left', `${leftWidth}px`);
    }
    this.resizingEvent.emit({ width: finalWidth });
  }

  private getFinalWidth(newWidth: number): number {
    const minWidth = this.handleWidth(this.minWidth);
    const maxWidth = this.handleWidth(this.maxWidth);

    const overMinWidth = !this.minWidth || newWidth >= minWidth;
    const underMaxWidth = !this.maxWidth || newWidth <= maxWidth;

    const finalWidth = !overMinWidth ? minWidth : !underMaxWidth ? maxWidth : newWidth;
    return finalWidth;
  }

  private handleWidth(width: string | number): number {
    if (!width) {
      return;
    }
    if (typeof width === 'number') {
      return width;
    }
    if (width.includes('%')) {
      const tableWidth = this.tableViewRefElement.nativeElement.clientWidth;
      return (tableWidth * parseInt(width, 10)) / 100;
    }
    return parseInt(width.replace(/[^\d]+/, ''), 10);
  }

  private _destroySubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  private setResizeHandle(): void {
    this.resizeHandleElement = this.renderer2.createElement('span');
    this.renderer2.addClass(this.resizeHandleElement, 'resize-handle');
    this.renderer2.appendChild(this.element, this.resizeHandleElement);

    this.resizeNodeEvent = this.renderer2.listen(this.resizeHandleElement, 'click', (event) => event.stopPropagation());

    this.mouseenterNodeEvent = this.renderer2.listen(this.resizeHandleElement, 'mouseenter', (event) => {
      this.initialWidth = this.element.clientWidth;
      const initialOffset = this.element.offsetLeft;

      event.stopPropagation();

      const resizeBar = this.renderer2.createElement('div');
      this.renderer2.addClass(resizeBar, 'table-resize-bar');
      this.tableElement = this.tableViewRefElement.nativeElement.querySelector('.table-wrap table');
      if (this.tableElement) {
        this.renderer2.appendChild(this.tableElement, resizeBar);
        this.renderer2.setStyle(resizeBar, 'display', 'block');
        this.renderer2.setStyle(resizeBar, 'left', initialOffset + this.initialWidth + 'px');
        this.resizeBarRefElement = resizeBar;
      }
    });

    this.mouseleaveNodeEvent = this.renderer2.listen(this.resizeHandleElement, 'mouseleave', (event) => {
      event.stopPropagation();

      if (!this.resizing && this.tableElement && this.resizeBarRefElement) {
        this.renderer2.removeChild(this.tableElement, this.resizeBarRefElement);
      }
    });
  }

  ngOnDestroy(): void {
    this._destroySubscription();
    if (this.resizeNodeEvent) {
      this.resizeNodeEvent();
    }
    if (this.mouseenterNodeEvent) {
      this.mouseenterNodeEvent();
    }
    if (this.mouseleaveNodeEvent) {
      this.mouseleaveNodeEvent();
    }
  }
}
