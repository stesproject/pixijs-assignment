import * as PIXI from "pixi.js";

// Style constants
const BUTTON_COLORS = {
  NORMAL: 0x4a90e2,
  HOVER: 0xdddddd,
  DEFAULT_TINT: 0xffffff,
  TEXT: 0xffffff,
} as const;

const BUTTON_STYLES = {
  BORDER_RADIUS: 8,
  FONT_SIZE: 20,
  FONT_FAMILY: "Arial",
} as const;

const INTERACTION_STATES = {
  PRESSED_ALPHA: 0.8,
  PRESSED_SCALE: 0.95,
  NORMAL_ALPHA: 1,
  NORMAL_SCALE: 1,
} as const;

export class Button {
  public container: PIXI.Container;
  public onclick: () => void = () => {};

  private background: PIXI.Graphics;
  private label: PIXI.Text;
  private width: number;
  private height: number;

  constructor(
    app: PIXI.Application,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.width = width;
    this.height = height;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create background
    this.background = new PIXI.Graphics();
    this.drawBackground(BUTTON_COLORS.NORMAL, width, height);

    // Create label
    this.label = new PIXI.Text(text, {
      fontSize: BUTTON_STYLES.FONT_SIZE,
      fill: BUTTON_COLORS.TEXT,
      fontFamily: BUTTON_STYLES.FONT_FAMILY,
      align: "center",
    });
    this.label.anchor.set(0.5);
    this.label.x = width / 2;
    this.label.y = height / 2;

    // Add to container
    this.container.addChild(this.background);
    this.container.addChild(this.label);

    // Make interactive
    this.container.eventMode = "static";
    this.container.cursor = "pointer";

    // Add event listeners with arrow functions to avoid binding
    this.container.on("pointerdown", this.onPointerDown);
    this.container.on("pointerup", this.onPointerUp);
    this.container.on("pointerover", this.onPointerOver);
    this.container.on("pointerout", this.onPointerOut);

    // Add to stage
    app.stage.addChild(this.container);
  }

  private drawBackground(color: number, width: number, height: number): void {
    this.background.clear();
    this.background.beginFill(color);
    this.background.drawRoundedRect(0, 0, width, height, BUTTON_STYLES.BORDER_RADIUS);
    this.background.endFill();
  }

  private onPointerDown = (): void => {
    this.background.alpha = INTERACTION_STATES.PRESSED_ALPHA;
    this.container.scale.set(INTERACTION_STATES.PRESSED_SCALE);
  };

  private onPointerUp = (): void => {
    this.background.alpha = INTERACTION_STATES.NORMAL_ALPHA;
    this.container.scale.set(INTERACTION_STATES.NORMAL_SCALE);
    this.onclick();
  };

  private onPointerOver = (): void => {
    this.background.tint = BUTTON_COLORS.HOVER;
  };

  private onPointerOut = (): void => {
    this.background.tint = BUTTON_COLORS.DEFAULT_TINT;
    this.background.alpha = INTERACTION_STATES.NORMAL_ALPHA;
    this.container.scale.set(INTERACTION_STATES.NORMAL_SCALE);
  };

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
