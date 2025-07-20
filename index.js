// index.js
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const gravity = 0.7

// ─── Background & Shop ────────────────────────────────────────────
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background.png'
})

const shop = new Sprite({
  position: { x: 600, y: 128 },
  imageSrc: './img/shop.png',
  scale: 2.75,
  framesMax: 6
})

// ─── Kenji (Player) ───────────────────────────────────────────────
const player = new Fighter({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  imageSrc: './img/kenji/Idle.png',
  framesMax: 4,
  scale: 2.5,
  offset: { x: 215, y: 167 },
  sprites: {
    idle: { imageSrc: './img/kenji/Idle.png', framesMax: 4 },
    run: { imageSrc: './img/kenji/Run.png', framesMax: 8 },
    jump: { imageSrc: './img/kenji/Jump.png', framesMax: 2 },
    fall: { imageSrc: './img/kenji/Fall.png', framesMax: 2 },
    attack1: { imageSrc: './img/kenji/Attack1.png', framesMax: 4 },
    takeHit: { imageSrc: './img/kenji/Take hit.png', framesMax: 3 },
    death: { imageSrc: './img/kenji/Death.png', framesMax: 7 }
  },
  attackBox: {
    offset: { x: 100, y: 50 },
    width: 160,
    height: 50
  }
})

// ─── Dragon (Enemy) ──────────────────────────────────────────────
const dragon = new Fighter({
  position: { x: 400, y: 330 }, // start on the ground
  velocity: { x: 0, y: 0 },
  imageSrc: './img/dragon/1_dragon_idle/1_dragon_idle_000.png',
  framesMax: 1, // single‐frame idle
  scale: 0.4,
  offset: { x: 10, y: 10 },
  sprites: {
    idle: {
      imageSrc: './img/dragon/1_dragon_idle/1_dragon_idle_000.png',
      framesMax: 1
    },
    run: {
      imageSrc: './img/dragon/1_dragon_run/dragon_run_sheet.png',
      framesMax: 7,
      orientation: 'vertical' // slice top→down instead of left→right
    },
    jump: {
      imageSrc: './img/dragon/1_dragon_jump/dragon_jump.png',
      framesMax: 6,
      orientation: 'vertical' // slice top→down instead of left→right
    },
    fall: {
      imageSrc: './img/dragon/1_dragon_fly/1_dragon_fly_000.png',
      framesMax: 1
    },
    attack1: {
      imageSrc: './img/dragon/1_dragon_Attack/1_dragon_Attack_000.png',
      framesMax: 1
    },
    takeHit: {
      imageSrc: './img/dragon/1_dragon_hurt/1_dragon_hurt_000.png',
      framesMax: 1
    },
    death: {
      imageSrc: './img/dragon/1_dragon_hurt/1_dragon_hurt_000.png',
      framesMax: 1
    }
  },
  attackBox: {
    offset: { x: 0, y: 50 },
    width: 500,
    height: 50
  }
})

// ─── Timer ────────────────────────────────────────────────────────
let gameTimer = 60
let gameTimerId

function decreaseTimer() {
  if (gameTimer > 0) {
    gameTimerId = setTimeout(decreaseTimer, 1000)
    gameTimer--
    document.querySelector('#timer').innerHTML = gameTimer
  } else {
    determineWinner({ player, dragon, timerId: gameTimerId })
  }
}

function determineWinner({ player, dragon, timerId }) {
  clearTimeout(timerId)
  const display = document.querySelector('#displayText')
  display.style.display = 'flex'

  if (player.health === dragon.health) display.innerHTML = 'Tie'
  else if (player.health > dragon.health) display.innerHTML = 'Kenji Wins'
  else display.innerHTML = 'Dragon Wins'
}

decreaseTimer()

// ─── Input State ─────────────────────────────────────────────────
const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false }
}

// ─── Main Animation Loop ─────────────────────────────────────────
function animate() {
  window.requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // light overlay
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  player.update()
  dragon.update()

  // reset velocities
  player.velocity.x = 0
  dragon.velocity.x = 0

  // ── Kenji movement ────────────────────────────────────────────
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5
    player.switchSprite('run')
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5
    player.switchSprite('run')
  } else {
    player.switchSprite('idle')
  }
  if (player.velocity.y < 0) player.switchSprite('jump')
  else if (player.velocity.y > 0) player.switchSprite('fall')

  // ── Dragon movement ───────────────────────────────────────────
  if (keys.ArrowLeft.pressed && dragon.lastKey === 'ArrowLeft') {
    dragon.velocity.x = -5
    dragon.switchSprite('run')
  } else if (keys.ArrowRight.pressed && dragon.lastKey === 'ArrowRight') {
    dragon.velocity.x = 5
    dragon.switchSprite('run')
  } else {
    dragon.switchSprite('idle')
  }
  if (dragon.velocity.y < 0) dragon.switchSprite('jump')
  else if (dragon.velocity.y > 0) dragon.switchSprite('fall')

  // ── Kenji hits Dragon ─────────────────────────────────────────
  if (
    rectangularCollision({ rectangle1: player, rectangle2: dragon }) &&
    player.isAttacking &&
    player.framesCurrent === 2
  ) {
    dragon.takeHit()
    player.isAttacking = false
    gsap.to('#dragonHealth', { width: dragon.health + '%' })
  }
  if (player.isAttacking && player.framesCurrent === 2) {
    player.isAttacking = false
  }

  // ── Dragon hits Kenji ─────────────────────────────────────────
  if (
    rectangularCollision({ rectangle1: dragon, rectangle2: player }) &&
    dragon.isAttacking &&
    dragon.framesCurrent === 0
  ) {
    player.takeHit()
    dragon.isAttacking = false
    gsap.to('#playerHealth', { width: player.health + '%' })
  }
  if (dragon.isAttacking && dragon.framesCurrent === 0) {
    dragon.isAttacking = false
  }

  // ── Endgame Check ─────────────────────────────────────────────
  if (dragon.health <= 0 || player.health <= 0) {
    determineWinner({ player, dragon, timerId: gameTimerId })
  }
}

animate()

// ─── Keyboard Handlers ──────────────────────────────────────────
window.addEventListener('keydown', (event) => {
  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        player.velocity.y = -20
        break
      case ' ':
        player.attack()
        break
    }
  }
  if (!dragon.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        dragon.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        dragon.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        dragon.velocity.y = -20
        break
      case 'ArrowDown':
        dragon.attack()
        break
    }
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})
