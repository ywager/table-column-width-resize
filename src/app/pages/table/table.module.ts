import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';

import { TableRoutingModule } from './table-routing.module';
import { TableComponent } from './table.component';
import { ThResizeDirective } from './th-resize.directive';

@NgModule({
  imports: [CommonModule, FormsModule, TableRoutingModule, NzTableModule],
  declarations: [TableComponent, ThResizeDirective],
  exports: [TableComponent, ThResizeDirective]
})
export class TableModule { }
