// js/network.js

class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.socket = window.socket;
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.socket.on('dungeonData', (dungeon) => {
      this.scene.dungeonData = dungeon;
      this.scene.createDungeon();
    });

    // Other socket events
  }
}

export default NetworkManager;
