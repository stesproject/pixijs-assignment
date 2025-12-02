import * as PIXI from "pixi.js";

interface Particle {
  sprite: PIXI.Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class PhoenixFlame {
  private readonly app: PIXI.Application;
  private readonly container: PIXI.Container;
  private readonly particles: Particle[] = [];
  private readonly fireTextures: PIXI.Texture[] = [];

  private readonly MAX_PARTICLES = 10;
  private readonly SPAWN_RATE = 0.1;
  private readonly VELOCITY_MULTIPLIER = 60;
  private readonly MIN_SCALE = 0.25;
  private readonly MAX_SCALE = 0.5;
  private readonly MIN_LIFE = 1;
  private readonly MAX_LIFE = 2.5;
  private readonly HORIZONTAL_SPREAD = 50;
  private readonly SPAWN_Y_OFFSET = 100;

  private spawnTimer = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);

    this.init();
  }

  update(dt: number): void {
    this.updateSpawning(dt);
    this.updateParticles(dt);
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  resize(): void {
    this.centerContainer();
  }

  private async init(): Promise<void> {
    await this.loadFireTextures();
    this.centerContainer();
  }

  private async loadFireTextures(): Promise<void> {
    const fireTextureCount = 9;
    for (let i = 0; i < fireTextureCount; i++) {
      const texture = await PIXI.Assets.load(`/assets/fire/fire0${i}.png`);
      this.fireTextures.push(texture);
    }
  }

  private centerContainer(): void {
    this.container.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2
    );
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt;

    if (
      this.spawnTimer >= this.SPAWN_RATE &&
      this.particles.length < this.MAX_PARTICLES
    ) {
      this.spawnParticle();
      this.spawnTimer = 0;
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      this.updateParticlePosition(particle, dt);
      this.updateParticleLife(particle, dt);

      if (particle.life <= 0) {
        this.removeParticle(i);
      }
    }
  }

  private updateParticlePosition(particle: Particle, dt: number): void {
    particle.sprite.x += particle.vx * dt * this.VELOCITY_MULTIPLIER;
    particle.sprite.y += particle.vy * dt * this.VELOCITY_MULTIPLIER;
  }

  private updateParticleLife(particle: Particle, dt: number): void {
    particle.life -= dt;

    const lifeRatio = particle.life / particle.maxLife;
    particle.sprite.alpha = lifeRatio;
    particle.sprite.scale.set(this.MIN_SCALE + lifeRatio * this.MIN_SCALE);
  }

  private removeParticle(index: number): void {
    this.container.removeChild(this.particles[index].sprite);
    this.particles.splice(index, 1);
  }

  private spawnParticle(): void {
    if (this.fireTextures.length === 0) return;

    const sprite = this.createFireSprite();
    const particle = this.createParticle(sprite);

    this.positionSprite(sprite);
    this.container.addChild(sprite);
    this.particles.push(particle);
  }

  private createFireSprite(): PIXI.Sprite {
    const texture = this.getRandomTexture();
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);

    const scale =
      this.MIN_SCALE + Math.random() * (this.MAX_SCALE - this.MIN_SCALE);
    sprite.scale.set(scale);

    return sprite;
  }

  private getRandomTexture(): PIXI.Texture {
    const index = Math.floor(Math.random() * this.fireTextures.length);
    return this.fireTextures[index];
  }

  private createParticle(sprite: PIXI.Sprite): Particle {
    const life =
      this.MIN_LIFE + Math.random() * (this.MAX_LIFE - this.MIN_LIFE);

    return {
      sprite,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life,
      maxLife: life,
    };
  }

  private positionSprite(sprite: PIXI.Sprite): void {
    sprite.x = (Math.random() - 0.5) * this.HORIZONTAL_SPREAD;
    sprite.y = this.SPAWN_Y_OFFSET;
  }
}
