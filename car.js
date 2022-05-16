// Different control types for cars
const ControlType = {
  KEYBOARD: 'keyboard',
  ML: 'ml',
  DUMMY: 'dummy'
};

const DamageCause = {
  COLLISION: 'collision',
  STUCK: 'stuck',
};

Object.freeze(ControlType); // We want this is be immutable like an enum
Object.freeze(DamageCause);

class Car {
  constructor(x, y, width, height, controlType = ControlType.DUMMY, maxSpeed = 3) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.controlType = controlType;
    this.speed = 0;
    this.avgSpeed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.angle = 0;
    this.damaged = false;
    this.damageCause = null;
    this.updateCycles = 0;

    this.useBrain = controlType === ControlType.ML;

    if (controlType !== ControlType.DUMMY) {
      this.sensor = new Sensor(this);
      this.brain = new NeuralNetwork(
        [this.sensor.rayCount, 6, 4]
      );
    }
    this.controls = new Controls(controlType);
  }

  update(roadBorders, traffic) {
    if (!this.damaged) {
      this.updateCycles++;
      this.#move();
      this.polygon = this.#createPolygon();
      if (this.#assessDamage(roadBorders, traffic)) {
        this.damaged = true;
        this.damageCause = DamageCause.COLLISION;
      }
      this.avgSpeed = (this.avgSpeed * (this.updateCycles - 1) + Math.abs(this.speed)) / this.updateCycles; // Approx. running average
      if ((this.updateCycles % 500 === 0) && (this.controlType !== ControlType.DUMMY)) { // Every 500 cycles, we make sure cars are not stuck. Dummy cars are not affected
        console.log("Average speed: " + this.avgSpeed);
        if (this.avgSpeed < (this.maxSpeed * 0.8)) {
          this.damaged = true;
          this.damageCause = DamageCause.STUCK;
        }
      }
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
      const offsets = this.sensor.readings.map(
        s => s == null ? 0 : 1 - s.offset
      );
      const outputs = NeuralNetwork.feedForward(offsets, this.brain);
      //console.log(outputs);

      if (this.useBrain) {
        this.controls.forward = outputs[0];
        this.controls.left = outputs[1];
        this.controls.right = outputs[2];
        this.controls.reverse = outputs[3];
      }
    }
  }

  #assessDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (polysIntersect(this.polygon, traffic[i].polygon)) {
        return true;
      }
    }
    return false;
  }

  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
    });
    return points;
  }

  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed += this.friction;
    }

    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }

    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.controls.left) {
        this.angle += 0.03 * flip;
      }
      if (this.controls.right) {
        this.angle -= 0.03 * flip;
      }
    }

    this.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  draw(ctx, color, drawSensor = false) {
    if (this.damaged) {
      switch (this.damageCause) {
        default:
        case DamageCause.COLLISION:
          ctx.fillStyle = '#596475';
          break;
        case DamageCause.STUCK:
          ctx.fillStyle = '#cf8600';
          break;
      }
    } else {
      ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }
    ctx.fill();

    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }
  }
}