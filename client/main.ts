let ratio = 5
let batchSize = 10

let { floor, random } = Math

let R = 0
let G = 1
let B = 2
let A = 3

let canvas = document.querySelector('#canvas') as HTMLCanvasElement
let context = canvas.getContext('2d')!
let w = floor(window.innerWidth / ratio)
let h = floor(window.innerHeight / ratio)
canvas.width = w
canvas.height = h

let imageData = context.getImageData(0, 0, w, h)

let pending: [x: number, y: number][] = []

let upMask = (1 << 1) | (1 << 2) | (1 << 3)
let downMask = (1 << 7) | (1 << 8) | (1 << 9)
let leftMask = (1 << 1) | (1 << 4) | (1 << 7)
let rightMask = (1 << 3) | (1 << 6) | (1 << 9)

let map: number[][] = []
for (let y = 0; y < h; y++) {
  map[y] = []
  for (let x = 0; x < w; x++) {
    map[y][x] = 0
  }
}

let g = 0
let dg = 1
for (let i = 0; i < w * h * 4; i += 4) {
  let x = (i / 4) % w
  let y = (i / 4 - x) / w
  imageData.data[i + R] = floor((x / w) * 256)
  imageData.data[i + G] = 127
  imageData.data[i + B] = floor((y / h) * 256)
  imageData.data[i + A] = 0
}
context.putImageData(imageData, 0, 0)

function addPoint(x: number, y: number) {
  if (map[y][x]) {
    return
  }
  map[y][x] = 1
  let i = (x + y * w) * 4
  // TODO calculate g based on nearby G
  imageData.data[i + G] = g
  imageData.data[i + A] = 255
  g += dg
  if (g == -1 || g == 256) {
    dg *= -1
    g += dg
  }
  checkPeer(x - 1, y)
  checkPeer(x + 1, y)
  checkPeer(x, y - 1)
  checkPeer(x, y + 1)
}

function checkPeer(x: number, y: number) {
  if (x < 0 || y < 0 || x >= w || y >= h) {
    return
  }
  pending.push([x, y])
}

function countPeer(x: number, y: number) {
  let flag = 0
  flag |= getPeer(x - 1, y - 1) << 1
  flag |= getPeer(x, y - 1) << 2
  flag |= getPeer(x + 1, y - 1) << 3
  flag |= getPeer(x - 1, y) << 4
  flag |= getPeer(x + 1, y) << 6
  flag |= getPeer(x - 1, y + 1) << 7
  flag |= getPeer(x, y + 1) << 8
  flag |= getPeer(x + 1, y + 1) << 9
  return flag
}

function getPeer(x: number, y: number) {
  return x < 0 || y < 0 || x >= w || y >= h ? 0 : map[y][x]
}

canvas.addEventListener('click', event => {
  let x = floor(event.clientX / ratio)
  let y = floor(event.clientY / ratio)
  addPoint(x, y)
  render()
})

function tick() {
  let n = pending.length
  if (n == 0) {
    return 0
  }
  let i = floor(random() * n)
  let [[x, y]] = pending.splice(i, 1)
  let flag = countPeer(x, y)
  let isUp = flag & upMask
  let isDown = flag & downMask
  let isLeft = flag & leftMask
  let isRight = flag & rightMask
  let side = 0
  side += isUp ? 1 : 0
  side += isDown ? 1 : 0
  side += isLeft ? 1 : 0
  side += isRight ? 1 : 0
  if (side == 2) {
    addPoint(x, y)
  }
  context.putImageData(imageData, 0, 0)
}

function render() {
  for (let i = 0; i < batchSize; i++) {
    tick()
  }
  requestAnimationFrame(render)
}
