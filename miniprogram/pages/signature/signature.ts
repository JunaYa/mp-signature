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
let dpi = 1

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
    dpi = pixelRatio
    console.log('pixelRatio', pixelRatio)

    const query = wx.createSelectorQuery()
    query.select('#canvas').node().exec((res) => {
      const canvas = res[0].node
      console.log('canvas --- ', canvas)
      // canvas.width = windowWidth * dpi
      // canvas.height = windowHeight * dpi
      canvas.width = windowWidth
      canvas.height = windowHeight

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
    const {x, y} = event.touches[0]
    // ctx.beginPath()
    ctx.lineTo(x * dpi, y * dpi)
    ctx.stroke()
  },

  onTouchEnd (event: any) : void {
    console.log('touch end --', event)
    isTouching = false
    ctx.closePath()
  },

  onTouchCancel (event: any) : void {
    console.log('touch cancel', event)
    isTouching = false
  },

  onError (event: any) {
    console.log('canvas error', event)
    isTouching = false
  },

  _strokeBegin (event?: any) : void {
    const newPointGroup = {
      color: pen.color,
      points: [],
    };

    timeLine.push(newPointGroup);
    this._reset();
    this._strokeUpdate(event);
  },

  _strokeUpdate (event: any) : void {
    if (timeLine.length === 0) {
      this._strokeUpdate(event)
      return
    }

    const {x, y} = event.touches[0]
    ctx.lineTo(x, y)
  },

  _strokeEnd (event: any) : void {

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