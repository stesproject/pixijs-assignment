import * as PIXI from "pixi.js";

interface DialogueLine {
  name: string;
  text: string;
}

interface Emoji {
  name: string;
  url: string;
}

interface Avatar {
  name: string;
  url: string;
  position: "left" | "right";
}

interface ApiResponse {
  dialogue: DialogueLine[];
  emojies: Emoji[];
  avatars: Avatar[];
}

interface TokenLayout {
  token: string;
  x: number;
  y: number;
  width: number;
  isEmoji: boolean;
}

export class MagicWords {
  private readonly INTERVAL_MS = 2000;
  
  private app: PIXI.Application;
  private container: PIXI.Container;
  private dialogueContainer: PIXI.Container;
  private emojiTextures: Record<string, PIXI.Texture> = {};
  private avatarTextures: Record<string, PIXI.Texture> = {};
  private dialogue: DialogueLine[] = [];
  private avatars: Avatar[] = [];
  private elapsed: number = 0;
  private currentIndex: number = 0;
  private previousHeight: number = 0;
  private overflow: boolean = false;
  private avatarNameIndex: Record<string, number> = {};
  private isAnimating: boolean = false;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);

    this.dialogueContainer = new PIXI.Container();
    this.container.addChild(this.dialogueContainer);
  }

  update(dt: number): void {
    if (!this.container.visible || !this.isAnimating) return;

    this.elapsed += dt * 1000; // Convert seconds to milliseconds

    if (this.elapsed >= this.INTERVAL_MS && this.currentIndex < this.dialogue.length) {
      this.showLine(this.currentIndex);
      this.currentIndex++;

      if (this.overflow) {
        this.clearDialogue();
      }

      this.elapsed = 0;
    }
  }

  async show() {
    this.container.visible = true;
    await this.loadData();
    this.startAnimation();
  }

  hide() {
    this.container.visible = false;
    this.reset();
  }

  resize(): void {
    // Re-render visible dialogue lines to adapt to new screen size
    if (this.container.visible && this.currentIndex > 0) {
      this.refreshDialogue();
    }
  }

  private async loadData() {
    try {
      const response = await fetch(
        "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords"
      );
      const data: ApiResponse = await response.json();

      this.dialogue = data.dialogue;
      this.avatars = this.prepareAvatars(data.avatars);
      this.buildAvatarIndex();

      await this.loadTextures(data.emojies, this.avatars);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  private prepareAvatars(avatars: Avatar[]): Avatar[] {
    // Add missing avatar for "Neighbour"
    return [
      ...avatars,
      {
        name: "Neighbour",
        url: avatars[0].url,
        position: "left" as const,
      },
    ];
  }

  private buildAvatarIndex() {
    this.avatars.forEach((avatar, index) => {
      this.avatarNameIndex[avatar.name] = index;
    });
  }

  private async loadTextures(emojis: Emoji[], avatars: Avatar[]) {
    this.emojiTextures = await this.loadAllTextures(emojis);
    this.avatarTextures = await this.loadAllTextures(avatars);
  }

  private loadTexture(
    name: string,
    url: string
  ): Promise<[string, PIXI.Texture]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const baseTexture = new PIXI.BaseTexture(img);
        const texture = new PIXI.Texture(baseTexture);
        resolve([name, texture]);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private async loadAllTextures(
    list: Array<{ name: string; url: string }>
  ): Promise<Record<string, PIXI.Texture>> {
    const entries = await Promise.all(
      list.map(({ name, url }) => this.loadTexture(name, url))
    );
    return Object.fromEntries(entries);
  }

  private layoutLine(
    text: string,
    style: PIXI.TextStyle,
    maxTextWidth: number,
    lineHeight: number
  ) {
    // Split into words & emoji placeholders
    const tokens = text.split(/(\{[^}]+\})/g).filter((t) => t !== "");

    // Measure each token
    const measurements = tokens.map((tok) => {
      if (/^\{[^}]+\}$/.test(tok)) {
        return { token: tok, width: 48, height: 48, isEmoji: true };
      } else {
        const textObj = new PIXI.Text(tok, style);
        const w = Math.min(textObj.width, maxTextWidth);
        const h = textObj.height;
        textObj.destroy();
        return { token: tok, width: w, height: h, isEmoji: false };
      }
    });

    // Layout tokens with line wrapping
    const layouts: TokenLayout[] = [];
    let cursorX = 0;
    let cursorY = 0;
    let maxLineWidth = 0;

    for (const m of measurements) {
      if (cursorX + m.width > maxTextWidth) {
        cursorX = 0;
        cursorY += lineHeight;
      }
      layouts.push({
        token: m.token,
        x: cursorX,
        y: cursorY,
        width: m.width,
        isEmoji: m.isEmoji,
      });
      cursorX += m.width;
      maxLineWidth = Math.max(maxLineWidth, cursorX);
    }

    const totalHeight = cursorY + lineHeight;
    return { layouts, totalWidth: maxLineWidth, totalHeight };
  }

  private showLine(index: number) {
    const avatarIndex = this.avatarNameIndex[this.dialogue[index].name];
    const avatar = this.avatars[avatarIndex];

    const scale = this.calculateScale();
    const marginX = 20 * scale;
    const padding = 12 * scale;
    const maxTextWidth = this.app.screen.width - marginX * 2;

    const style = this.createTextStyle(scale, maxTextWidth);
    const lineHeight = this.calculateLineHeight(style);

    const { layouts, totalWidth, totalHeight } = this.layoutLine(
      this.dialogue[index].text,
      style,
      maxTextWidth,
      lineHeight
    );

    const x0 = this.calculateBubbleX(avatar, totalWidth, padding, scale, marginX);
    const y0 = this.app.screen.height - totalHeight - padding * 2 - marginX;

    if (y0 - this.previousHeight < 100) {
      this.overflow = true;
    }

    const avatarSize = 64 * scale;
    this.renderAvatar(avatar, x0, y0, avatarSize, scale);
    this.renderBubble(avatar, x0, y0, totalWidth, totalHeight, padding, scale);
    this.renderContent(layouts, avatar, x0, y0, marginX, padding, lineHeight, scale, style);

    this.previousHeight += totalHeight + padding * 2 + marginX;
  }

  private calculateScale(): number {
    const baseWidth = 1024;
    return Math.max(0.5, this.app.screen.width / baseWidth);
  }

  private createTextStyle(scale: number, maxTextWidth: number): PIXI.TextStyle {
    return new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: Math.round(20 * scale),
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: maxTextWidth,
    });
  }

  private calculateLineHeight(style: PIXI.TextStyle): number {
    const fontSize = typeof style.fontSize === "number" 
      ? style.fontSize 
      : parseFloat(String(style.fontSize));
    return Math.round(fontSize * 2.2);
  }

  private calculateBubbleX(
    avatar: Avatar,
    totalWidth: number,
    padding: number,
    scale: number,
    marginX: number
  ): number {
    return avatar.position === "right"
      ? this.app.screen.width - (totalWidth + padding * 2 + 64 * scale)
      : marginX - padding;
  }

  private renderAvatar(avatar: Avatar, x0: number, y0: number, size: number, scale: number) {
    const avatarSprite = new PIXI.Sprite(this.avatarTextures[avatar.name]);
    avatarSprite.x = avatar.position === "right" ? this.app.screen.width - size : x0;
    avatarSprite.y = y0 - this.previousHeight;
    avatarSprite.width = size;
    avatarSprite.height = size;
    this.dialogueContainer.addChild(avatarSprite);

    const nameText = new PIXI.Text(avatar.name, new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    }));
    nameText.x = avatarSprite.x + avatarSprite.width / 2 - nameText.width / 2;
    nameText.y = avatarSprite.y + avatarSprite.height + 5;
    this.dialogueContainer.addChild(nameText);
  }

  private renderBubble(
    avatar: Avatar,
    x0: number,
    y0: number,
    totalWidth: number,
    totalHeight: number,
    padding: number,
    scale: number
  ) {
    const adjX = 70 * scale * (avatar.position === "right" ? -0.1 : 1);
    const bubble = new PIXI.Graphics();
    bubble.beginFill(0x000000, 0.6);
    bubble.lineStyle(2 * scale, 0xffffff, 0.8);
    bubble.drawRoundedRect(
      x0 + adjX,
      y0 - this.previousHeight,
      totalWidth + padding * 2,
      totalHeight + padding * 2,
      12 * scale
    );
    bubble.endFill();
    this.dialogueContainer.addChild(bubble);
  }

  private renderContent(
    layouts: TokenLayout[],
    avatar: Avatar,
    x0: number,
    y0: number,
    marginX: number,
    padding: number,
    lineHeight: number,
    scale: number,
    style: PIXI.TextStyle
  ) {
    const adjX = 70 * scale * (avatar.position === "right" ? -0.1 : 1);

    for (const item of layouts) {
      const drawX = avatar.position === "right"
        ? x0 + marginX + item.x + adjX
        : marginX + item.x + adjX;
      const drawY = y0 + padding + item.y - this.previousHeight;

      if (item.isEmoji) {
        this.renderEmoji(item, drawX, drawY, lineHeight);
      } else {
        this.renderText(item, drawX, drawY, style);
      }
    }
  }

  private renderEmoji(item: TokenLayout, x: number, y: number, lineHeight: number) {
    const key = item.token.slice(1, -1);
    const texture = this.emojiTextures[key];
    if (texture) {
      const sprite = new PIXI.Sprite(texture);
      sprite.width = sprite.height = 32;
      sprite.x = x + 8;
      sprite.y = y - (32 - lineHeight) / 2 - 8;
      this.dialogueContainer.addChild(sprite);
    }
  }

  private renderText(item: TokenLayout, x: number, y: number, style: PIXI.TextStyle) {
    const textObj = new PIXI.Text(item.token, style);
    textObj.x = x;
    textObj.y = y;
    this.dialogueContainer.addChild(textObj);
  }

  private startAnimation() {
    this.elapsed = 0;
    this.currentIndex = 0;
    this.previousHeight = 0;
    this.overflow = false;
    this.isAnimating = true;
  }

  private clearDialogue() {
    this.overflow = false;
    this.previousHeight = 0;
    this.dialogueContainer.removeChildren();
  }

  private reset() {
    this.dialogueContainer.removeChildren();
    this.elapsed = 0;
    this.currentIndex = 0;
    this.previousHeight = 0;
    this.overflow = false;
    this.isAnimating = false;
  }

  private refreshDialogue() {
    // Clear and re-render all visible dialogue lines
    this.dialogueContainer.removeChildren();
    this.previousHeight = 0;
    
    const linesToShow = this.currentIndex;
    for (let i = 0; i < linesToShow; i++) {
      this.showLine(i);
    }
  }
}
