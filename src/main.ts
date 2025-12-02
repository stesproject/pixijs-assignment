import * as PIXI from "pixi.js";
import { Button } from "./components/Button";
import { AceOfShadows } from "./scenes/AceOfShadows";
import { MagicWords } from "./scenes/MagicWords";
import { PhoenixFlame } from "./scenes/PhoenixFlame";

// Constants
const BUTTON_CONFIG = {
  WIDTH: 200,
  HEIGHT: 50,
  SPACING: 100,
  OFFSET_Y: 100,
} as const;

const BACK_BUTTON_CONFIG = {
  WIDTH: 40,
  HEIGHT: 40,
  X: 20,
  Y: 30,
} as const;

const FPS_CONFIG = {
  UPDATE_INTERVAL: 1.0,
  FONT_SIZE: 14,
  PADDING_X: 5,
  PADDING_Y: 3,
} as const;

const MS_TO_SECONDS = 1000;

// Create the application
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0xffffff,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

// Add the view to the DOM
document.body.appendChild(app.view as HTMLCanvasElement);

// Initialize the scenes
const scenes = {
  aceOfShadows: new AceOfShadows(app),
  magicWords: new MagicWords(app),
  phoenixFlame: new PhoenixFlame(app),
};

// Helper functions for the main menu
const menuButtons: Button[] = [];

const showMainMenu = (): void => {
  menuButtons.forEach((button) => button.show());
};

const hideMainMenu = (): void => {
  menuButtons.forEach((button) => button.hide());
};

const hideAllScenes = (): void => {
  Object.values(scenes).forEach((scene) => scene.hide());
};

// Create back button
const backButton = new Button(
  app,
  "<",
  BACK_BUTTON_CONFIG.X,
  BACK_BUTTON_CONFIG.Y,
  BACK_BUTTON_CONFIG.WIDTH,
  BACK_BUTTON_CONFIG.HEIGHT
);
backButton.onclick = () => {
  hideAllScenes();
  backButton.hide();
  showMainMenu();
};
backButton.hide();

// Create menu buttons
const createMenuButton = (
  text: string,
  scene: AceOfShadows | MagicWords | PhoenixFlame
): Button => {
  const button = new Button(app, text, 0, 0, BUTTON_CONFIG.WIDTH, BUTTON_CONFIG.HEIGHT);
  button.onclick = () => {
    hideMainMenu();
    scene.show();
    backButton.show();
  };
  menuButtons.push(button);
  return button;
};

const button1 = createMenuButton("Ace of Shadows", scenes.aceOfShadows);
const button2 = createMenuButton("Magic Words", scenes.magicWords);
const button3 = createMenuButton("Phoenix Flame", scenes.phoenixFlame);

// Function to update positions on resize
const updateButtonPositions = (): void => {
  const centerX = app.screen.width / 2;
  const startY = app.screen.height / 2 - BUTTON_CONFIG.OFFSET_Y;

  button1.setPosition(centerX - BUTTON_CONFIG.WIDTH / 2, startY);
  button2.setPosition(centerX - BUTTON_CONFIG.WIDTH / 2, startY + BUTTON_CONFIG.SPACING);
  button3.setPosition(centerX - BUTTON_CONFIG.WIDTH / 2, startY + BUTTON_CONFIG.SPACING * 2);
  backButton.setPosition(BACK_BUTTON_CONFIG.X, BACK_BUTTON_CONFIG.Y);
};

// Initial positioning
updateButtonPositions();

// Add resize listener
window.addEventListener("resize", () => {
  updateButtonPositions();
  Object.values(scenes).forEach((scene) => scene.resize());
});

// Create FPS display
const fpsText = new PIXI.Text("FPS: 60", {
  fontFamily: "Courier",
  fontSize: FPS_CONFIG.FONT_SIZE,
  fill: 0x000000,
  align: "center",
});
fpsText.x = FPS_CONFIG.PADDING_X;
fpsText.y = FPS_CONFIG.PADDING_Y;
app.stage.addChild(fpsText);

// Main update function
let fpsTimer = 0;

app.ticker.add(() => {
  const deltaTime = app.ticker.elapsedMS / MS_TO_SECONDS;

  // Update all scenes
  Object.values(scenes).forEach((scene) => scene.update(deltaTime));

  // Update FPS display periodically to avoid performance impact
  fpsTimer += deltaTime;
  if (fpsTimer >= FPS_CONFIG.UPDATE_INTERVAL) {
    fpsText.text = `FPS: ${app.ticker.FPS.toFixed()}`;
    fpsText.updateText(true);
    fpsTimer = 0;
  }
});
