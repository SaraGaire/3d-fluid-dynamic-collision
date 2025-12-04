export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SimulationParams {
  viscosity: number;
  surfaceTension: number;
  flowStrength: number;
  gravity: number;
  mouseAttraction: number;
  colorShiftSpeed: number;
  containerSize: number;
}

export class Droplet {
  position: Vec3;
  velocity: Vec3;
  radius: number;
  mass: number;
  baseHue: number;
  hueOffset: number;
  density = 1;
  pressure = 0;

  constructor(x: number, y: number, z: number) {
    this.position = { x, y, z };
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2,
    };
    this.radius = Math.random() * 6 + 3;
    this.mass = this.radius * this.radius;
    this.baseHue = Math.random() * 60 + 180;
    this.hueOffset = Math.random() * Math.PI * 2;
  }

  update(dt: number, bounds: number, params: SimulationParams, mouseWorld?: Vec3) {
    // Gravity
    this.velocity.y += params.gravity * dt;

    // Mouse attraction (soft force toward cursor)
    if (mouseWorld && params.mouseAttraction > 0) {
      const dx = mouseWorld.x - this.position.x;
      const dy = mouseWorld.y - this.position.y;
      const dz = mouseWorld.z - this.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq > 1) {
        const dist = Math.sqrt(distSq);
        const strength = (params.mouseAttraction * 80) / distSq;
        this.velocity.x += (dx / dist) * strength * dt;
        this.velocity.y += (dy / dist) * strength * dt;
        this.velocity.z += (dz / dist) * strength * dt;
      }
    }

    // Viscosity
    this.velocity.x *= params.viscosity;
    this.velocity.y *= params.viscosity;
    this.velocity.z *= params.viscosity;

    // Integrate
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;

    // Container walls (cube)
    const limit = bounds * 0.5;
    const damping = 0.6;

    if (this.position.x < -limit) {
      this.position.x = -limit;
      this.velocity.x *= -damping;
    }
    if (this.position.x > limit) {
      this.position.x = limit;
      this.velocity.x *= -damping;
    }

    if (this.position.y < -limit) {
      this.position.y = -limit;
      this.velocity.y *= -damping;
    }
    if (this.position.y > limit) {
      this.position.y = limit;
      this.velocity.y *= -damping;
    }

    if (this.position.z < -limit) {
      this.position.z = -limit;
      this.velocity.z *= -damping;
    }
    if (this.position.z > limit) {
      this.position.z = limit;
      this.velocity.z *= -damping;
    }
  }

  getHue(time: number, colorShiftSpeed: number): number {
    return (this.baseHue + Math.sin(time * colorShiftSpeed + this.hueOffset) * 40) % 360;
  }
}
