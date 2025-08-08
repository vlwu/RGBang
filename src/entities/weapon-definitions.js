export const WEAPON_CONFIG = {
  gun_red: {
    name: "Fire Blaster",
    color: "red",
    fireRate: 0.2,
    bulletType: "fire_bullet",
    assetKey: "gun_1",
  },
  gun_blue: {
    name: "Ice Spiker",
    color: "blue",
    fireRate: 0.5,
    bulletType: "ice_bullet",
    assetKey: "gun_2",
  },
  gun_yellow: {
    name: "Lightning Rod",
    color: "yellow",
    fireRate: 0.4,
    bulletType: "lightning_bullet",
    assetKey: "gun_3",
  },
  // --- Secondary Weapons (initially locked) ---
  gun_purple: {
    name: "Void Ray",
    color: "purple",
    fireRate: 0.3,
    bulletType: "void_bullet",
    assetKey: "gun_6",
    combination: ['gun_red', 'gun_blue']
  },
  gun_green: {
    name: "Acid Spewer",
    color: "green",
    fireRate: 0.4,
    bulletType: "acid_bullet",
    assetKey: "gun_10",
    combination: ['gun_blue', 'gun_yellow']
  },
  gun_orange: {
    name: "Magma Cannon",
    color: "orange",
    fireRate: 0.25,
    bulletType: "magma_bullet",
    assetKey: "gun_12",
    combination: ['gun_red', 'gun_yellow']
  }
};