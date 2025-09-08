import type { ComposeOption } from 'echarts/core'
import type {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  ScatterSeriesOption,
  RadarSeriesOption,
} from 'echarts/charts'
import type { ChartData, ChartType } from '@/types/slides'

type EChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | RadarSeriesOption
>

export interface ChartOptionPayload {
  type: ChartType
  data: ChartData
  themeColors: string[]
  textColor?: any
  lineSmooth?: boolean
  stack?: boolean
  legend?: string
  labelValue?: string
  labelPosition?: string
}

export const getChartOption = ({
  type,
  data,
  themeColors,
  textColor,
  lineSmooth,
  stack,
  legend,
  labelValue,
  labelPosition,
}: ChartOptionPayload): EChartOption | null => {
  const positionData: any = { show: true }
  const typelist = ['bar', 'column', 'line', 'area']
  if (typelist.includes(type)) {
    if (labelPosition === 'none') {
      positionData.show = false
    } else if (labelPosition !== 'center') {
      positionData.position = labelPosition
    }
  } else {
    if (labelPosition === 'none') {
      positionData.show = false
    } else {
      positionData.position = 'inner'
    }
  }
  if (labelValue?.includes('name')) {
    positionData.formatter = '{b}'
  }
  if (labelValue?.includes('value')) {
    if (positionData.formatter) {
      positionData.formatter += ',{c}'
    } else {
      positionData.formatter = '{c}'
    }
  }

  if (labelValue?.includes('point')) {
    if (positionData.formatter) {
      positionData.formatter += ',{d}%'
    } else {
      positionData.formatter = '{d}%'
    }
  }

  if (type === 'bar') {
    return {
      tooltip: {
        trigger: 'axis',
        show: true,
      },
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend:
        data.series.length > 1
          ? {
              show: legend === 'none' ? false : true,
              top: legend || 'bottom',
              textStyle: textColor
                ? {
                    color: textColor,
                  }
                : {},
            }
          : undefined,
      xAxis: {
        type: 'category',
        data: data.labels,
      },
      yAxis: {
        type: 'value',
      },
      series: data.series.map((item, index) => {
        const seriesItem: BarSeriesOption = {
          data: item,
          name: data.legends[index],
          type: 'bar',
          label: positionData,
        }

        if (stack) seriesItem.stack = 'A'
        return seriesItem
      }),
    }
  }
  if (type === 'column') {
    return {
      tooltip: {
        trigger: 'axis',
      },
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend:
        data.series.length > 1
          ? {
              show: legend === 'none' ? false : true,
              top: legend || 'bottom',
              textStyle: textColor
                ? {
                    color: textColor,
                  }
                : {},
            }
          : undefined,
      yAxis: {
        type: 'category',
        data: data.labels,
      },
      xAxis: {
        type: 'value',
      },
      series: data.series.map((item, index) => {
        const seriesItem: BarSeriesOption = {
          data: item,
          name: data.legends[index],
          type: 'bar',
          label: positionData,
        }
        if (stack) seriesItem.stack = 'A'
        return seriesItem
      }),
    }
  }
  if (type === 'line') {
    return {
      tooltip: {
        trigger: 'axis',
        show: true,
      },
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend:
        data.series.length > 1
          ? {
              show: legend === 'none' ? false : true,
              top: legend || 'bottom',
              textStyle: textColor
                ? {
                    color: textColor,
                  }
                : {},
            }
          : undefined,
      xAxis: {
        type: 'category',
        data: data.labels,
      },
      yAxis: {
        type: 'value',
      },
      series: data.series.map((item, index) => {
        const seriesItem: LineSeriesOption = {
          data: item,
          name: data.legends[index],
          type: 'line',
          smooth: lineSmooth,
          label: positionData,
        }
        if (stack) seriesItem.stack = 'A'
        return seriesItem
      }),
    }
  }
  if (type === 'pie') {
    if (textColor) {
      positionData.color = textColor
    }
    if (labelPosition === 'outside') {
      delete positionData.position
    }
    return {
      tooltip: {
        trigger: 'item',
        show: true,
      },
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend: {
        show: legend === 'none' ? false : true,
        top: legend || 'bottom',
        textStyle: textColor
          ? {
              color: textColor,
            }
          : {},
      },
      series: [
        {
          data: data.series[0].map((item, index) => ({
            value: item,
            name: data.labels[index],
          })),
          label: positionData,
          type: 'pie',
          radius: '70%',
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }
  }
  if (type === 'ring') {
    if (textColor) {
      positionData.color = textColor
    }
    if (labelPosition === 'outside') {
      delete positionData.position
    }
    return {
      tooltip: {
        trigger: 'item',
        show: true,
      },
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend: {
        show: legend === 'none' ? false : true,
        top: legend || 'bottom',
        textStyle: textColor
          ? {
              color: textColor,
            }
          : {},
      },
      series: [
        {
          data: data.series[0].map((item, index) => ({
            value: item,
            name: data.labels[index],
          })),
          label: positionData,
          type: 'pie',
          radius: ['40%', '70%'],
          padAngle: 1,
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }
  }
  if (type === 'area') {
    return {
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend:
        data.series.length > 1
          ? {
              show: legend === 'none' ? false : true,
              top: legend || 'bottom',
              textStyle: textColor
                ? {
                    color: textColor,
                  }
                : {},
            }
          : undefined,
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.labels,
      },
      yAxis: {
        type: 'value',
      },
      series: data.series.map((item, index) => {
        const seriesItem: LineSeriesOption = {
          data: item,
          name: data.legends[index],
          type: 'line',
          smooth: lineSmooth,
          areaStyle: {},
          label: positionData,
        }
        if (stack) seriesItem.stack = 'A'
        return seriesItem
      }),
    }
  }
  if (type === 'radar') {
    return {
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      legend:
        data.series.length > 1
          ? {
              show: legend === 'none' ? false : true,
              top: legend || 'bottom',
              textStyle: textColor
                ? {
                    color: textColor,
                  }
                : {},
            }
          : undefined,
      radar: {
        indicator: data.labels.map((item) => ({ name: item })),
      },
      series: [
        {
          data: data.series.map((item, index) => ({
            value: item,
            name: data.legends[index],
          })),
          type: 'radar',
        },
      ],
    }
  }
  if (type === 'scatter') {
    const formatedData = []
    for (let i = 0; i < data.series[0].length; i++) {
      const x = data.series[0][i]
      const y = data.series[1] ? data.series[1][i] : x
      formatedData.push([x, y])
    }

    return {
      color: themeColors,
      textStyle: textColor
        ? {
            color: textColor,
          }
        : {},
      xAxis: {},
      yAxis: {},
      series: [
        {
          symbolSize: 12,
          data: formatedData,
          type: 'scatter',
        },
      ],
    }
  }

  return null
}
