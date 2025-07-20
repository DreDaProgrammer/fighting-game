// classes.js
class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    orientation = 'horizontal' // new: 'horizontal' or 'vertical'
  }) {
    this.position = position
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.offset = offset
    this.orientation = orientation

    this.image = new Image()
    this.image.src = imageSrc
  }

  draw() {
    let cropW, cropH, cropX, cropY

    if (this.orientation === 'vertical') {
      // vertical strip: frames stacked top→down
      cropW = this.image.width
      cropH = this.image.height / this.framesMax
      cropX = 0
      cropY = this.framesCurrent * cropH
    } else {
      // horizontal strip: frames laid left→right
      cropW = this.image.width / this.framesMax
      cropH = this.image.height
      cropX = this.framesCurrent * cropW
      cropY = 0
    }

    c.drawImage(
      this.image,
      cropX,
      cropY,
      cropW,
      cropH,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      cropW * this.scale,
      cropH * this.scale
    )
  }

  animateFrames() {
    this.framesElapsed++
    if (this.framesElapsed % this.framesHold === 0) {
      this.framesCurrent =
        this.framesCurrent < this.framesMax - 1 ? this.framesCurrent + 1 : 0
    }
  }

  update() {
    this.draw()
    this.animateFrames()
  }
}

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined }
  }) {
    super({ position, imageSrc, scale, framesMax, offset })

    this.velocity = velocity
    this.width = 50
    this.height = 150
    this.lastKey
    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    }
    this.color = color
    this.isAttacking = false
    this.health = 100
    this.sprites = sprites
    this.dead = false

    // preload each sprite image & default its orientation
    for (const key in this.sprites) {
      const s = this.sprites[key]
      s.image = new Image()
      s.image.src = s.imageSrc
      s.orientation = s.orientation || 'horizontal'
    }
  }

  update() {
    this.draw()
    if (!this.dead) this.animateFrames()

    // update attackBox position
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // gravity
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
    } else {
      this.velocity.y += gravity
    }
  }

  attack() {
    this.switchSprite('attack1')
    this.isAttacking = true
  }

  takeHit() {
    this.health -= 20
    if (this.health <= 0) this.switchSprite('death')
    else this.switchSprite('takeHit')
  }

  switchSprite(sprite) {
    // if dead animation has finished, lock it
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true
      return
    }

    // override attack
    if (
      this.image === this.sprites.attack1.image &&
      this.framesCurrent < this.sprites.attack1.framesMax - 1
    )
      return

    // override takeHit
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return

    // switch cases
    if (this.sprites[sprite]) {
      const s = this.sprites[sprite]
      if (this.image !== s.image) {
        this.image = s.image
        this.framesMax = s.framesMax
        this.orientation = s.orientation // ← propagate orientation here!
        this.framesCurrent = 0
      }
    }
  }
}
