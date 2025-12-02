import * as PIXI from "pixi.js";

export class PhoenixFlame {
  private app: PIXI.Application;
  private container: PIXI.Container;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);

    this.init();
  }

  update(dt: number) {}

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

  resize() {}

  private init() {}
}
