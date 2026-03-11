import { getTextByPathList } from './utils'

export function shapeArc(cX: any, cY: any, rX: any, rY: any, stAng: any, endAng: any, isClose: any) {
  let dData
  let angle = stAng
  if (endAng >= stAng) {
    while (angle <= endAng) {
      const radians = angle * (Math.PI / 180)
      const x = cX + Math.cos(radians) * rX
      const y = cY + Math.sin(radians) * rY
      if (angle === stAng) {
        dData = ' M' + x + ' ' + y
      }
      dData += ' L' + x + ' ' + y
      angle++
    }
  } 
  else {
    while (angle > endAng) {
      const radians = angle * (Math.PI / 180)
      const x = cX + Math.cos(radians) * rX
      const y = cY + Math.sin(radians) * rY
      if (angle === stAng) {
        dData = ' M ' + x + ' ' + y
      }
      dData += ' L ' + x + ' ' + y
      angle--
    }
  }
  dData += (isClose ? ' z' : '')
  return dData
}

export function getCustomShapePath(custShapType: any, w: any, h: any) {
  const pathLstNode = getTextByPathList(custShapType, ['a:pathLst'])
  const pathNodes = normalizeToArray(getTextByPathList(pathLstNode, ['a:path']))

  return pathNodes
    .map(pathNode => buildCustomShapeSegment(pathNode, w, h))
    .filter(Boolean)
    .join(' ')
}

export function identifyShape(shapeData: any) {
  const pathLst = shapeData['a:pathLst']
  if (!pathLst || !pathLst['a:path']) return 'custom'

  const path = pathLst['a:path']
  const pathWidth = parseInt(path.attrs?.w) || 0
  const pathHeight = parseInt(path.attrs?.h) || 0

  const commands = extractPathCommands(path)
  
  if (commands.length === 0) return 'custom'

  const analysis = analyzePathCommands(commands, pathWidth, pathHeight)
  
  return matchShape(analysis)
}

function extractPathCommands(path: any) {
  const commands: any[] = []
  
  const moveToList = normalizeToArray(path['a:moveTo'])
  moveToList.forEach(moveTo => {
    const pt = Array.isArray(moveTo?.['a:pt']) ? moveTo['a:pt'][0] : moveTo?.['a:pt']
    if (pt) {
      commands.push({
        type: 'moveTo',
        points: [{ x: parseInt(pt.attrs?.x) || 0, y: parseInt(pt.attrs?.y) || 0 }]
      })
    }
  })

  const lineToList = normalizeToArray(path['a:lnTo'])
  lineToList.forEach(lnTo => {
    const pt = lnTo['a:pt']
    if (pt) {
      commands.push({
        type: 'lineTo',
        points: [{ x: parseInt(pt.attrs?.x) || 0, y: parseInt(pt.attrs?.y) || 0 }]
      })
    }
  })

  const cubicList = normalizeToArray(path['a:cubicBezTo'])
  cubicList.forEach(cubic => {
    const pts = normalizeToArray(cubic['a:pt'])
    const points = pts.map(pt => ({
      x: parseInt(pt.attrs?.x) || 0,
      y: parseInt(pt.attrs?.y) || 0
    }))
    if (points.length === 3) {
      commands.push({ type: 'cubicBezTo', points })
    }
  })

  const arcList = normalizeToArray(path['a:arcTo'])
  arcList.forEach(arc => {
    commands.push({
      type: 'arcTo',
      wR: parseInt(arc.attrs?.wR) || 0,
      hR: parseInt(arc.attrs?.hR) || 0,
      stAng: parseInt(arc.attrs?.stAng) || 0,
      swAng: parseInt(arc.attrs?.swAng) || 0
    })
  })

  const quadList = normalizeToArray(path['a:quadBezTo'])
  quadList.forEach(quad => {
    const pts = normalizeToArray(quad['a:pt'])
    const points = pts.map(pt => ({
      x: parseInt(pt.attrs?.x) || 0,
      y: parseInt(pt.attrs?.y) || 0
    }))
    commands.push({ type: 'quadBezTo', points })
  })

  if (path['a:close']) {
    commands.push({ type: 'close' })
  }

  return commands
}

function normalizeToArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function buildCustomShapeSegment(pathNode: any, w: number, h: number) {
  if (!pathNode || typeof pathNode !== 'object') return ''

  const maxX = parseInt(pathNode.attrs?.w) || 0
  const maxY = parseInt(pathNode.attrs?.h) || 0
  const scaleX = maxX === 0 ? 0 : w / maxX
  const scaleY = maxY === 0 ? 0 : h / maxY
  const commands = extractPathCommands(pathNode)

  if (!commands.length) return ''

  return commands
    .map((command: any) => mapCommandToPath(command, scaleX, scaleY))
    .filter(Boolean)
    .join(' ')
}

function mapCommandToPath(command: any, scaleX: number, scaleY: number) {
  switch (command.type) {
    case 'moveTo': {
      const point = command.points?.[0]
      return `M${scaleValue(point?.x, scaleX)},${scaleValue(point?.y, scaleY)}`
    }
    case 'lineTo': {
      const point = command.points?.[0]
      return `L${scaleValue(point?.x, scaleX)},${scaleValue(point?.y, scaleY)}`
    }
    case 'cubicBezTo': {
      if (!Array.isArray(command.points) || command.points.length < 3) return ''
      const [p1, p2, p3] = command.points
      return `C${scaleValue(p1?.x, scaleX)},${scaleValue(p1?.y, scaleY)} ` +
        `${scaleValue(p2?.x, scaleX)},${scaleValue(p2?.y, scaleY)} ` +
        `${scaleValue(p3?.x, scaleX)},${scaleValue(p3?.y, scaleY)}`
    }
    case 'quadBezTo': {
      if (!Array.isArray(command.points) || command.points.length < 2) return ''
      const [p1, p2] = command.points
      return `Q${scaleValue(p1?.x, scaleX)},${scaleValue(p1?.y, scaleY)} ` +
        `${scaleValue(p2?.x, scaleX)},${scaleValue(p2?.y, scaleY)}`
    }
    case 'arcTo': {
      const startAngle = (parseInt(command.stAng) || 0) / 60000
      const sweepAngle = (parseInt(command.swAng) || 0) / 60000
      const endAngle = startAngle + sweepAngle
      const radiusX = scaleValue(command.wR, scaleX)
      const radiusY = scaleValue(command.hR, scaleY)
      return shapeArc(radiusX, radiusY, radiusX, radiusY, startAngle, endAngle, false).trim()
    }
    case 'close':
      return 'z'
    default:
      return ''
  }
}

function scaleValue(value: unknown, scale: number) {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value ?? 0))
  if (!Number.isFinite(numeric) || !Number.isFinite(scale)) return 0
  return numeric * scale
}

function analyzePathCommands(commands: any, pathWidth: any, pathHeight: any) {
  const analysis = {
    lineCount: 0,
    curveCount: 0,
    arcCount: 0,
    isClosed: false,
    vertices: [] as any[],
    aspectRatio: pathHeight !== 0 ? pathWidth / pathHeight : 1,
    pathWidth,
    pathHeight,
    hasCurves: false,
    isCircular: false,
    commands
  }

  commands.forEach((cmd: any) => {
    switch (cmd.type) {
      case 'moveTo':
        analysis.vertices.push(cmd.points[0])
        break
      case 'lineTo':
        analysis.lineCount++
        analysis.vertices.push(cmd.points[0])
        break
      case 'cubicBezTo':
        analysis.curveCount++
        analysis.hasCurves = true
        if (cmd.points.length === 3) {
          analysis.vertices.push(cmd.points[2])
        }
        break
      case 'quadBezTo':
        analysis.curveCount++
        analysis.hasCurves = true
        if (cmd.points.length >= 2) {
          analysis.vertices.push(cmd.points[cmd.points.length - 1])
        }
        break
      case 'arcTo':
        analysis.arcCount++
        analysis.hasCurves = true
        break
      case 'close':
        analysis.isClosed = true
        break
      default:
        break
    }
  })

  if (analysis.curveCount === 4 && analysis.lineCount === 0 && analysis.isClosed) {
    analysis.isCircular = checkIfCircular(commands, pathWidth, pathHeight)
  }

  return analysis
}

function checkIfCircular(commands: any, width: any, height: any) {
  const bezierCommands = commands.filter((c: any) => c.type === 'cubicBezTo')
  if (bezierCommands.length !== 4) return false

  const endpoints = bezierCommands.map((cmd: any) => cmd.points[2])
  
  const hasTop = endpoints.some((p: any) => Math.abs(p.y) < height * 0.1)
  const hasBottom = endpoints.some((p: any) => Math.abs(p.y - height) < height * 0.1)
  const hasLeft = endpoints.some((p: any) => Math.abs(p.x) < width * 0.1)
  const hasRight = endpoints.some((p: any) => Math.abs(p.x - width) < width * 0.1)

  return (hasTop || hasBottom) && (hasLeft || hasRight)
}

function matchShape(analysis: any) {
  const { 
    lineCount,
    curveCount,
    isClosed,
    vertices,
    hasCurves,
    isCircular,
    pathWidth,
    pathHeight,
  } = analysis

  if (isCircular) return 'ellipse'

  if (analysis.arcCount >= 2 && isClosed && lineCount === 0) return 'ellipse'

  if (!hasCurves && isClosed && vertices.length >= 3) return matchPolygon(vertices, pathWidth, pathHeight)

  if (lineCount === 4 && curveCount === 4 && isClosed) return 'roundRect'

  if (lineCount >= 3 && curveCount > 0 && curveCount <= lineCount && isClosed) {
    const baseShape = matchPolygonByLineCount(lineCount)
    if (baseShape !== 'custom') return baseShape === 'rectangle' ? 'roundRect' : baseShape
  }
  return 'custom'
}

function matchPolygon(vertices: any, width: any, height: any) {
  const uniqueVertices = removeDuplicateVertices(vertices)
  const vertexCount = uniqueVertices.length

  switch (vertexCount) {
    case 3:
      return 'triangle'
    case 4:
      return matchQuadrilateral(uniqueVertices, width, height)
    case 5:
      return 'pentagon'
    case 6:
      return 'hexagon'
    case 7:
      return 'heptagon'
    case 8:
      return 'octagon'
    default:
      if (vertexCount > 8) {
        return 'ellipse'
      }
      return 'custom'
  }
}

function removeDuplicateVertices(vertices: any) {
  const threshold = 100
  const unique: any[] = []
  
  vertices.forEach((v: any) => {
    const isDuplicate = unique.some((u: any) => 
      Math.abs(u.x - v.x) < threshold && Math.abs(u.y - v.y) < threshold
    )
    if (!isDuplicate) unique.push(v)
  })
  
  return unique
}

function matchQuadrilateral(vertices: any, _width?: any, _height?: any) {
  if (vertices.length !== 4) return 'custom'

  const edges: any[] = []
  for (let i = 0; i < 4; i++) {
    const p1 = vertices[i]
    const p2 = vertices[(i + 1) % 4]
    edges.push({
      dx: p2.x - p1.x,
      dy: p2.y - p1.y,
      length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
    })
  }

  if (isRectangle(edges)) return 'roundRect'
  if (isRhombus(edges)) return 'rhombus'
  if (isParallelogram(edges)) return 'parallelogram'
  if (isTrapezoid(edges)) return 'trapezoid'

  return 'custom'
}

function isRectangle(edges: any) {
  const tolerance = 0.1
  const edge02Similar = Math.abs(edges[0].length - edges[2].length) / Math.max(edges[0].length, edges[2].length) < tolerance
  const edge13Similar = Math.abs(edges[1].length - edges[3].length) / Math.max(edges[1].length, edges[3].length) < tolerance
  
  if (!edge02Similar || !edge13Similar) return false

  for (let i = 0; i < 4; i++) {
    const e1 = edges[i]
    const e2 = edges[(i + 1) % 4]
    const dotProduct = e1.dx * e2.dx + e1.dy * e2.dy
    const cosAngle = dotProduct / (e1.length * e2.length)
    if (Math.abs(cosAngle) > 0.1) return false
  }
  
  return true
}

function isRhombus(edges: any) {
  const tolerance = 0.1
  const avgLength = edges.reduce((sum: number, e: any) => sum + e.length, 0) / 4
  
  return edges.every((e: any) => Math.abs(e.length - avgLength) / avgLength < tolerance)
}

function isParallelogram(edges: any) {
  const tolerance = 0.15
  
  const slope0 = edges[0].dx !== 0 ? edges[0].dy / edges[0].dx : Infinity
  const slope2 = edges[2].dx !== 0 ? edges[2].dy / edges[2].dx : Infinity
  const slope1 = edges[1].dx !== 0 ? edges[1].dy / edges[1].dx : Infinity
  const slope3 = edges[3].dx !== 0 ? edges[3].dy / edges[3].dx : Infinity

  const parallel02 = Math.abs(slope0 - slope2) < tolerance || 
                     (Math.abs(slope0) > 1000 && Math.abs(slope2) > 1000)
  const parallel13 = Math.abs(slope1 - slope3) < tolerance ||
                     (Math.abs(slope1) > 1000 && Math.abs(slope3) > 1000)

  return parallel02 && parallel13
}

function isTrapezoid(edges: any) {
  const tolerance = 0.15
  
  const slope0 = edges[0].dx !== 0 ? edges[0].dy / edges[0].dx : Infinity
  const slope2 = edges[2].dx !== 0 ? edges[2].dy / edges[2].dx : Infinity
  const slope1 = edges[1].dx !== 0 ? edges[1].dy / edges[1].dx : Infinity
  const slope3 = edges[3].dx !== 0 ? edges[3].dy / edges[3].dx : Infinity

  const parallel02 = Math.abs(slope0 - slope2) < tolerance ||
                     (Math.abs(slope0) > 1000 && Math.abs(slope2) > 1000)
  const parallel13 = Math.abs(slope1 - slope3) < tolerance ||
                     (Math.abs(slope1) > 1000 && Math.abs(slope3) > 1000)

  return (parallel02 && !parallel13) || (!parallel02 && parallel13)
}

function matchPolygonByLineCount(lineCount: any) {
  switch (lineCount) {
    case 3: return 'triangle'
    case 4: return 'rectangle'
    case 5: return 'pentagon'
    case 6: return 'hexagon'
    case 7: return 'heptagon'
    case 8: return 'octagon'
    default: return 'custom'
  }
}
