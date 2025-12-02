import * as PIXI from "pixi.js";
import { Button } from "./components/Button";
import { AceOfShadows } from "./scenes/AceOfShadows";
import { MagicWords } from "./scenes/MagicWords";
import { PhoenixFlame } from "./scenes/PhoenixFlame";

// Create the application
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0xFFFFFF,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

// Add the view to the DOM
document.body.appendChild(app.view as HTMLCanvasElement);

// Create the main menu buttons
let button1 = new Button(app, "Ace of Shadows", 0, 0, 200, 50);
button1.onclick = () => {
  hideMainMenu();
  scene1.show();
  backButton.show();
};
let button2 = new Button(app, "Magic Words", 0, 0, 200, 50);
button2.onclick = () => {
  hideMainMenu();
  scene2.show();
  backButton.show();
};
let button3 = new Button(app, "Phoenix Flame", 0, 0, 200, 50);
button3.onclick = () => {
  hideMainMenu();
  scene3.show();
  backButton.show();
};
let backButton = new Button(app, "<", 20, 30, 40, 40);
backButton.onclick = () => {
  scene1.hide();
  scene2.hide();
  scene3.hide();
  backButton.hide();
  showMainMenu();
};
backButton.hide();

// Function to update positions on resize
const updateButtonPositions = () => {
  const centerX = app.screen.width / 2;
  const startY = app.screen.height / 2 - 100;
  
  button1.setPosition(centerX - 100, startY);
  button2.setPosition(centerX - 100, startY + 100);
  button3.setPosition(centerX - 100, startY + 200);
  backButton.setPosition(20, 30);
};

// Initial positioning
updateButtonPositions();

// Add resize listener
window.addEventListener('resize', () => {
  updateButtonPositions();
  scene1.resize();
  scene2.resize();
  scene3.resize();
});

// Helper functions for the main menu
let showMainMenu = () => {
  button1.show();
  button2.show();
  button3.show();
};
let hideMainMenu = () => {
  button1.hide();
  button2.hide();
  button3.hide();
};

// Initialize the scenes
let scene1 = new AceOfShadows(app);
let scene2 = new MagicWords(app);
let scene3 = new PhoenixFlame(app);

// Show the fps text
let fpsText = new PIXI.Text("FPS: 60", {
  fontFamily: "Courier",
  fontSize: 14,
  fill: 0xffffff,
  align: "center",
});
fpsText.x = 5;
fpsText.y = 3;
app.stage.addChild(fpsText);

// Main update function
let timer = 0;
app.ticker.add(() => {
  scene1.update(app.ticker.elapsedMS / 1000);
  scene2.update(app.ticker.elapsedMS / 1000);
  scene3.update(app.ticker.elapsedMS / 1000);
  timer += app.ticker.elapsedMS / 1000;
  // Avoid updating the fps text every frame
  if (timer >= 1.0) {
    fpsText.text = "FPS: " + app.ticker.FPS.toFixed();
    fpsText.updateText(true);
    timer = 0;
  }
});
