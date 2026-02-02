import { eachElement, getTextByPathList } from './utils'
import { applyTint } from './color'
import type { AnyRecord, XmlNode } from './types'

function extractChartColors(serNode: XmlNode, warpObj: AnyRecord): Array<string | null> {
  let series = serNode as any
  if (series && (series as any).constructor !== Array) series = [series]
  const schemeClrs: Array<string | null> = []
  for (const node of series as AnyRecord[]) {
    let schemeClr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:schemeClr'])
    if (!schemeClr) schemeClr = getTextByPathList(node, ['c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr'])
    if (!schemeClr) schemeClr = getTextByPathList(node, ['c:marker', 'c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr'])

    let clr = getTextByPathList(schemeClr, ['attrs', 'val'])
    if (clr) {
      clr = getTextByPathList(warpObj['themeContent'] as AnyRecord, ['a:theme', 'a:themeElements', 'a:clrScheme', `a:${clr}`, 'a:srgbClr', 'attrs', 'val'])
      const tint = Number(getTextByPathList(schemeClr, ['a:tint', 'attrs', 'val'])) / 100000
      if (clr && !isNaN(tint)) {
        clr = applyTint(String(clr), tint)
      }
    }
    else clr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:srgbClr', 'attrs', 'val'])

    if (clr) schemeClrs.push('#' + String(clr))
    else schemeClrs.push(null)
  }
  return schemeClrs
}

function extractChartData(serNode: AnyRecord): AnyRecord[] {
  const dataMat: AnyRecord[] = []
  if (!serNode) return dataMat

  if (serNode['c:xVal']) {
    let dataRow: number[] = []
    eachElement(serNode['c:xVal']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
      dataRow.push(parseFloat(String((innerNode as AnyRecord)['c:v'])))
      return ''
    })
    dataMat.push(dataRow)
    dataRow = []
    eachElement(serNode['c:yVal']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
      dataRow.push(parseFloat(String((innerNode as AnyRecord)['c:v'])))
      return ''
    })
    dataMat.push(dataRow)
  } 
  else {
    eachElement(serNode, (innerNode, index) => {
      const dataRow: AnyRecord[] = []
      const colName = getTextByPathList(innerNode, ['c:tx', 'c:strRef', 'c:strCache', 'c:pt', 'c:v']) || index

      const rowNames: AnyRecord = {}
      if (getTextByPathList(innerNode, ['c:cat', 'c:strRef', 'c:strCache', 'c:pt'])) {
        eachElement((innerNode as AnyRecord)['c:cat']['c:strRef']['c:strCache']['c:pt'], (innerNode) => {
          rowNames[(innerNode as AnyRecord)['attrs']['idx']] = (innerNode as AnyRecord)['c:v']
          return ''
        })
      } 
      else if (getTextByPathList(innerNode, ['c:cat', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement((innerNode as AnyRecord)['c:cat']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
          rowNames[(innerNode as AnyRecord)['attrs']['idx']] = (innerNode as AnyRecord)['c:v']
          return ''
        })
      }

      if (getTextByPathList(innerNode, ['c:val', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement((innerNode as AnyRecord)['c:val']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
          dataRow.push({
            x: (innerNode as AnyRecord)['attrs']['idx'],
            y: parseFloat(String((innerNode as AnyRecord)['c:v'])),
          })
          return ''
        })
      }

      dataMat.push({
        key: colName,
        values: dataRow,
        xlabels: rowNames,
      })
      return ''
    })
  }

  return dataMat
}

export function getChartInfo(plotArea: AnyRecord, warpObj: AnyRecord): AnyRecord | null {
  let chart = null
  for (const key in plotArea) {
    switch (key) {
      case 'c:lineChart':
        chart = {
          type: 'lineChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          marker: plotArea[key]['c:marker'] ? true : false,
        }
        break
      case 'c:line3DChart':
        chart = {
          type: 'line3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:barChart':
        chart = {
          type: 'barChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          barDir: getTextByPathList(plotArea[key], ['c:barDir', 'attrs', 'val']),
        }
        break
      case 'c:bar3DChart':
        chart = {
          type: 'bar3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          barDir: getTextByPathList(plotArea[key], ['c:barDir', 'attrs', 'val']),
        }
        break
      case 'c:pieChart':
        chart = {
          type: 'pieChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
        }
        break
      case 'c:pie3DChart':
        chart = {
          type: 'pie3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
        }
        break
      case 'c:doughnutChart':
        chart = {
          type: 'doughnutChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
          holeSize: getTextByPathList(plotArea[key], ['c:holeSize', 'attrs', 'val']),
        }
        break
      case 'c:areaChart':
        chart = {
          type: 'areaChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:area3DChart':
        chart = {
          type: 'area3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:scatterChart':
        chart = {
          type: 'scatterChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          style: getTextByPathList(plotArea[key], ['c:scatterStyle', 'attrs', 'val']),
        }
        break
      case 'c:bubbleChart':
        chart = {
          type: 'bubbleChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:radarChart':
        chart = {
          type: 'radarChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          style: getTextByPathList(plotArea[key], ['c:radarStyle', 'attrs', 'val']),
        }
        break
      case 'c:surfaceChart':
        chart = {
          type: 'surfaceChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:surface3DChart':
        chart = {
          type: 'surface3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:stockChart':
        chart = {
          type: 'stockChart',
          data: extractChartData(plotArea[key]['c:ser']),
          colors: [],
        }
        break
      default:
    }
  }

  return chart
}
