// ui.js
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene", active: true });
  }

  preload() {
    this.load.image("inventorySlot", "assets/inventorySlot.png");
    this.load.image("emptySlot", "assets/inventorySlot.png");
    this.load.image("Pickaxe", "assets/war_axe1.png");
    this.load.image("Sword", "assets/long_sword1.png");
    this.load.image("Health Potion", "assets/health_potion.png");
  }
  create() {
    // Health bar
    this.healthBarBackground = this.add.graphics();
    this.healthBarBackground.fillStyle(0x000000, 1);
    this.healthBarBackground.fillRect(224, 564, 320, 4);
    this.healthBarBackground.setScrollFactor(0);

    this.healthBarFill = this.add.graphics();
    this.healthBarFill.setScrollFactor(0);
    this.invStartX = window.visualViewport.width < 800 ? 16 : 240;
    this.invStartY = window.visualViewport.width < 800 ? 16 : 584;
    this.healthBarY = window.visualViewport.width < 800 ? 16 : -20;
    this.updateHealthBar(100);
    this.inventoryBackground = [];
    for (let i = 0; i < 10; i++) {
      const icon = this.add.sprite(
        this.invStartX + i * 32,
        this.invStartY,
        "inventorySlot"
      );
      this.inventoryBackground.push(icon);
    }

    this.inventoryIcons = [];
    for (let i = 0; i < 10; i++) {
      const icon = this.add.sprite(
        this.invStartX + i * 32,
        this.invStartY,
        "emptySlot"
      );
      icon.setScrollFactor(0);
      icon.setInteractive();
      icon.on("pointerdown", () => {
        this.selectedItemIndex = i;
        this.updateInventorySelection();
      });
      this.inventoryIcons.push(icon);
    }

    // Selection indicator
    this.selectionRectangle = this.add.graphics();
    this.selectionRectangle.lineStyle(2, 0xffff00, 1);
    this.selectionRectangle.strokeRect(
      this.invStartX - 16,
      this.invStartY - 16,
      32,
      32
    );
    this.selectionRectangle.setScrollFactor(0);

    // Event listeners
    const gameScene = this.scene.get("MainGameScene");
    gameScene.events.on("updateStats", this.updateStats, this);
    gameScene.events.on("updateInventory", this.updateInventory, this);
    this.events.on("showInventoryModal", this.showInventoryModal, this);
  }

  updateHealthBar(currentHealth) {
    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(0xff0000, 1);
    const healthWidth = (currentHealth / 100) * 320;
    this.healthBarFill.fillRect(
      this.invStartX - 16,
      this.invStartY + this.healthBarY,
      healthWidth,
      4
    );
  }

  updateInventory(inventoryItems) {
    for (let i = 0; i < this.inventoryIcons.length; i++) {
      if (inventoryItems[i]) {
        const textureKey = inventoryItems[i].name;
        this.inventoryIcons[i].setTexture(textureKey);
      } else {
        this.inventoryIcons[i].setTexture("emptySlot");
      }
    }
    this.updateInventorySelection();
  }

  updateStats(playerStats) {
    this.updateHealthBar(playerStats.hp);
  }

  updateInventorySelection() {
    const x = this.invStartX + this.selectedItemIndex * 32 - 16;
    const y = this.invStartY - 16;
    this.selectionRectangle.clear();
    this.selectionRectangle.lineStyle(2, 0xffff00, 1);
    this.selectionRectangle.strokeRect(x, y, 32, 32);
  }

  showInventoryModal(inventoryItems) {
    this.modalContent.setText(
      "Inventory:\n" + inventoryItems.map((item) => item.name).join("\n")
    );
    this.modalContainer.setVisible(true);
    this.scene.pause("MainGameScene");
  }

  hideModal() {
    this.modalContainer.setVisible(false);
    this.scene.resume("MainGameScene");
  }
}
