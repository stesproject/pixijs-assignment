import * as PIXI from "pixi.js";

export class Button {
  public container: PIXI.Container;
  public onclick: () => void = () => {};

  private background: PIXI.Graphics;
  private label: PIXI.Text;
  private app: PIXI.Application;

  constructor(
    app: PIXI.Application,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Create background
    this.background = new PIXI.Graphics();
    this.drawBackground(0x4a90e2, width, height);

    // Create label
    this.label = new PIXI.Text(text, {
      fontSize: 20,
      fill: 0xffffff,
      fontFamily: "Arial",
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

    // Add event listeners
    this.container.on("pointerdown", this.onPointerDown.bind(this));
    this.container.on("pointerup", this.onPointerUp.bind(this));
    this.container.on("pointerover", this.onPointerOver.bind(this));
    this.container.on("pointerout", this.onPointerOut.bind(this));

    // Add to stage
    app.stage.addChild(this.container);
  }

  private drawBackground(color: number, width: number, height: number): void {
    this.background.clear();
    this.background.beginFill(color);
    this.background.drawRoundedRect(0, 0, width, height, 8);
    this.background.endFill();
  }

  private onPointerDown(): void {
    this.background.alpha = 0.8;
    this.container.scale.set(0.95);
  }

  private onPointerUp(): void {
    this.background.alpha = 1;
    this.container.scale.set(1);
    this.onclick();
  }

  private onPointerOver(): void {
    this.background.tint = 0xdddddd;
  }

  private onPointerOut(): void {
    this.background.tint = 0xffffff;
    this.background.alpha = 1;
    this.container.scale.set(1);
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
