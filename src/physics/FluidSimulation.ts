import { Droplet, SimulationParams, Vec3 } from './Droplet';

export class FluidSimulation {
  droplets: Droplet[] = [];
  params: SimulationParams;
  smoothingRadius = 40;
  targetDensity = 1;
  maxVelocity = 6;
  bounds: number;

  private _time = 0;

  constructor(count: number, params: SimulationParams, bounds = 400) {
    this.params = params;
    this.bounds = bounds;
    this.reset(count);
  }

  reset(count: number) {
    this.droplets = [];
    for (let i = 0; i < count; i++) {
      this.droplets.push(
        new Droplet(
          (Math.random() - 0.5) * this.bounds * 0.7,
          (Math.random() - 0.5) * this.bounds * 0.7,
          (Math.random() - 0.5) * this.bounds * 0.7,
        ),
      );
    }
    this._time = 0;
  }

  get time() {
    return this._time;
  }

  step(dt: number, mouseWorld?: Vec3) {
    this._time += dt;

    const r = this.smoothingRadius;
    const droplets = this.droplets;

    // Density and neighbors:
    for (let i = 0; i < droplets.length; i++) {
      const a = droplets[i];
      let density = 0;

      for (let j = 0; j < droplets.length; j++) {
        if (i === j) continue;
        const b = droplets[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dz = b.position.z - a.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < r) {
          const q = 1 - dist / r;
          density += b.mass * q * q;
        }
      }

      a.density = density;
      a.pressure = (density - this.targetDensity) * 0.5; // pressure factor
    }

    // Forces from pressure + viscosity blending (soft-body-like)
    for (let i = 0; i < droplets.length; i++) {
      const a = droplets[i];
      let fx = 0;
      let fy = 0;
      let fz = 0;

      for (let j = 0; j < droplets.length; j++) {
        if (i === j) continue;
        const b = droplets[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dz = b.position.z - a.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1e-3 || dist > r) continue;

        const q = 1 - dist / r;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const dirZ = dz / dist;

        // Pressure: pushes apart in dense regions
        const pressureForce = (a.pressure + b.pressure) * 0.5;
        fx -= dirX * pressureForce * q * this.params.surfaceTension;
        fy -= dirY * pressureForce * q * this.params.surfaceTension;
        fz -= dirZ * pressureForce * q * this.params.surfaceTension;

        // Viscosity blending (smooth velocities)
        const vxDiff = b.velocity.x - a.velocity.x;
        const vyDiff = b.velocity.y - a.velocity.y;
        const vzDiff = b.velocity.z - a.velocity.z;

        const viscScale = 0.12 * q;
        fx += vxDiff * viscScale;
        fy += vyDiff * viscScale;
        fz += vzDiff * viscScale;
      }

      a.velocity.x += fx * this.params.flowStrength * dt;
      a.velocity.y += fy * this.params.flowStrength * dt;
      a.velocity.z += fz * this.params.flowStrength * dt;

      // Clamp velocity
      const v2 = a.velocity.x * a.velocity.x + a.velocity.y * a.velocity.y + a.velocity.z * a.velocity.z;
      const maxV2 = this.maxVelocity * this.maxVelocity;
      if (v2 > maxV2) {
        const scale = this.maxVelocity / Math.sqrt(v2);
        a.velocity.x *= scale;
        a.velocity.y *= scale;
        a.velocity.z *= scale;
      }
    }

    // Integrate droplets (gravity, walls, mouse)
    for (const d of droplets) {
      d.update(dt, this.bounds, this.params, mouseWorld);
    }
  }
}
