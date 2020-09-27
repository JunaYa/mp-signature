// miniprogram/pages/signature.js
import { Bezier } from '../../lib/bezier'
import { BasicPoint, Point } from '../../lib/point'
import { throttle } from '../../lib/throttle'


// canvas context
let ctx: any = null
// touch drawing
let isTouching: boolean = false
let backgroundColor = '#FEFEFE'
let pen = { color: '#333333', width: 1 }
let dpr = 1

// 时间轴，记录操作步骤数据
let timeLine = []

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
    this._lineTo(x, y)
    ctx.stroke()
  },

  _strokeEnd (event: any) : void {
    ctx.closePath()
  },

  _createPoint(x: number, y: number): Point {
    const {left, top} = ctx.canvas;
    return new Point(x - left, y - top, new Date().getTime());
  },

  _drawDot () : void {
    ctx.beginPath();

    ctx.closePath();
    ctx.fillStyle = '#333333';
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