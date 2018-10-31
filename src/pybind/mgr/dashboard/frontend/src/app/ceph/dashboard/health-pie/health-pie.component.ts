import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import * as Chart from 'chart.js';
import * as _ from 'lodash';

import { ChartTooltip } from '../../../shared/models/chart-tooltip';
import { DimlessBinaryPipe } from '../../../shared/pipes/dimless-binary.pipe';
import { HealthPieColor } from './health-pie-color.enum';

@Component({
  selector: 'cd-health-pie',
  templateUrl: './health-pie.component.html',
  styleUrls: ['./health-pie.component.scss']
})
export class HealthPieComponent implements OnChanges, OnInit {
  @ViewChild('chartCanvas')
  chartCanvasRef: ElementRef;
  @ViewChild('chartTooltip')
  chartTooltipRef: ElementRef;

  @Input()
  data: any;
  @Input()
  chartType: string;
  @Input()
  isBytesData = false;
  @Input()
  displayLegend = false;
  @Input()
  tooltipFn: any;
  @Output()
  prepareFn = new EventEmitter();

  chart: any = {
    dataset: [
      {
        label: null,
        borderWidth: 0
      }
    ],
    options: {
      legend: {
        display: false,
        position: 'right',
        labels: { usePointStyle: true }
      },
      animation: { duration: 0 },

      tooltips: {
        enabled: false
      }
    }
  };

  constructor(private dimlessBinary: DimlessBinaryPipe) {}

  ngOnInit() {
    // An extension to Chart.js to enable rendering some
    // text in the middle of a doughnut
    Chart.pluginService.register({
      beforeDraw: function(chart) {
        if (!chart.options.center_text) {
          return;
        }

        const width = chart.chart.width,
          height = chart.chart.height,
          ctx = chart.chart.ctx;

        ctx.restore();
        const fontSize = (height / 114).toFixed(2);
        ctx.font = fontSize + 'em sans-serif';
        ctx.textBaseline = 'middle';

        const text = chart.options.center_text,
          textX = Math.round((width - ctx.measureText(text).width) / 2),
          textY = height / 2;

        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    });

    const getStyleTop = (tooltip, positionY) => {
      return positionY + tooltip.caretY - tooltip.height - 10 + 'px';
    };

    const getStyleLeft = (tooltip, positionX) => {
      return positionX + tooltip.caretX + 'px';
    };

    const chartTooltip = new ChartTooltip(
      this.chartCanvasRef,
      this.chartTooltipRef,
      getStyleLeft,
      getStyleTop
    );

    const getBody = (body) => {
      return this.getChartTooltipBody(body);
    };

    chartTooltip.getBody = getBody;

    this.chart.options.tooltips.custom = (tooltip) => {
      chartTooltip.customTooltips(tooltip);
    };

    this.setChartType();

    this.chart.options.legend.display = this.displayLegend;

    this.chart.colors = [
      {
        backgroundColor: [
          HealthPieColor.MEDIUM_LIGHT_SHADE_PINK_RED,
          HealthPieColor.MEDIUM_DARK_SHADE_CYAN_BLUE,
          HealthPieColor.LIGHT_SHADE_BROWN,
          HealthPieColor.SHADE_GREEN_CYAN,
          HealthPieColor.MEDIUM_DARK_SHADE_BLUE_MAGENTA
        ]
      }
    ];

    this.prepareFn.emit([this.chart, this.data]);
  }

  ngOnChanges() {
    this.prepareFn.emit([this.chart, this.data]);

    this.setChartSliceBorderWidth(this.chart.dataset[0]);
  }

  private getChartTooltipBody(body) {
    const bodySplit = body[0].split(': ');

    if (this.isBytesData) {
      bodySplit[1] = this.dimlessBinary.transform(bodySplit[1]);
    }

    return bodySplit.join(': ');
  }

  private setChartType() {
    const chartTypes = ['doughnut', 'pie'];
    const selectedChartType = chartTypes.find((chartType) => chartType === this.chartType);

    if (selectedChartType !== undefined) {
      this.chart.chartType = selectedChartType;
    } else {
      this.chart.chartType = chartTypes[0];
    }
  }

  private setChartSliceBorderWidth(dataset) {
    let nonZeroValueSlices = 0;
    _.forEach(dataset.data, function(slice) {
      if (slice > 0) {
        nonZeroValueSlices += 1;
      }
    });

    if (nonZeroValueSlices > 1) {
      this.chart.dataset[0].borderWidth = 1;
    }
  }
}
