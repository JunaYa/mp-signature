// miniprogram/pages/signature.js
import { Bezier } from '../../lib/bezier'
import { BasicPoint, Point } from '../../lib/point'
import { throttle } from '../../lib/throttle'


// canvas context
let ctx: any = null
// touch drawing
let isTouching: boolean = false
let isEmpty: boolean = false
let minDistance: number = 0
let dotSize: number = 1
let backgroundColor = '#FEFEFE'
let pen = { color: '#333333', width: 1, maxWidth: 10 }
let dpr = 1
let _lastPoints: Point[] = []
let velocityFilterWeight: number
let _lastVelocity: number
let maxWidth: number
let minWidth: number
let _lastWidth: number

// 时间轴，记录操作步骤数据
let timeLine: any[] = []

Page({

  /**
   * Page initial data
   */
  data: {

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    console.log('onLoad')
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {
    this.initContext()
  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * init canvas context
   */
  initContext () {
    const { pixelRatio, windowWidth, windowHeight } = wx.getSystemInfoSync()
    dpr = pixelRatio
    console.log('pixelRatio', pixelRatio)

    const query = wx.createSelectorQuery()
    query.select('#canvas').node().exec((res) => {
      const canvas = res[0].node
      console.log('canvas --- ', canvas)
      canvas.width = windowWidth * dpr
      canvas.height = windowHeight * dpr

      ctx = canvas.getContext('2d')
      // ctx.scale(pixelRatio, pixelRatio)
      console.log('ctx', ctx)

      ctx.fillStyle = backgroundColor
      ctx.fillRect(16, 16, ctx.canvas.width - 32, ctx.canvas.height - 32)
    })
  },

  onTouchStart (event: any) : void {
    console.log('touch start -- ', event)
    isTouching = true
    this._strokeBegin(event)
  },

  onTouchMove (event: any) : void {
    console.log('touch move --', event)
    this._strokeUpdate(event)
  },

  onTouchEnd (event: any) : void {
    console.log('touch end --', event)
    isTouching = false
    this._strokeEnd(event)
  },

  onTouchCancel (event: any) : void {
    console.log('touch cancel', event)
    isTouching = false
    this._strokeEnd(event)
  },

  onError (event: any) {
    console.log('canvas error', event)
    isTouching = false
    this._strokeEnd(event)
  },

  _strokeBegin (event?: any) : void {
    const newPointGroup = {
      color: pen.color,
      points: [],
    };

    this._reset();
    timeLine.push(newPointGroup);
    const {x, y} = event.touches[0]
    ctx.beginPath()
    this._moveTo(x, y)
    this._lineTo(x, y)
    this._strokeUpdate(event)
  },

  _strokeUpdate (event: any) : void {
    // if (timeLine.length === 0) {
    //   this._strokeUpdate(event)
    //   return
    // }

    const {x, y} = event.touches[0]
    // this._lineTo(x, y)
    // ctx.stroke()

    const point = this._createPoint(x, y)
    const lastPointGroup = timeLine[timeLine.length - 1]
    const lastPoints = lastPointGroup.points
    const lastPoint = lastPoints.length > 0 && lastPoints[lastPoints.length - 1]
    const isLastPointTooClose = lastPoint ? point.distanceTo(lastPoint) <= minDistance : false
    pen.color = lastPointGroup.color

    if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
      const curve = this._addPoint(point)
      if (!lastPoint) {
        this._drawDot(point)
      } else if (curve) {
        this._drawCurve(curve)
      }
    }

  },

  _strokeEnd (event: any) : void {
    ctx.closePath()
  },

  _calculateCurveWidths (startPoint: Point, endPoint: Point) : { start: number; end: number } {
    const velocity = velocityFilterWeight * endPoint.velocityFrom(startPoint) + (1 - velocityFilterWeight) * _lastVelocity
    const newWidth = this._strokeWidth(velocity)
    const widths = {
      start: _lastWidth,
      end: newWidth,
    }
    _lastVelocity = velocity
    _lastWidth = newWidth
    return widths
  },

  _strokeWidth (velocity: number) {
    return Math.max(maxWidth / (velocity + 1), minWidth);
  },

  _createPoint(x: number, y: number): Point {
    const {left, top} = ctx.canvas;
    return new Point(x - left, y - top, new Date().getTime());
  },

  _addPoint(point: Point) : Bezier | null {
    _lastPoints.push(point);

    if (_lastPoints.length > 2) {
      // To reduce the initial lag make it work with 3 points
      // by copying the first point to the beginning.
      if (_lastPoints.length === 3) {
        _lastPoints.unshift(_lastPoints[0]);
      }

      // _points array will always have 4 points here.
      const widths = this._calculateCurveWidths(_lastPoints[1], _lastPoints[2]);
      const curve = Bezier.fromPoints(_lastPoints, widths);

      // Remove the first element from the list, so that there are no more than 4 points at any time.
      _lastPoints.shift();

      return curve;
    }

    return null;
  },

  _drawDot (point: BasicPoint) : void {
    ctx.beginPath();
    this._drawCurveSegment(point.x, point.y, pen.width);
    ctx.closePath();
    ctx.fillStyle = pen.color;
    ctx.fill();
  },

  _drawCurveSegment (x: number, y:number, width: number) {
    ctx.moveTo(x, y)
    ctx.arc(x, y, width, 0, 2 * Math.PI, false)
    isEmpty = false
  },

  _drawCurve(curve: Bezier): void {
    const widthDelta = curve.endWidth - curve.startWidth
    // '2' is just an arbitrary number here. If only lenght is used, then
    // there are gaps between curve segments :/
    const drawSteps = Math.floor(curve.length()) * 2

    ctx.beginPath()
    ctx.fillStyle = pen.color

    for (let i = 0; i < drawSteps; i += 1) {
      // Calculate the Bezier (x, y) coordinate for this step.
      const t = i / drawSteps
      const tt = t * t
      const ttt = tt * t
      const u = 1 - t
      const uu = u * u
      const uuu = uu * u

      let x = uuu * curve.startPoint.x
      x += 3 * uu * t * curve.control1.x
      x += 3 * u * tt * curve.control2.x
      x += ttt * curve.endPoint.x

      let y = uuu * curve.startPoint.y
      y += 3 * uu * t * curve.control1.y
      y += 3 * u * tt * curve.control2.y
      y += ttt * curve.endPoint.y

      const width = Math.min(
        curve.startWidth + ttt * widthDelta,
        pen.maxWidth,
      );
      this._drawCurveSegment(x, y, width);
    }

    ctx.closePath();
    ctx.fill();
  },

  _lineTo (x: number, y: number) : void {
    ctx.lineTo(x * dpr, y * dpr)
  },

  _moveTo (x: number, y: number) : void {
    ctx.moveTo(x * dpr, y * dpr)
  },

  _reset () : void {
    // this._lastPoints = []
    // this._lastVelocity = 0
    // this._lastWidth = (this.minWidth + this.maxWidth) / 2
    ctx.fillStyle = pen.color
  },

  _clear () : void {
    ctx.fillStyle = backgroundColor;
    ctx.clearRect(16, 16, ctx.canvas.width - 32, ctx.canvas.height - 32)
    ctx.fillRect(16, 16, ctx.canvas.width - 32, ctx.canvas.height - 32)
    timeLine = []
    this._reset()
  },

})