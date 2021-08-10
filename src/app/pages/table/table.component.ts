import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';

interface Column {
  name: string;
  width?: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.less']
})
export class TableComponent implements OnInit, AfterViewInit {
  @ViewChild('tableView', { static: true }) tableViewRefElement: ElementRef;
  listOfData = [];
  columns: Column[] = [
    {
      name: 'Name',
    },
    {
      name: 'Age',
    },
    {
      name: 'Stress',
    },
  ];

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.listOfData = new Array(200).fill(0).map((_, index) => ({
      id: index,
      name: `Edward King ${index}`,
      age: 32,
      address: `London, Park Lane no. ${index}`
    }));
  }

  ngAfterViewInit(): void {
    // 初始化固定每列的宽度
    setTimeout(() => {
      this.el.nativeElement.querySelectorAll('th').forEach((e: HTMLElement, index: number) => {
        this.columns[index].width = e.offsetWidth + 'px';
      });
    });
  }

  onResize($event): void {
    // console.log($event);
    // console.log('resize事件结束');
  }

  onBeginResize($event): void {
    // console.log($event);
    // console.log('resize事件开始');
  }

  onResizing({ width }, c: Column): void {
    console.log(width);
    // console.log('resize事件进行中');
    c.width = width + 'px';
    this.cdr.detectChanges();
  }
}
