import * as PIXI from "pixi.js";

interface CardAnimation {
  idx: number;
  t: number;
}

interface CardPosition {
  x: number;
  y: number;
  rot: number;
}

export class AceOfShadows {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private cards: PIXI.Sprite[] = [];
  private isAnimating: boolean = false;

  // Animation variables
  private currentCardIndex: number = 0;
  private elapsed: number = 0;
  private cardAnimations: CardAnimation[] = [];
  private initialPositions: CardPosition[] = [];

  // Constants
  private readonly CARD_WIDTH = 64;
  private readonly CARD_HEIGHT = 64;
  private readonly CARDS_PER_ROW = 14;
  private readonly CARDS_TILES = 56;
  private readonly TOTAL_CARDS = 144;
  private readonly ANIMATION_DURATION = 2000;
  private readonly THROW_DURATION = 1000;
  private readonly ROTATION_ADJUSTMENT = 0.1;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);
  }

  update(dt: number): void {
    if (!this.container.visible || !this.isAnimating) return;
    this.animate(dt * 1000); // Convert seconds to milliseconds
  }

  async show() {
    this.container.visible = true;
    if (!this.isAnimating) {
      await this.init();
    }
  }

  hide() {
    this.container.visible = false;
    this.isAnimating = false;
  }

  resize() {}

  private async init() {
    // Clear any previous content
    this.container.removeChildren();

    // Reset animation state
    this.currentCardIndex = this.TOTAL_CARDS - 1;
    this.elapsed = 0;
    this.cardAnimations = [];
    this.initialPositions = [];
    this.cards = [];
    this.isAnimating = true;

    // Load the texture
    let sheet: PIXI.Texture;
    try {
      sheet = await PIXI.Assets.load("/assets/cards.png");
    } catch (error) {
      console.error("Failed to load spritesheet", error);
      return;
    }

    // Generate cards
    this.generateCards(sheet);

    // Initialize cards in stacked position
    this.initCards();
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private generateCards(sheet: PIXI.Texture) {
    const spriteIndices = Array.from({ length: this.CARDS_TILES }, (_, i) => i);

    // Triple the array and take only what we need for totalCards
    const tripled = [...spriteIndices, ...spriteIndices, ...spriteIndices];
    const validSpriteIndexes = this.shuffleArray(
      tripled.slice(0, this.TOTAL_CARDS)
    );

    for (let i = 0; i < this.TOTAL_CARDS; i++) {
      const spriteIndex = validSpriteIndexes[i];
      const spriteX = spriteIndex % this.CARDS_PER_ROW;
      const spriteY = Math.floor(spriteIndex / this.CARDS_PER_ROW);

      const frame = new PIXI.Rectangle(
        spriteX * this.CARD_WIDTH,
        spriteY * this.CARD_HEIGHT,
        this.CARD_WIDTH,
        this.CARD_HEIGHT
      );

      const cardTexture = new PIXI.Texture(sheet.baseTexture, frame);
      const card = new PIXI.Sprite(cardTexture);
      this.cards.push(card);
    }
  }

  private initCards() {
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height * 0.5;

    for (let i = 0; i < this.TOTAL_CARDS; i++) {
      const card = this.cards[i];

      card.scale.set(1.0);
      card.anchor.set(0.5, 1.0);

      // Stack cards with minimal offset to create depth effect
      const offsetX = i / (this.TOTAL_CARDS - 1);
      const offsetY = i / (this.TOTAL_CARDS - 1);
      card.position.set(centerX + offsetX, centerY + offsetY);
      card.rotation = Math.PI;

      this.container.addChild(card);

      // Store initial position for animation
      this.initialPositions[i] = {
        x: card.x,
        y: card.y,
        rot: card.rotation,
      };
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private animate(deltaMS: number) {
    // Update throw timer
    this.elapsed += deltaMS;
    const throwProgress = Math.min(this.elapsed / this.THROW_DURATION, 1);

    const targetPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.2,
      rot: Math.PI,
    };

    // Animate all active cards
    for (let j = this.cardAnimations.length - 1; j >= 0; j--) {
      const anim = this.cardAnimations[j];
      const card = this.cards[anim.idx];
      const initialPos = this.initialPositions[anim.idx];

      if (!card) continue;

      anim.t += deltaMS;

      // Calculate animation progress (0 to 1)
      const animProgress = Math.min(anim.t / this.ANIMATION_DURATION, 1);

      // Apply rotation adjustment based on card position in throw sequence
      const rotationAdjustment =
        this.ROTATION_ADJUSTMENT * (this.TOTAL_CARDS - this.currentCardIndex);
      const targetRotation =
        targetPosition.rot + (rotationAdjustment * Math.PI) / 180;

      // Interpolate position and rotation
      card.y = this.lerp(initialPos.y, targetPosition.y, animProgress);
      card.rotation = this.lerp(initialPos.rot, targetRotation, animProgress);

      // When animation completes, reorder card in container
      if (animProgress === 1) {
        if (card.parent === this.container) {
          const targetIndex = Math.max(
            0,
            this.container.children.length - 1 - anim.idx
          );
          this.container.setChildIndex(card, targetIndex);
        }

        // Remove completed animation
        this.cardAnimations.splice(j, 1);
      }
    }

    // Start next card throw when timer completes
    if (throwProgress === 1 && this.currentCardIndex >= 0) {
      this.currentCardIndex--;
      this.elapsed = 0;

      this.cardAnimations.push({ idx: this.currentCardIndex + 1, t: 0 });
    }
  }
}
