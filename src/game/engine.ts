import * as THREE from 'three';
import { GameMap, MapBlock, WeaponConfig, PlayerLoadout, GameSettings, KillFeedItem, GameMode, PlayerTeam, TeamScores, WeatherInfo, WeatherType, MatchHighlight, PlayerCombatEvent, AntiCheatAnomaly, AnomalyType, AnomalySeverity } from '../types';
import { WEAPONS, CHARACTER_SKINS, WEAPON_SKINS } from '../data/constants';
import { sound } from './audio';
import { getWeatherConfig } from './weather';
import { generateMatchHighlights } from './highlights';

export interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  z: number;
  damage: number;
  isHeadshot: boolean;
  opacity: number;
  velocity: THREE.Vector3;
}

export interface BotPlayer {
  id: string;
  name: string;
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  weaponMesh: THREE.Group;
  badgeMesh?: THREE.Mesh;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  shootCooldown: number;
  isAlive: boolean;
  respawnTimer: number;
  color: string;
  team: PlayerTeam;
  weaponId: string;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
}

export class FPSGameEngine {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Viewmodel (arms + gun)
  private viewmodelScene: THREE.Scene;
  private viewmodelCamera: THREE.PerspectiveCamera;
  private gunGroup: THREE.Group;
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashMesh: THREE.Mesh;

  // Map & Physics geometry
  private map: GameMap;
  private colliders: { box: THREE.Box3; type: string; block: MapBlock }[] = [];
  private healthPackMeshes: { mesh: THREE.Group; block: MapBlock; active: boolean; respawnTime: number }[] = [];
  private jumpPadMeshes: THREE.Mesh[] = [];
  private speedGateMeshes: THREE.Mesh[] = [];

  // Player state
  public playerHealth = 100;
  public maxPlayerHealth = 100;
  public playerShield = 50;
  public maxPlayerShield = 50;
  public isPlayerAlive = true;
  public playerPosition = new THREE.Vector3(0, 3, 0);
  public playerVelocity = new THREE.Vector3(0, 0, 0);
  private cameraPitch = 0;
  private cameraYaw = 0;
  private isPointerLocked = false;

  // Movement & Parkour flags
  public isGrounded = false;
  public isSprinting = false;
  public isSliding = false;
  public slideTimer = 0;
  public isWallRunning = false;
  public wallNormal = new THREE.Vector3();
  public wallRunSide: 'left' | 'right' | null = null;
  public speedBoostTimer = 0;
  public momentumMultiplier = 1.0;
  private currentCameraHeight = 1.7;
  private targetCameraHeight = 1.7;

  // Combat state
  public loadout: PlayerLoadout;
  public currentWeapon: WeaponConfig;
  public currentAmmo: number;
  public isReloading = false;
  public reloadProgress = 0;
  public isAiming = false;
  private shootCooldown = 0;
  public hitmarkerActive = false;
  public hitmarkerIsHeadshot = false;
  public hitmarkerTimer = 0;
  public damageDirectionAngle: number | null = null;
  public damageVignetteTimer = 0;
  public killstreak = 0;
  public playerKills = 0;
  public playerDeaths = 0;
  public playerHeadshots = 0;
  public parkourDistanceMeters = 0;
  public slideKillsCount = 0;

  // Gun bobbing and sway
  private weaponSway = new THREE.Vector2(0, 0);
  private targetWeaponSway = new THREE.Vector2(0, 0);
  private bobTime = 0;
  private gunRecoilKick = 0;

  // Weapon inspection animation state
  public isInspecting = false;
  public inspectTime = 0;
  public readonly inspectDuration = 3.2; // 3.2s full inspection cycle
  public inspectWeight = 0; // 0 to 1 smooth blend factor

  // Bots & Multiplayer
  public bots: BotPlayer[] = [];
  public killFeed: KillFeedItem[] = [];
  public floatingDamages: FloatingDamage[] = [];

  // Settings & Input
  public settings: GameSettings;
  private keys: Record<string, boolean> = {};
  private isMouseDown = false;
  private isRightMouseDown = false;
  private lastFrameTime = performance.now();
  private animationFrameId: number | null = null;

  // Callbacks to UI
  public onStateUpdate?: () => void;
  public onKill?: (victim: string, isHeadshot: boolean, weapon: string) => void;
  public onPlayerDeath?: (killer: string) => void;
  public onMatchEnd?: (winner: string, highlights: MatchHighlight[]) => void;
  public onAntiCheatAnomaly?: (anomaly: AntiCheatAnomaly) => void;

  // Anti-cheat Telemetry & Anomaly Listeners
  private antiCheatListeners: Array<(anomaly: AntiCheatAnomaly) => void> = [];
  private lastPositionCheck = new THREE.Vector3();
  private spawnProtectionTimer = 2.0;
  private jumpPadBuffTimer = 0;
  private consecutiveHighVelocityFrames = 0;
  private lastVelocityAnomalyTime = 0;
  private lastSnapAimAnomalyTime = 0;
  private lastAimTimestamp = performance.now();
  private preShotAimSnapshot = { yaw: 0, pitch: 0, timestamp: performance.now() };

  public combatEvents: PlayerCombatEvent[] = [];
  public matchInitialDuration = 300;
  public matchTimer = 300; // 5 minutes match
  public matchActive = true;
  public gameMode: GameMode = 'ffa';
  public playerTeam: PlayerTeam = 'blue';
  public teamScores: TeamScores = { red: 0, blue: 0 };
  public teamTargetScore: number = 25;
  private spawnPoints: THREE.Vector3[] = [];

  // Dynamic Weather State
  public weather: WeatherInfo;
  private weatherParticles: THREE.Points | null = null;
  private weatherPositions: Float32Array | null = null;
  private weatherVelocities: Float32Array | null = null;
  private lightningTimer: number = 0;
  private lightningDuration: number = 0;
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private cyanAccentLight: THREE.PointLight | null = null;
  private pinkAccentLight: THREE.PointLight | null = null;
  private baseSunIntensity: number = 1.0;
  private baseAmbientIntensity: number = 0.8;
  private weatherTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    map: GameMap,
    loadout: PlayerLoadout,
    settings: GameSettings,
    mode: GameMode = 'ffa',
    playerTeam: PlayerTeam = 'blue',
    weatherType?: WeatherType | 'random'
  ) {
    this.canvas = canvas;
    this.map = map;
    this.loadout = loadout;
    this.settings = settings;
    this.gameMode = mode;
    this.playerTeam = playerTeam;
    this.teamScores = { red: 0, blue: 0 };
    this.currentWeapon = WEAPONS[loadout.primaryWeapon] || WEAPONS.scar;
    this.currentAmmo = this.currentWeapon.magSize;

    // Resolve weather for this match
    const chosenWeather = weatherType || map.weather || 'random';
    this.weather = getWeatherConfig(chosenWeather);

    // 1. Setup Three.js Main Scene with weather palette & fog
    this.scene = new THREE.Scene();
    const skyColor = settings.darkMode ? this.weather.skyColorDark : this.weather.skyColor;
    const fogColor = settings.darkMode ? this.weather.fogColorDark : this.weather.fogColor;
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, this.weather.fogDensity);

    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(settings.fov, aspect, 0.1, 500);
    this.camera.position.set(0, 3, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1.2));
    this.renderer.autoClear = false;

    // 2. Setup Viewmodel Scene (for gun rendering in front)
    this.viewmodelScene = new THREE.Scene();
    this.viewmodelCamera = new THREE.PerspectiveCamera(settings.fov * 0.8, aspect, 0.01, 10);

    // 3. Dynamic Weather Lighting & Particle Volume
    this.setupLighting();
    this.setupWeatherParticles();

    // 4. Build Gun Model
    this.gunGroup = new THREE.Group();
    const muzzleLight = new THREE.PointLight(0xffaa22, 0, 8);
    this.muzzleFlashLight = muzzleLight;
    const muzzleGeo = new THREE.DodecahedronGeometry(0.06);
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 });
    this.muzzleFlashMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
    this.buildWeaponModel();
    this.viewmodelScene.add(this.gunGroup);

    // 5. Build Map
    this.buildMap(this.map);

    // 6. Spawn Bots
    this.initBots();

    // 7. Spawn Player
    this.respawnPlayer();

    // 8. Event Listeners
    this.bindEvents();

    // 9. Start Loop
    this.startLoop();
  }

  private setupLighting() {
    this.baseAmbientIntensity = this.weather.ambientIntensity;
    this.ambientLight = new THREE.AmbientLight(this.weather.ambientColor, this.baseAmbientIntensity);
    this.scene.add(this.ambientLight);

    this.baseSunIntensity = this.weather.sunIntensity;
    this.sunLight = new THREE.DirectionalLight(this.weather.sunColor, this.baseSunIntensity);
    this.sunLight.position.set(...this.weather.sunPosition);
    this.scene.add(this.sunLight);

    // Neon accent lights in main arena with dynamic weather responsiveness
    const cyanIntensity = this.weather.pulseNeon ? 3.5 : 2;
    const pinkIntensity = this.weather.pulseNeon ? 3.5 : 2;
    this.cyanAccentLight = new THREE.PointLight(this.weather.pulseNeon ? 0x06b6d4 : 0x38bdf8, cyanIntensity, 45);
    this.cyanAccentLight.position.set(-20, 8, -20);
    this.scene.add(this.cyanAccentLight);

    this.pinkAccentLight = new THREE.PointLight(this.weather.pulseNeon ? 0xf43f5e : 0xec4899, pinkIntensity, 45);
    this.pinkAccentLight.position.set(20, 8, 20);
    this.scene.add(this.pinkAccentLight);

    // Viewmodel lighting
    const vmLight = new THREE.DirectionalLight(0xffffff, 1.4);
    vmLight.position.set(1, 2, 1);
    this.viewmodelScene.add(vmLight);
    const vmAmber = new THREE.AmbientLight(0xffffff, 0.9);
    this.viewmodelScene.add(vmAmber);
  }

  private setupWeatherParticles() {
    const count = this.weather.particleCount;
    if (count <= 0) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const spreadX = 70;
    const spreadY = 40;
    const spreadZ = 70;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * spreadX;
      positions[idx + 1] = Math.random() * spreadY;
      positions[idx + 2] = (Math.random() - 0.5) * spreadZ;

      velocities[idx] = this.weather.particleSpeedX * (0.8 + Math.random() * 0.4);
      velocities[idx + 1] = this.weather.particleSpeedY * (0.8 + Math.random() * 0.4);
      velocities[idx + 2] = this.weather.particleSpeedZ * (0.8 + Math.random() * 0.4);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.weatherPositions = positions;
    this.weatherVelocities = velocities;

    const material = new THREE.PointsMaterial({
      color: this.weather.particleColor,
      size: this.weather.particleSize,
      transparent: true,
      opacity: this.weather.type === 'storm' ? 0.75 : 0.85,
      depthWrite: false,
      blending: this.weather.type === 'cyber_fog' ? THREE.AdditiveBlending : THREE.NormalBlending
    });

    this.weatherParticles = new THREE.Points(geometry, material);
    this.scene.add(this.weatherParticles);

    if (this.weather.hasLightning) {
      this.lightningTimer = 5 + Math.random() * 7;
    }
  }

  public updateLoadout(loadout: PlayerLoadout) {
    this.loadout = loadout;
    this.currentWeapon = WEAPONS[loadout.primaryWeapon] || WEAPONS.scar;
    this.currentAmmo = this.currentWeapon.magSize;
    this.isInspecting = false;
    this.inspectTime = 0;
    this.inspectWeight = 0;
    this.buildWeaponModel();
  }

  public updateSettings(settings: GameSettings) {
    this.settings = settings;
    this.camera.fov = settings.fov;
    this.camera.updateProjectionMatrix();
    sound.setVolumes(settings.masterVolume, settings.sfxVolume);
    if (this.scene) {
      const skyColor = settings.darkMode ? this.weather.skyColorDark : this.weather.skyColor;
      const fogColor = settings.darkMode ? this.weather.fogColorDark : this.weather.fogColor;
      this.scene.background = new THREE.Color(skyColor);
      this.scene.fog = new THREE.FogExp2(fogColor, this.weather.fogDensity);
    }
  }

  private buildWeaponModel() {
    // Clear existing gun
    while (this.gunGroup.children.length > 0) {
      this.gunGroup.remove(this.gunGroup.children[0]);
    }

    const skin = WEAPON_SKINS.find(s => s.id === this.loadout.weaponSkinId);
    const pColor = skin ? skin.primaryColor : '#334155';
    const sColor = skin ? skin.secondaryColor : '#64748b';

    const bodyMat = new THREE.MeshStandardMaterial({
      color: pColor,
      roughness: 0.35,
      metalness: 0.7
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: sColor,
      roughness: 0.25,
      metalness: 0.8,
      emissive: skin?.glow ? sColor : '#000000',
      emissiveIntensity: skin?.glow ? 0.4 : 0
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });

    const wId = this.currentWeapon.id;

    if (wId === 'sniper') {
      // Long barrel sniper
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), bodyMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.65);

      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.35, 8), darkMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.11, -0.05);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.3), accentMat);
      stock.position.set(0, -0.04, 0.35);

      this.gunGroup.add(body, barrel, scope, stock);
      this.muzzleFlashLight.position.set(0, 0.02, -1.05);
      this.muzzleFlashMesh.position.set(0, 0.02, -1.05);
    } else if (wId === 'shotgun') {
      // Chunky pump shotgun
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.45), bodyMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.45);

      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), accentMat);
      pump.position.set(0, -0.04, -0.35);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1), darkMat);
      grip.rotation.x = 0.25;
      grip.position.set(0, -0.14, 0.15);

      this.gunGroup.add(receiver, barrel, pump, grip);
      this.muzzleFlashLight.position.set(0, 0.03, -0.75);
      this.muzzleFlashMesh.position.set(0, 0.03, -0.75);
    } else if (wId === 'vector') {
      // Compact SMG
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.38), bodyMat);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.07), accentMat);
      mag.rotation.x = -0.35;
      mag.position.set(0, -0.15, -0.05);

      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), darkMat);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, 0.03, -0.26);

      const reflex = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.1), darkMat);
      reflex.position.set(0, 0.1, -0.05);

      this.gunGroup.add(body, mag, muzzle, reflex);
      this.muzzleFlashLight.position.set(0, 0.03, -0.36);
      this.muzzleFlashMesh.position.set(0, 0.03, -0.36);
    } else if (wId === 'revolver') {
      // Heavy revolver
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.22), bodyMat);
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), accentMat);
      cylinder.rotation.x = Math.PI / 2;
      cylinder.position.set(0, 0.01, -0.02);

      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.24), darkMat);
      barrel.position.set(0, 0.03, -0.22);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.09), accentMat);
      handle.rotation.x = 0.35;
      handle.position.set(0, -0.11, 0.1);

      this.gunGroup.add(body, cylinder, barrel, handle);
      this.muzzleFlashLight.position.set(0, 0.03, -0.36);
      this.muzzleFlashMesh.position.set(0, 0.03, -0.36);
    } else {
      // SCAR-H Assault Rifle
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), bodyMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.42);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.09), darkMat);
      mag.rotation.x = 0.15;
      mag.position.set(0, -0.15, -0.05);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.22), accentMat);
      stock.position.set(0, -0.02, 0.32);

      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.08), darkMat);
      sight.position.set(0, 0.08, -0.1);

      this.gunGroup.add(upper, barrel, mag, stock, sight);
      this.muzzleFlashLight.position.set(0, 0.02, -0.62);
      this.muzzleFlashMesh.position.set(0, 0.02, -0.62);
    }

    this.gunGroup.add(this.muzzleFlashLight);
    this.gunGroup.add(this.muzzleFlashMesh);

    // Initial default gun position (bottom right)
    this.gunGroup.position.set(0.24, -0.22, -0.45);
  }

  public loadNewMap(newMap: GameMap) {
    this.map = newMap;
    // Clear old objects from scene
    for (const item of this.colliders) {
      // scene objects
    }
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.colliders = [];
    this.healthPackMeshes = [];
    this.jumpPadMeshes = [];
    this.speedGateMeshes = [];
    this.spawnPoints = [];

    this.setupLighting();
    this.buildMap(this.map);
    this.initBots();
    this.respawnPlayer();
  }

  private buildMap(map: GameMap) {
    for (const block of map.blocks) {
      const { type, x, y, z, w, h, d, color, rotationY } = block;

      if (type === 'spawn') {
        this.spawnPoints.push(new THREE.Vector3(x, y + 1.5, z));
        continue;
      }

      if (type === 'healthpack') {
        const hpGroup = new THREE.Group();
        hpGroup.position.set(x, y, z);

        const crossH = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.4, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.6 })
        );
        const crossV = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 1.2, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.6 })
        );
        hpGroup.add(crossH, crossV);
        this.scene.add(hpGroup);
        this.healthPackMeshes.push({ mesh: hpGroup, block, active: true, respawnTime: 0 });
        continue;
      }

      const geo = new THREE.BoxGeometry(w, h, d);
      let mat: THREE.Material;

      if (type === 'jumppad') {
        mat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });
      } else if (type === 'speedgate') {
        mat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.75
        });
      } else {
        const blockColor = color || (type === 'floor' ? '#1e293b' : '#334155');
        mat = new THREE.MeshStandardMaterial({
          color: blockColor,
          roughness: type === 'crate' ? 0.7 : 0.4,
          metalness: type === 'wall' ? 0.3 : 0.1
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      if (rotationY) mesh.rotation.y = rotationY;

      this.scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push({ box, type, block });

      if (type === 'jumppad') this.jumpPadMeshes.push(mesh);
      if (type === 'speedgate') this.speedGateMeshes.push(mesh);
    }

    if (this.spawnPoints.length === 0) {
      this.spawnPoints.push(new THREE.Vector3(0, 3, 20), new THREE.Vector3(0, 3, -20));
    }
  }

  private initBots() {
    // Clear old bots
    for (const b of this.bots) {
      this.scene.remove(b.mesh);
    }
    this.bots = [];

    if (this.gameMode === 'tdm') {
      // Team Deathmatch Bot Setup (Balanced 3v3 combat)
      const isPlayerBlue = this.playerTeam === 'blue';
      const blueBotNames = ['AzureViper', 'CobaltGhost', 'NeonPulse'];
      const redBotNames = ['CrimsonHawk', 'ScarletFury', 'ApexStriker'];
      const botWeapons = ['scar', 'vector', 'shotgun', 'sniper', 'revolver'];

      const allyTeam: PlayerTeam = this.playerTeam;
      const enemyTeam: PlayerTeam = this.playerTeam === 'blue' ? 'red' : 'blue';

      const allyNames = isPlayerBlue ? blueBotNames.slice(0, 2) : redBotNames.slice(0, 2);
      const enemyNames = isPlayerBlue ? redBotNames.slice(0, 3) : blueBotNames.slice(0, 3);

      const botConfigs = [
        ...allyNames.map((name, i) => ({
          name,
          team: allyTeam,
          weaponId: botWeapons[i % botWeapons.length]
        })),
        ...enemyNames.map((name, i) => ({
          name,
          team: enemyTeam,
          weaponId: botWeapons[(i + 2) % botWeapons.length]
        }))
      ];

      botConfigs.forEach((cfg, i) => {
        const bGroup = new THREE.Group();
        const isBlue = cfg.team === 'blue';
        const teamColor = isBlue ? '#2563eb' : '#dc2626';
        const accentColor = isBlue ? '#60a5fa' : '#f87171';
        const visorColor = isBlue ? '#38bdf8' : '#ef4444';
        const markerColor = isBlue ? 0x38bdf8 : 0xef4444;

        // Torso & Armor
        const bodyMat = new THREE.MeshStandardMaterial({
          color: teamColor,
          roughness: 0.35,
          metalness: 0.3
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), bodyMat);
        body.position.y = 0.9;

        // Chestplate stripe
        const chestMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.2 });
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.35, 0.52), chestMat);
        chest.position.y = 1.0;

        // Head
        const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
        head.position.y = 1.75;

        // Visor
        const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), visorMat);
        visor.position.set(0, 1.75, 0.24);

        // Overhead holographic Team Badge Diamond
        const badgeGeo = new THREE.OctahedronGeometry(0.18);
        const badgeMat = new THREE.MeshBasicMaterial({ color: markerColor });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 2.35, 0);

        // Weapon mesh
        const wGroup = new THREE.Group();
        const gunMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.15, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x111827 })
        );
        gunMesh.position.set(0.45, 0.95, 0.35);
        wGroup.add(gunMesh);

        bGroup.add(body, chest, head, visor, badge, wGroup);

        // Team-based spawn position
        const spawnBase = isBlue
          ? (this.spawnPoints[0] || new THREE.Vector3(0, 3, -16))
          : (this.spawnPoints[1] || new THREE.Vector3(0, 3, 16));

        bGroup.position.copy(spawnBase);
        bGroup.position.x += (Math.random() - 0.5) * 8;
        bGroup.position.z += (Math.random() - 0.5) * 8;

        this.scene.add(bGroup);

        this.bots.push({
          id: 'bot_' + i,
          name: cfg.name,
          mesh: bGroup,
          headMesh: head,
          bodyMesh: body,
          weaponMesh: wGroup,
          badgeMesh: badge,
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          position: bGroup.position.clone(),
          velocity: new THREE.Vector3(),
          targetPosition: new THREE.Vector3(),
          shootCooldown: 0.5 + Math.random() * 1.2,
          isAlive: true,
          respawnTimer: 0,
          color: teamColor,
          team: cfg.team,
          weaponId: cfg.weaponId,
          kills: 0,
          deaths: 0,
          score: 0,
          ping: Math.floor(15 + Math.random() * 25)
        });
      });
    } else {
      // FFA mode bot setup (Free-for-all deathmatch)
      const botNames = ['ApexStriker', 'ShadowViper', 'NeonPulse', 'CypherGhost'];
      const botColors = ['#ef4444', '#8b5cf6', '#06b6d4', '#eab308'];
      const botWeapons = ['scar', 'vector', 'sniper', 'shotgun'];

      for (let i = 0; i < 4; i++) {
        const bGroup = new THREE.Group();

        // Low-poly humanoid
        const bodyMat = new THREE.MeshStandardMaterial({ color: botColors[i], roughness: 0.4 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), bodyMat);
        body.position.y = 0.9;

        const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
        head.position.y = 1.75;

        const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), visorMat);
        visor.position.set(0, 1.75, 0.24);

        const badgeGeo = new THREE.OctahedronGeometry(0.14);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 2.3, 0);

        // Weapon mesh
        const wGroup = new THREE.Group();
        const gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0x111827 }));
        gunMesh.position.set(0.45, 0.95, 0.35);
        wGroup.add(gunMesh);

        bGroup.add(body, head, visor, badge, wGroup);

        const spawn = this.spawnPoints[i % this.spawnPoints.length] || new THREE.Vector3(0, 3, 0);
        bGroup.position.copy(spawn);
        bGroup.position.x += (Math.random() - 0.5) * 6;
        bGroup.position.z += (Math.random() - 0.5) * 6;

        this.scene.add(bGroup);

        this.bots.push({
          id: 'bot_' + i,
          name: botNames[i],
          mesh: bGroup,
          headMesh: head,
          bodyMesh: body,
          weaponMesh: wGroup,
          badgeMesh: badge,
          health: 100,
          maxHealth: 100,
          shield: 50,
          maxShield: 50,
          position: bGroup.position.clone(),
          velocity: new THREE.Vector3(),
          targetPosition: new THREE.Vector3(),
          shootCooldown: 0.5 + Math.random() * 1.5,
          isAlive: true,
          respawnTimer: 0,
          color: botColors[i],
          team: i % 2 === 0 ? 'red' : 'blue',
          weaponId: botWeapons[i],
          kills: 0,
          deaths: 0,
          score: 0,
          ping: Math.floor(15 + Math.random() * 25)
        });
      }
    }
  }

  public respawnPlayer() {
    this.playerHealth = 100;
    this.playerShield = 50;
    this.isPlayerAlive = true;
    this.playerVelocity.set(0, 0, 0);

    let sp: THREE.Vector3;
    if (this.gameMode === 'tdm') {
      if (this.playerTeam === 'blue') {
        sp = (this.spawnPoints[0] || new THREE.Vector3(0, 3, -16)).clone();
      } else {
        sp = (this.spawnPoints[1] || new THREE.Vector3(0, 3, 16)).clone();
      }
      sp.x += (Math.random() - 0.5) * 4;
      sp.z += (Math.random() - 0.5) * 4;
    } else {
      const idx = Math.floor(Math.random() * Math.max(1, this.spawnPoints.length));
      sp = (this.spawnPoints[idx] || new THREE.Vector3(0, 3, 0)).clone();
    }

    this.playerPosition.copy(sp);
    this.camera.position.copy(this.playerPosition);
    this.camera.position.y += this.currentCameraHeight;

    this.currentAmmo = this.currentWeapon.magSize;
    this.isReloading = false;
    this.isInspecting = false;
    this.inspectTime = 0;
    this.inspectWeight = 0;
    this.killstreak = 0;

    // Reset anti-cheat telemetry thresholds and grace timer for safe respawn
    this.spawnProtectionTimer = 2.0;
    this.jumpPadBuffTimer = 0;
    this.consecutiveHighVelocityFrames = 0;
    this.lastPositionCheck.copy(this.playerPosition);
  }

  // Input Handling
  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Prevent triggering game inputs when typing in form inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      this.keys[e.code] = true;

      // Reload
      if (e.code === 'KeyR' && !this.isReloading && this.currentAmmo < this.currentWeapon.magSize) {
        this.startReload();
      }

      // Slide key
      if ((e.code === 'KeyC' || e.code === 'ControlLeft') && this.isGrounded && !this.isSliding) {
        this.triggerSlide();
      }

      // Jump
      if (e.code === 'Space') {
        this.triggerJump();
      }

      // Weapon inspection key
      if (e.code === 'KeyI') {
        this.triggerInspect();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        this.isMouseDown = true;
        if (this.isInspecting) {
          this.cancelInspect();
        }
      } else if (e.button === 2) {
        this.isRightMouseDown = true;
        this.isAiming = true;
        if (this.isInspecting) {
          this.cancelInspect();
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      } else if (e.button === 2) {
        this.isRightMouseDown = false;
        this.isAiming = false;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      const now = performance.now();
      const dtAim = Math.max(0.001, (now - this.lastAimTimestamp) / 1000);

      const sens = (this.settings.mouseSensitivity * 0.0018) * (this.isAiming ? 0.6 : 1.0);
      const deltaYaw = -e.movementX * sens;
      const deltaPitch = -e.movementY * sens;

      this.cameraYaw += deltaYaw;
      this.cameraPitch += deltaPitch;

      // Clamp pitch to avoid neck snap
      const maxPitch = Math.PI / 2 - 0.05;
      this.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitch));

      // Sway
      this.targetWeaponSway.x = THREE.MathUtils.clamp(e.movementX * 0.0008, -0.04, 0.04);
      this.targetWeaponSway.y = THREE.MathUtils.clamp(-e.movementY * 0.0008, -0.04, 0.04);

      // Snap-aim telemetry evaluation on raw camera input
      const angularDistanceRad = Math.hypot(deltaYaw, deltaPitch);
      const angleDeltaDeg = angularDistanceRad * (180 / Math.PI);
      const angularSpeedDegPerSec = angleDeltaDeg / dtAim;

      if (
        this.isPlayerAlive &&
        this.spawnProtectionTimer <= 0 &&
        angleDeltaDeg > 55 &&
        angularSpeedDegPerSec > 3800
      ) {
        if (now - this.lastSnapAimAnomalyTime > 2000) {
          this.lastSnapAimAnomalyTime = now;
          this.reportAntiCheatAnomaly({
            id: 'ac_aim_' + Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type: 'snap_aim_anomaly',
            severity: angularSpeedDegPerSec > 5000 ? 'critical' : 'suspicious',
            metric: `Snap Angular Velocity: ${Math.round(angularSpeedDegPerSec)}°/s (Delta: ${angleDeltaDeg.toFixed(1)}°)`,
            recordedValue: Math.round(angularSpeedDegPerSec),
            threshold: 3800,
            description: 'Discontinuous camera orientation delta detected surpassing natural human aim mechanics.',
            matchTimeSec: Math.round(this.matchTimer),
            playerPosition: [
              Math.round(this.playerPosition.x * 10) / 10,
              Math.round(this.playerPosition.y * 10) / 10,
              Math.round(this.playerPosition.z * 10) / 10
            ],
            metadata: {
              angularSpeedDegPerSec: Math.round(angularSpeedDegPerSec),
              weaponId: this.currentWeapon.id
            }
          });
        }
      }

      this.lastAimTimestamp = now;
    });

    window.addEventListener('resize', () => {
      if (!this.canvas) return;
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight || 1;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.viewmodelCamera.aspect = width / height;
      this.viewmodelCamera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    });
  }

  // Triggering actions
  public triggerSlide() {
    if (!this.isGrounded || this.isSliding) return;
    this.isSliding = true;
    this.slideTimer = 1.1; // 1.1 seconds slide
    sound.playSlide();

    // Sudden speed impulse in facing direction
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    this.playerVelocity.x += forward.x * 14;
    this.playerVelocity.z += forward.z * 14;
    this.targetCameraHeight = 0.85; // duck down
  }

  public triggerJump() {
    if (this.isWallRunning && this.wallRunSide) {
      // Wall kick!
      sound.playJump();
      this.isWallRunning = false;
      this.playerVelocity.y = 12;
      this.playerVelocity.x += this.wallNormal.x * 15;
      this.playerVelocity.z += this.wallNormal.z * 15;
      this.parkourDistanceMeters += 3;
      return;
    }

    if (this.isGrounded) {
      sound.playJump();
      // If jumping out of slide, preserve speed (bunny hop!)
      if (this.isSliding) {
        this.playerVelocity.y = 9.5;
        this.momentumMultiplier = 1.35;
      } else {
        this.playerVelocity.y = 8.8;
      }
      this.isGrounded = false;
    }
  }

  public startReload() {
    if (this.isReloading || this.currentAmmo >= this.currentWeapon.magSize) return;
    this.isReloading = true;
    this.reloadProgress = 0;
    sound.playReload();
  }

  public triggerInspect() {
    // If aiming down sights, do not initiate inspection
    if (this.isAiming) return;
    this.isInspecting = true;
    this.inspectTime = 0;
    sound.playInspect();
  }

  public cancelInspect() {
    this.isInspecting = false;
  }

  public getMatchHighlights(): MatchHighlight[] {
    const botNames = this.bots.map((b) => b.name);
    return generateMatchHighlights(
      this.combatEvents,
      this.playerKills,
      this.killstreak,
      this.currentWeapon.name,
      this.currentWeapon.id,
      botNames.length > 0 ? botNames : undefined
    );
  }

  public triggerMatchEnd(winner: string) {
    if (!this.matchActive) return;
    this.matchActive = false;
    const highlights = this.getMatchHighlights();
    if (this.onMatchEnd) {
      this.onMatchEnd(winner, highlights);
    }
  }

  /**
   * Registers an anti-cheat telemetry listener that receives suspicious velocity
   * or snap-aim anomaly events in real time.
   * Returns an unsubscribe function.
   */
  public addAntiCheatListener(listener: (anomaly: AntiCheatAnomaly) => void): () => void {
    this.antiCheatListeners.push(listener);
    return () => {
      this.antiCheatListeners = this.antiCheatListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Dispatches an anomaly event to the primary callback and all active listeners.
   */
  public reportAntiCheatAnomaly(anomaly: AntiCheatAnomaly): void {
    if (this.onAntiCheatAnomaly) {
      try {
        this.onAntiCheatAnomaly(anomaly);
      } catch (err) {
        console.error('Error in onAntiCheatAnomaly callback:', err);
      }
    }
    for (const listener of this.antiCheatListeners) {
      try {
        listener(anomaly);
      } catch (err) {
        console.error('Error in anti-cheat listener:', err);
      }
    }
  }

  // Main Loop
  private startLoop() {
    const loop = (timestamp: number) => {
      const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = timestamp;

      this.update(delta);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.weatherParticles) {
      this.weatherParticles.geometry.dispose();
      (this.weatherParticles.material as THREE.Material).dispose();
      this.scene.remove(this.weatherParticles);
    }
  }

  // Update Game State
  private update(dt: number) {
    if (!this.matchActive) return;

    // Update dynamic weather (particles, atmospheric lighting, and lightning strikes)
    this.updateWeather(dt);

    // Match timer
    this.matchTimer -= dt;
    if (this.matchTimer <= 0) {
      let winner = 'You';
      if (this.gameMode === 'tdm') {
        if (this.teamScores.blue > this.teamScores.red) {
          winner = 'Blue Team';
        } else if (this.teamScores.red > this.teamScores.blue) {
          winner = 'Red Team';
        } else {
          winner = 'Draw';
        }
      } else {
        winner = this.playerKills >= 15 ? 'You' : (this.bots.sort((a, b) => b.kills - a.kills)[0]?.name || 'ApexStriker');
      }
      this.triggerMatchEnd(winner);
    }

    // Health pack rotation & respawn
    for (const hp of this.healthPackMeshes) {
      if (hp.active) {
        hp.mesh.rotation.y += dt * 2;
        hp.mesh.position.y = hp.block.y + Math.sin(this.bobTime * 3) * 0.2;

        // Check pickup by player
        if (this.playerPosition.distanceTo(hp.mesh.position) < 2.5) {
          if (this.playerHealth < this.maxPlayerHealth || this.playerShield < this.maxPlayerShield) {
            this.playerHealth = Math.min(this.maxPlayerHealth, this.playerHealth + 40);
            this.playerShield = Math.min(this.maxPlayerShield, this.playerShield + 25);
            hp.active = false;
            hp.mesh.visible = false;
            hp.respawnTime = 15; // 15s respawn
            sound.playHitmarker(true);
          }
        }
      } else {
        hp.respawnTime -= dt;
        if (hp.respawnTime <= 0) {
          hp.active = true;
          hp.mesh.visible = true;
        }
      }
    }

    // Update Player Physics
    if (this.isPlayerAlive) {
      this.updatePlayerMovement(dt);
      this.updatePlayerCombat(dt);
    }

    // Update Bots
    this.updateBots(dt);

    // Update Floating Damage Numbers
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const fd = this.floatingDamages[i];
      fd.y += fd.velocity.y * dt;
      fd.opacity -= dt * 1.5;
      if (fd.opacity <= 0) {
        this.floatingDamages.splice(i, 1);
      }
    }

    // Hitmarker timer
    if (this.hitmarkerActive) {
      this.hitmarkerTimer -= dt;
      if (this.hitmarkerTimer <= 0) this.hitmarkerActive = false;
    }

    // Damage vignette timer
    if (this.damageVignetteTimer > 0) {
      this.damageVignetteTimer -= dt * 2.5;
      if (this.damageVignetteTimer < 0) this.damageVignetteTimer = 0;
    }

    if (this.onStateUpdate) this.onStateUpdate();
  }

  private updateWeather(dt: number) {
    this.weatherTime += dt;

    // 1. Update Precipitation / Atmospheric Particle Volume
    if (this.weatherParticles && this.weatherPositions && this.weatherVelocities) {
      const positions = this.weatherPositions;
      const velocities = this.weatherVelocities;
      const count = this.weather.particleCount;
      const camPos = this.camera.position;
      const halfBox = 35;
      const minY = camPos.y - 8;
      const maxY = camPos.y + 32;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;

        if (this.weather.type === 'snow') {
          // Gentle swirling blizzard snowflakes with sinusoidal sway
          const swayX = Math.sin(this.weatherTime * 1.8 + i) * 0.9;
          const swayZ = Math.cos(this.weatherTime * 1.4 + i) * 0.9;
          positions[idx] += (velocities[idx] + swayX) * dt;
          positions[idx + 1] += velocities[idx + 1] * dt;
          positions[idx + 2] += (velocities[idx + 2] + swayZ) * dt;
        } else if (this.weather.type === 'cyber_fog') {
          // Drifting neon embers floating upwards
          const swirl = Math.sin(this.weatherTime * 2.0 + i) * 0.8;
          positions[idx] += (velocities[idx] + swirl) * dt;
          positions[idx + 1] += velocities[idx + 1] * dt;
          positions[idx + 2] += velocities[idx + 2] * dt;
        } else {
          // Rain streaks, sandstorm grains, or clear dust motes
          positions[idx] += velocities[idx] * dt;
          positions[idx + 1] += velocities[idx + 1] * dt;
          positions[idx + 2] += velocities[idx + 2] * dt;
        }

        // Seamless wrap around player position
        const dx = positions[idx] - camPos.x;
        const dz = positions[idx + 2] - camPos.z;

        if (dx < -halfBox) positions[idx] += halfBox * 2;
        else if (dx > halfBox) positions[idx] -= halfBox * 2;

        if (dz < -halfBox) positions[idx + 2] += halfBox * 2;
        else if (dz > halfBox) positions[idx + 2] -= halfBox * 2;

        if (positions[idx + 1] < minY) {
          positions[idx + 1] = maxY;
          positions[idx] = camPos.x + (Math.random() - 0.5) * halfBox * 2;
          positions[idx + 2] = camPos.z + (Math.random() - 0.5) * halfBox * 2;
        } else if (positions[idx + 1] > maxY) {
          positions[idx + 1] = minY;
          positions[idx] = camPos.x + (Math.random() - 0.5) * halfBox * 2;
          positions[idx + 2] = camPos.z + (Math.random() - 0.5) * halfBox * 2;
        }
      }

      this.weatherParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Dynamic Thunder & Lightning Flash for Storms
    if (this.weather.hasLightning && this.sunLight && this.ambientLight) {
      if (this.lightningDuration > 0) {
        this.lightningDuration -= dt;
        if (this.lightningDuration <= 0) {
          // Return to overcast storm baseline
          this.sunLight.intensity = this.baseSunIntensity;
          this.ambientLight.intensity = this.baseAmbientIntensity;
          const isDark = this.settings.darkMode;
          this.scene.background = new THREE.Color(isDark ? this.weather.skyColorDark : this.weather.skyColor);
          if (this.scene.fog) {
            this.scene.fog.color = new THREE.Color(isDark ? this.weather.fogColorDark : this.weather.fogColor);
          }
        } else {
          // Rapid electric flicker pulse
          const flicker = Math.random() > 0.25 ? 1.0 : 0.15;
          this.sunLight.intensity = this.baseSunIntensity + flicker * 3.4;
          this.ambientLight.intensity = this.baseAmbientIntensity + flicker * 2.2;
        }
      } else {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          // Lightning strike ignition
          this.lightningDuration = 0.1 + Math.random() * 0.12;
          this.lightningTimer = 7 + Math.random() * 11;

          // Electrify horizon & fog
          this.scene.background = new THREE.Color(0xdbeafe);
          if (this.scene.fog) {
            this.scene.fog.color = new THREE.Color(0xdbeafe);
          }
        }
      }
    }

    // 3. Neon Atmospheric Smog Breathing Pulse for Cyber Fog
    if (this.weather.pulseNeon) {
      const pulse = 1.0 + Math.sin(this.weatherTime * 2.2) * 0.35;
      if (this.cyanAccentLight) this.cyanAccentLight.intensity = 3.5 * pulse;
      if (this.pinkAccentLight) this.pinkAccentLight.intensity = 3.5 * (2 - pulse);
    }
  }

  private updatePlayerMovement(dt: number) {
    // Grace timer and kinetic boost buffer countdowns
    if (this.jumpPadBuffTimer > 0) {
      this.jumpPadBuffTimer -= dt;
    }
    if (this.spawnProtectionTimer > 0) {
      this.spawnProtectionTimer -= dt;
    }

    // 1. Sliding Countdown
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 || !this.isGrounded) {
        this.isSliding = false;
        this.targetCameraHeight = 1.7;
      }
    }

    // Speed boost countdown
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
    }

    // Smooth camera height adjustment (for slide ducking)
    this.currentCameraHeight = THREE.MathUtils.lerp(this.currentCameraHeight, this.targetCameraHeight, dt * 12);

    // 2. Input movement vector
    const moveX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const moveZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);

    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.isAiming;

    const baseSpeed = this.isSliding
      ? 18.0
      : this.isSprinting
      ? 11.5
      : this.isAiming
      ? 4.5
      : 7.5;

    let targetSpeed = baseSpeed * this.currentWeapon.speedMultiplier;
    if (this.speedBoostTimer > 0) targetSpeed *= 1.65;
    targetSpeed *= this.momentumMultiplier;

    // Decay momentum
    this.momentumMultiplier = THREE.MathUtils.lerp(this.momentumMultiplier, 1.0, dt * 1.5);

    const inputDir = new THREE.Vector3(moveX, 0, moveZ);
    if (inputDir.lengthSq() > 0) {
      inputDir.normalize();
      inputDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      // Accelerate
      const accel = this.isGrounded ? 45.0 : 15.0;
      this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, inputDir.x * targetSpeed, dt * accel);
      this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, inputDir.z * targetSpeed, dt * accel);

      if (this.isGrounded && !this.isSliding) {
        this.bobTime += dt * (this.isSprinting ? 14 : 9);
      }
    } else if (this.isGrounded) {
      // Friction
      const friction = this.isSliding ? 1.8 : 12.0;
      this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, 0, dt * friction);
      this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, 0, dt * friction);
    }

    // 3. Wall Running Check
    this.checkWallRun();

    // 4. Gravity
    if (this.isWallRunning) {
      // Low wall friction gravity
      this.playerVelocity.y = Math.max(-2.5, this.playerVelocity.y - 8.0 * dt);
      this.parkourDistanceMeters += dt * 8;
    } else {
      this.playerVelocity.y -= 25.0 * dt; // Normal gravity
    }

    // 5. Apply velocity & Collisions
    const newPos = this.playerPosition.clone();
    newPos.x += this.playerVelocity.x * dt;
    newPos.y += this.playerVelocity.y * dt;
    newPos.z += this.playerVelocity.z * dt;

    // Collision Resolution with Map
    this.resolvePlayerCollisions(newPos);

    // Anti-cheat velocity & displacement telemetry evaluation
    this.checkVelocityTelemetry(dt);

    // Fall out of map safety
    if (this.playerPosition.y < -15) {
      this.handlePlayerDeath('The Void');
    }

    // Position camera
    this.camera.position.set(
      this.playerPosition.x,
      this.playerPosition.y + this.currentCameraHeight,
      this.playerPosition.z
    );

    // Camera tilt when wall running
    let targetRoll = 0;
    if (this.isWallRunning) {
      targetRoll = this.wallRunSide === 'left' ? -0.15 : 0.15;
    }
    const euler = new THREE.Euler(this.cameraPitch, this.cameraYaw, targetRoll, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  private checkWallRun() {
    if (this.isGrounded) {
      this.isWallRunning = false;
      return;
    }

    // Raycast left and right from player position
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const left = right.clone().negate();

    const origin = this.playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0));
    const raycaster = new THREE.Raycaster();
    raycaster.far = 1.2;

    // Check right wall
    raycaster.set(origin, right);
    const collMeshList = this.colliders.map(c => new THREE.Box3Helper(c.box).box);
    // Approximate box check
    let foundWall = false;

    for (const c of this.colliders) {
      if (c.type === 'wall') {
        const playerSphere = new THREE.Sphere(origin, 1.3);
        if (c.box.intersectsSphere(playerSphere)) {
          this.isWallRunning = true;
          this.wallRunSide = 'right';
          this.wallNormal.copy(right).negate();
          foundWall = true;
          sound.playWallRun();
          break;
        }
      }
    }

    if (!foundWall) {
      this.isWallRunning = false;
      this.wallRunSide = null;
    }
  }

  private resolvePlayerCollisions(newPos: THREE.Vector3) {
    const playerRadius = 0.55;
    const playerHeight = this.isSliding ? 1.0 : 1.9;

    let groundedThisFrame = false;

    for (const c of this.colliders) {
      const b = c.box;

      // Jump Pad trigger
      if (c.type === 'jumppad') {
        if (
          newPos.x > b.min.x && newPos.x < b.max.x &&
          newPos.z > b.min.z && newPos.z < b.max.z &&
          Math.abs(newPos.y - b.max.y) < 1.0
        ) {
          sound.playBouncePad();
          this.playerVelocity.y = 21.0;
          this.momentumMultiplier = 1.4;
          this.jumpPadBuffTimer = 2.0;
          this.isGrounded = false;
          break;
        }
      }

      // Speed Gate trigger
      if (c.type === 'speedgate') {
        if (
          newPos.x > b.min.x - 1 && newPos.x < b.max.x + 1 &&
          newPos.z > b.min.z - 1 && newPos.z < b.max.z + 1 &&
          Math.abs(newPos.y - (b.min.y + b.max.y) / 2) < 3.0
        ) {
          if (this.speedBoostTimer <= 0) {
            sound.playSpeedGate();
            this.speedBoostTimer = 3.5;
          }
        }
      }

      // Solid blocks collision (floor, wall, crate, ramp)
      if (c.type === 'floor' || c.type === 'wall' || c.type === 'crate' || c.type === 'ramp') {
        // Horizontal check
        const closestX = THREE.MathUtils.clamp(newPos.x, b.min.x, b.max.x);
        const closestZ = THREE.MathUtils.clamp(newPos.z, b.min.z, b.max.z);
        const distX = newPos.x - closestX;
        const distZ = newPos.z - closestZ;
        const horizDistSq = distX * distX + distZ * distZ;

        if (newPos.y < b.max.y && newPos.y + playerHeight > b.min.y) {
          if (horizDistSq < playerRadius * playerRadius) {
            const dist = Math.sqrt(horizDistSq);
            if (dist > 0.001) {
              const push = (playerRadius - dist);
              newPos.x += (distX / dist) * push;
              newPos.z += (distZ / dist) * push;
            }
          }
        }

        // Vertical floor check
        if (
          newPos.x > b.min.x - playerRadius && newPos.x < b.max.x + playerRadius &&
          newPos.z > b.min.z - playerRadius && newPos.z < b.max.z + playerRadius
        ) {
          // Landing on top
          if (this.playerPosition.y >= b.max.y - 0.25 && newPos.y <= b.max.y + 0.1) {
            newPos.y = b.max.y;
            this.playerVelocity.y = 0;
            groundedThisFrame = true;
          }
          // Hitting ceiling
          else if (newPos.y + playerHeight >= b.min.y && this.playerPosition.y + playerHeight <= b.min.y + 0.2) {
            newPos.y = b.min.y - playerHeight;
            this.playerVelocity.y = 0;
          }
        }
      }
    }

    this.isGrounded = groundedThisFrame;
    this.playerPosition.copy(newPos);
  }

  private updatePlayerCombat(dt: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Maintain a 60ms rolling pre-shot camera orientation snapshot for snap-aim analysis
    const now = performance.now();
    if (now - this.preShotAimSnapshot.timestamp > 60) {
      this.preShotAimSnapshot = {
        yaw: this.cameraYaw,
        pitch: this.cameraPitch,
        timestamp: now
      };
    }

    // Reload progress
    if (this.isReloading) {
      this.reloadProgress += dt / this.currentWeapon.reloadTime;
      if (this.reloadProgress >= 1.0) {
        this.currentAmmo = this.currentWeapon.magSize;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // Shooting
    if (this.isMouseDown && !this.isReloading && this.shootCooldown <= 0) {
      if (this.currentAmmo > 0) {
        this.fireWeapon();
        this.shootCooldown = 1.0 / this.currentWeapon.fireRate;
        if (!this.currentWeapon.automatic) {
          this.isMouseDown = false;
        }
      } else {
        this.startReload();
      }
    }

    // Weapon sway & bob animation
    this.weaponSway.lerp(this.targetWeaponSway, dt * 10);
    this.targetWeaponSway.set(0, 0);

    // ADS lerp
    const targetGunPos = this.isAiming
      ? new THREE.Vector3(0, -0.11, -0.32) // Centered sight line
      : new THREE.Vector3(0.24, -0.22, -0.45); // Hipfire position

    if (!this.isAiming) {
      // Add walking bob
      targetGunPos.x += Math.cos(this.bobTime) * 0.015;
      targetGunPos.y += Math.sin(this.bobTime * 2) * 0.015;
    }

    // Recoil recovery
    this.gunRecoilKick = THREE.MathUtils.lerp(this.gunRecoilKick, 0, dt * 14);
    targetGunPos.z += this.gunRecoilKick;

    // Inspect animation logic
    // If aiming down sights or firing, gracefully transition out of inspect without blocking weapon readiness
    if (this.isAiming || (this.isMouseDown && this.currentAmmo > 0)) {
      if (this.isInspecting) {
        this.isInspecting = false;
      }
      this.inspectWeight = THREE.MathUtils.lerp(this.inspectWeight, 0, dt * 24);
    } else if (this.isInspecting) {
      this.inspectTime += dt;
      this.inspectWeight = THREE.MathUtils.lerp(this.inspectWeight, 1.0, dt * 8);
      if (this.inspectTime >= this.inspectDuration) {
        this.isInspecting = false;
        this.inspectTime = 0;
      }
    } else {
      this.inspectWeight = THREE.MathUtils.lerp(this.inspectWeight, 0, dt * 10);
    }

    const inspectPose = this.getInspectTransform(
      Math.min(1.0, this.inspectTime / this.inspectDuration)
    );

    // Apply inspect offset weighted by inspectWeight
    if (this.inspectWeight > 0.001) {
      targetGunPos.addScaledVector(inspectPose.pos, this.inspectWeight);
    }

    this.gunGroup.position.lerp(targetGunPos, dt * 16);

    const targetRotX = this.weaponSway.y + (this.gunRecoilKick * 1.5) + (inspectPose.rot.x * this.inspectWeight);
    const targetRotY = this.weaponSway.x + (inspectPose.rot.y * this.inspectWeight);
    const targetRotZ = inspectPose.rot.z * this.inspectWeight;

    this.gunGroup.rotation.x = THREE.MathUtils.lerp(this.gunGroup.rotation.x, targetRotX, dt * 20);
    this.gunGroup.rotation.y = THREE.MathUtils.lerp(this.gunGroup.rotation.y, targetRotY, dt * 20);
    this.gunGroup.rotation.z = THREE.MathUtils.lerp(this.gunGroup.rotation.z, targetRotZ, dt * 20);

    // FOV adjustment on ADS
    const targetFov = this.isAiming
      ? (this.currentWeapon.id === 'sniper' ? 30 : this.settings.fov * 0.75)
      : this.settings.fov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 15);
    this.camera.updateProjectionMatrix();

    // Fade muzzle flash
    if (this.muzzleFlashLight.intensity > 0) {
      this.muzzleFlashLight.intensity -= dt * 60;
      (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity -= dt * 15;
    }
  }

  /**
   * 3D keyframed pose calculation for inspecting the weapon skin.
   * Progress p is normalized from 0.0 to 1.0.
   */
  private getInspectTransform(p: number): {
    pos: THREE.Vector3;
    rot: { x: number; y: number; z: number };
  } {
    // Keyframes choreograph a tactile, cinematic inspection sequence:
    // 0: Rest hipfire position
    // 1: Lift towards chest & tilt inward to examine right chassis, finish and top rail
    // 2: Admire right decals and specular highlights under map lighting
    // 3: Wrist rollover to turn weapon towards opposite side
    // 4: Turn over to showcase magazine, underbarrel, left receiver & emblems
    // 5: Gentle sway admiring left profile
    // 6: Align barrel forward, sight check flourish
    // 7: Settle smoothly back into hipfire stance
    const keyframes = [
      { t: 0.00, pos: [0.0, 0.0, 0.0], rot: [0.0, 0.0, 0.0] },
      { t: 0.14, pos: [-0.07, 0.04, 0.06], rot: [0.12, 0.38, -0.25] },
      { t: 0.32, pos: [-0.14, 0.07, 0.08], rot: [0.24, 0.74, -0.48] },
      { t: 0.46, pos: [-0.12, 0.08, 0.07], rot: [0.18, 0.80, -0.38] },
      { t: 0.60, pos: [-0.07, 0.05, 0.06], rot: [0.04, 0.12, -0.06] },
      { t: 0.76, pos: [-0.04, 0.06, 0.07], rot: [-0.16, -0.72, 0.54] },
      { t: 0.86, pos: [-0.02, 0.05, 0.05], rot: [-0.10, -0.58, 0.38] },
      { t: 0.94, pos: [-0.01, 0.02, 0.02], rot: [0.06, -0.08, 0.04] },
      { t: 1.00, pos: [0.0, 0.0, 0.0], rot: [0.0, 0.0, 0.0] }
    ];

    let k0 = keyframes[0];
    let k1 = keyframes[1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (p >= keyframes[i].t && p <= keyframes[i + 1].t) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    const span = k1.t - k0.t;
    const segT = span > 0.0001 ? THREE.MathUtils.clamp((p - k0.t) / span, 0, 1) : 0;
    // Smoothstep cubic easing: 3t^2 - 2t^3
    const ease = segT * segT * (3 - 2 * segT);

    const posX = THREE.MathUtils.lerp(k0.pos[0], k1.pos[0], ease);
    const posY = THREE.MathUtils.lerp(k0.pos[1], k1.pos[1], ease);
    const posZ = THREE.MathUtils.lerp(k0.pos[2], k1.pos[2], ease);

    const rotX = THREE.MathUtils.lerp(k0.rot[0], k1.rot[0], ease);
    const rotY = THREE.MathUtils.lerp(k0.rot[1], k1.rot[1], ease);
    const rotZ = THREE.MathUtils.lerp(k0.rot[2], k1.rot[2], ease);

    return {
      pos: new THREE.Vector3(posX, posY, posZ),
      rot: { x: rotX, y: rotY, z: rotZ }
    };
  }

  private fireWeapon() {
    this.currentAmmo--;
    this.isInspecting = false;
    sound.playShoot(this.currentWeapon.id);

    // Muzzle flash
    this.muzzleFlashLight.intensity = 5;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1;
    this.gunRecoilKick = 0.08;

    // Camera recoil kick
    this.cameraPitch += (Math.random() * 0.015 + 0.01) * (this.isAiming ? 0.4 : 1.0);

    // Pellet loop (1 for rifles/snipers, 8 for shotguns)
    const count = this.currentWeapon.pellets || 1;
    for (let p = 0; p < count; p++) {
      this.raycastShot();
    }
  }

  private raycastShot() {
    // Spread calculation
    const spreadVal = this.isAiming ? this.currentWeapon.spread * 0.4 : this.currentWeapon.spread;
    const spreadX = (Math.random() - 0.5) * spreadVal;
    const spreadY = (Math.random() - 0.5) * spreadVal;

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(spreadX, spreadY);
    raycaster.setFromCamera(center, this.camera);

    // Check hit against bots
    let closestHitDistance = Infinity;
    let hitBot: BotPlayer | null = null;
    let isHeadshot = false;
    let hitPoint = new THREE.Vector3();

    for (const bot of this.bots) {
      if (!bot.isAlive) continue;

      const botBox = new THREE.Box3().setFromObject(bot.mesh);
      const headBox = new THREE.Box3().setFromObject(bot.headMesh);

      const intersects = raycaster.intersectObject(bot.mesh, true);
      if (intersects.length > 0 && intersects[0].distance < closestHitDistance) {
        closestHitDistance = intersects[0].distance;
        hitBot = bot;
        hitPoint = intersects[0].point;

        // Determine if hit upper body / head
        const headIntersect = raycaster.intersectObject(bot.headMesh, true);
        isHeadshot = headIntersect.length > 0;
      }
    }

    // Check hit against world blocks
    const worldMeshes = this.scene.children.filter(c => c instanceof THREE.Mesh);
    const worldIntersects = raycaster.intersectObjects(worldMeshes);
    if (worldIntersects.length > 0 && worldIntersects[0].distance < closestHitDistance) {
      // Hit a wall or crate instead of bot
      hitBot = null;
      this.createBulletImpact(worldIntersects[0].point, worldIntersects[0].face?.normal);
    }

    if (hitBot) {
      // Friendly fire check in TDM
      if (this.gameMode === 'tdm' && hitBot.team === this.playerTeam) {
        sound.playRadioClick(false);
        this.floatingDamages.push({
          id: 'fd_' + Math.random(),
          x: hitPoint.x,
          y: hitPoint.y + 0.4,
          z: hitPoint.z,
          damage: 0,
          isHeadshot: false,
          opacity: 0.8,
          velocity: new THREE.Vector3(0, 1.6, 0)
        });
        return;
      }

      // Calculate Damage
      let dmg = this.currentWeapon.damage;
      if (isHeadshot) {
        dmg = Math.round(dmg * this.currentWeapon.headshotMultiplier);
        this.playerHeadshots++;
      }

      this.damageBot(hitBot, dmg, isHeadshot);

      // Evaluate snap-aim telemetry against human mechanical limits
      this.checkSnapAimTelemetry(hitBot, isHeadshot);

      // Hitmarker
      this.hitmarkerActive = true;
      this.hitmarkerIsHeadshot = isHeadshot;
      this.hitmarkerTimer = 0.18;
      sound.playHitmarker(isHeadshot);

      // Floating damage number
      this.floatingDamages.push({
        id: 'fd_' + Math.random(),
        x: hitPoint.x,
        y: hitPoint.y + 0.3,
        z: hitPoint.z,
        damage: dmg,
        isHeadshot,
        opacity: 1.0,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 2.8, (Math.random() - 0.5) * 2)
      });
    }

    // Bullet tracer visual
    this.createBulletTracer(hitPoint.lengthSq() > 0 ? hitPoint : raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(100)));
  }

  private createBulletTracer(target: THREE.Vector3) {
    const origin = this.gunGroup.localToWorld(this.muzzleFlashLight.position.clone());
    const points = [origin, target];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    // Fade and remove tracer
    const startTime = performance.now();
    const fade = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 0.08) {
        this.scene.remove(line);
      } else {
        mat.opacity = 1 - (elapsed / 0.08);
        requestAnimationFrame(fade);
      }
    };
    fade();
  }

  private createBulletImpact(point: THREE.Vector3, normal?: THREE.Vector3) {
    const sparkCount = 4;
    for (let i = 0; i < sparkCount; i++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
      );
      spark.position.copy(point);
      this.scene.add(spark);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4 + (normal?.x || 0) * 2,
        Math.random() * 3 + (normal?.y || 0) * 2,
        (Math.random() - 0.5) * 4 + (normal?.z || 0) * 2
      );

      let t = 0;
      const animateSpark = () => {
        t += 0.016;
        spark.position.addScaledVector(vel, 0.016);
        if (t > 0.15) {
          this.scene.remove(spark);
        } else {
          requestAnimationFrame(animateSpark);
        }
      };
      animateSpark();
    }
  }

  /**
   * Evaluates player movement against kinematic thresholds, detecting unnatural velocity spikes,
   * speed hacking, or discontinuous coordinate teleportation.
   */
  private checkVelocityTelemetry(dt: number) {
    if (!this.isPlayerAlive || this.spawnProtectionTimer > 0 || dt <= 0.0001) {
      this.lastPositionCheck.copy(this.playerPosition);
      return;
    }

    const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    const speed3D = this.playerVelocity.length();
    const actualDisplacement = this.playerPosition.distanceTo(this.lastPositionCheck);
    const displacementSpeed = actualDisplacement / dt;

    // Normal max speed sprint: ~11.5 m/s, slide: ~18 m/s, speedgate / jumppad burst: ~32 m/s
    const hasSpeedBuff = this.speedBoostTimer > 0 || this.jumpPadBuffTimer > 0;
    const maxPermittedHoriz = hasSpeedBuff ? 38.0 : 28.0;
    const maxPermittedDisplacementSpeed = hasSpeedBuff ? 48.0 : 35.0;

    const now = performance.now();

    // Check 1: Teleportation / Extreme Coordinate Desync (>20m in <100ms)
    if (actualDisplacement > 20.0 && displacementSpeed > 110.0) {
      if (now - this.lastVelocityAnomalyTime > 1800) {
        this.lastVelocityAnomalyTime = now;
        this.reportAntiCheatAnomaly({
          id: 'ac_tp_' + Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          type: 'teleportation',
          severity: 'critical',
          metric: `Displacement: ${actualDisplacement.toFixed(1)}m in ${(dt * 1000).toFixed(0)}ms (${displacementSpeed.toFixed(1)} m/s)`,
          recordedValue: Math.round(displacementSpeed),
          threshold: Math.round(maxPermittedDisplacementSpeed),
          description: 'Instantaneous non-physical coordinate leap detected exceeding arena traversal boundaries.',
          matchTimeSec: Math.round(this.matchTimer),
          playerPosition: [
            Math.round(this.playerPosition.x * 10) / 10,
            Math.round(this.playerPosition.y * 10) / 10,
            Math.round(this.playerPosition.z * 10) / 10
          ],
          metadata: {
            velocityMagnitude: Math.round(speed3D * 10) / 10
          }
        });
      }
      this.consecutiveHighVelocityFrames = 0;
      this.lastPositionCheck.copy(this.playerPosition);
      return;
    }

    // Check 2: Excessive Horizontal or 3D Speed Hack
    if (horizSpeed > maxPermittedHoriz || displacementSpeed > maxPermittedDisplacementSpeed) {
      this.consecutiveHighVelocityFrames++;
      if (this.consecutiveHighVelocityFrames >= 3) {
        if (now - this.lastVelocityAnomalyTime > 2000) {
          this.lastVelocityAnomalyTime = now;
          const isExtreme = horizSpeed > maxPermittedHoriz * 1.5 || displacementSpeed > 60.0;
          const severity: AnomalySeverity = isExtreme ? 'critical' : horizSpeed > maxPermittedHoriz * 1.2 ? 'suspicious' : 'warning';
          const type: AnomalyType = isExtreme ? 'speed_hack' : 'suspicious_velocity';

          this.reportAntiCheatAnomaly({
            id: 'ac_vel_' + Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            type,
            severity,
            metric: `Velocity: ${horizSpeed.toFixed(1)} m/s (Threshold: ${maxPermittedHoriz.toFixed(1)} m/s)`,
            recordedValue: Math.round(horizSpeed * 10) / 10,
            threshold: Math.round(maxPermittedHoriz * 10) / 10,
            description: `Sustained anomalous player velocity detected over ${this.consecutiveHighVelocityFrames} consecutive ticks without kinetic boost source.`,
            matchTimeSec: Math.round(this.matchTimer),
            playerPosition: [
              Math.round(this.playerPosition.x * 10) / 10,
              Math.round(this.playerPosition.y * 10) / 10,
              Math.round(this.playerPosition.z * 10) / 10
            ],
            metadata: {
              velocityMagnitude: Math.round(speed3D * 10) / 10
            }
          });
        }
      }
    } else {
      this.consecutiveHighVelocityFrames = Math.max(0, this.consecutiveHighVelocityFrames - 1);
    }

    this.lastPositionCheck.copy(this.playerPosition);
  }

  /**
   * Evaluates camera angular dynamics prior to firing to identify automated snap-aim
   * and silent-aim targeting anomalies.
   */
  private checkSnapAimTelemetry(hitBot: BotPlayer, isHeadshot: boolean) {
    const now = performance.now();
    if (now - this.lastSnapAimAnomalyTime < 1500) return;

    const dtPreShot = Math.max(0.001, (now - this.preShotAimSnapshot.timestamp) / 1000);
    const deltaYaw = Math.abs(this.cameraYaw - this.preShotAimSnapshot.yaw);
    const deltaPitch = Math.abs(this.cameraPitch - this.preShotAimSnapshot.pitch);
    const totalAngleDeg = Math.hypot(deltaYaw, deltaPitch) * (180 / Math.PI);
    const angularRateDegPerSec = totalAngleDeg / dtPreShot;

    // Detect superhuman snap: large angular turn (>32°) performed at superhuman rate (>2200°/s) ending directly on bot
    const isSuperhumanSnap = (totalAngleDeg > 32 && angularRateDegPerSec > 2200) || angularRateDegPerSec > 3400;

    if (isSuperhumanSnap) {
      this.lastSnapAimAnomalyTime = now;
      const severity: AnomalySeverity = (angularRateDegPerSec > 3500 || isHeadshot) ? 'critical' : 'suspicious';

      this.reportAntiCheatAnomaly({
        id: 'ac_aim_' + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type: 'snap_aim_anomaly',
        severity,
        metric: `Snap Angular Velocity: ${Math.round(angularRateDegPerSec)}°/s (Delta: ${totalAngleDeg.toFixed(1)}°)`,
        recordedValue: Math.round(angularRateDegPerSec),
        threshold: 2200,
        description: `Superhuman snap-aim lock detected terminating instantaneously onto ${hitBot.name}${isHeadshot ? ' (Headshot)' : ''}.`,
        matchTimeSec: Math.round(this.matchTimer),
        playerPosition: [
          Math.round(this.playerPosition.x * 10) / 10,
          Math.round(this.playerPosition.y * 10) / 10,
          Math.round(this.playerPosition.z * 10) / 10
        ],
        metadata: {
          targetId: hitBot.id,
          targetName: hitBot.name,
          isHeadshot,
          angularSpeedDegPerSec: Math.round(angularRateDegPerSec),
          weaponId: this.currentWeapon.id
        }
      });
    }
  }

  private damageBot(bot: BotPlayer, damage: number, isHeadshot: boolean) {
    this.combatEvents.push({
      id: 'ce_' + Math.random(),
      timeSec: performance.now() / 1000,
      matchElapsedSec: Math.max(0, this.matchInitialDuration - this.matchTimer),
      type: 'hit',
      damage,
      victim: bot.name,
      isHeadshot,
      weapon: this.currentWeapon.name,
      weaponId: this.currentWeapon.id,
      streak: this.killstreak,
      isSliding: this.isSliding,
      isWallRunning: this.isWallRunning
    });

    // Shield absorbs damage first
    if (bot.shield > 0) {
      const shieldDmg = Math.min(bot.shield, damage);
      bot.shield -= shieldDmg;
      damage -= shieldDmg;
    }
    bot.health -= damage;

    if (bot.health <= 0) {
      this.killBot(bot, isHeadshot, 'You', this.playerTeam);
    }
  }

  private killBot(bot: BotPlayer, isHeadshot: boolean, killerName: string = 'You', killerTeam?: PlayerTeam) {
    bot.isAlive = false;
    bot.mesh.visible = false;
    bot.deaths++;
    bot.respawnTimer = 3.5; // 3.5s respawn

    const isPlayerKiller = killerName === 'You' || killerName === 'You (Offline)';

    if (isPlayerKiller) {
      this.playerKills++;
      this.killstreak++;
      if (this.isSliding) this.slideKillsCount++;
      sound.playKillstreak(this.killstreak);

      this.combatEvents.push({
        id: 'ce_' + Math.random(),
        timeSec: performance.now() / 1000,
        matchElapsedSec: Math.max(0, this.matchInitialDuration - this.matchTimer),
        type: 'kill',
        damage: isHeadshot ? Math.round(this.currentWeapon.damage * this.currentWeapon.headshotMultiplier) : this.currentWeapon.damage,
        victim: bot.name,
        isHeadshot,
        weapon: this.currentWeapon.name,
        weaponId: this.currentWeapon.id,
        streak: this.killstreak,
        isSliding: this.isSliding,
        isWallRunning: this.isWallRunning
      });
    }

    const finalKillerTeam = killerTeam || (isPlayerKiller ? this.playerTeam : (bot.team === 'blue' ? 'red' : 'blue'));

    // Score checks
    if (this.gameMode === 'tdm' && this.matchActive) {
      this.teamScores[finalKillerTeam]++;
      if (this.teamScores[finalKillerTeam] >= this.teamTargetScore) {
        const winner = finalKillerTeam === 'blue' ? 'Blue Team' : 'Red Team';
        this.triggerMatchEnd(winner);
      }
    } else if (this.gameMode === 'ffa' && this.matchActive && this.playerKills >= 15) {
      this.triggerMatchEnd('You');
    }

    // Killfeed entry
    this.killFeed.unshift({
      id: 'kf_' + Math.random(),
      killer: isPlayerKiller ? (this.settings.offlineMode ? 'You (Offline)' : 'You') : killerName,
      victim: bot.name,
      weapon: isPlayerKiller ? this.currentWeapon.name : (WEAPONS[bot.weaponId]?.name || 'Blaster'),
      headshot: isHeadshot,
      timestamp: Date.now(),
      killerTeam: this.gameMode === 'tdm' ? finalKillerTeam : undefined,
      victimTeam: this.gameMode === 'tdm' ? bot.team : undefined
    });
    if (this.killFeed.length > 5) this.killFeed.pop();

    if (isPlayerKiller && this.onKill) {
      this.onKill(bot.name, isHeadshot, this.currentWeapon.name);
    }
  }

  private updateBots(dt: number) {
    for (const bot of this.bots) {
      if (bot.badgeMesh) {
        bot.badgeMesh.rotation.y += dt * 2.5;
      }

      if (!bot.isAlive) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) {
          bot.isAlive = true;
          bot.mesh.visible = true;
          bot.health = bot.maxHealth;
          bot.shield = bot.maxShield;

          let sp: THREE.Vector3;
          if (this.gameMode === 'tdm') {
            const spawnBase = bot.team === 'blue'
              ? (this.spawnPoints[0] || new THREE.Vector3(0, 3, -16))
              : (this.spawnPoints[1] || new THREE.Vector3(0, 3, 16));
            sp = spawnBase.clone();
          } else {
            const idx = Math.floor(Math.random() * Math.max(1, this.spawnPoints.length));
            sp = (this.spawnPoints[idx] || new THREE.Vector3(0, 3, 0)).clone();
          }

          bot.mesh.position.copy(sp);
          bot.mesh.position.x += (Math.random() - 0.5) * 6;
          bot.mesh.position.z += (Math.random() - 0.5) * 6;
        }
        continue;
      }

      // Determine Target for Bot:
      // In TDM: Only target enemy team members (enemy bots or enemy player).
      // In FFA: Target closest other bot or player.
      type TargetCandidate = {
        isPlayer: boolean;
        bot?: BotPlayer;
        position: THREE.Vector3;
        distance: number;
      };

      const candidates: TargetCandidate[] = [];

      // Check Player as target
      const isPlayerEnemy = this.gameMode === 'ffa' || this.playerTeam !== bot.team;
      if (this.isPlayerAlive && isPlayerEnemy) {
        const dist = bot.mesh.position.distanceTo(this.playerPosition);
        candidates.push({
          isPlayer: true,
          position: this.playerPosition,
          distance: dist
        });
      }

      // Check other bots as target
      for (const other of this.bots) {
        if (!other.isAlive || other.id === bot.id) continue;
        const isBotEnemy = this.gameMode === 'ffa' || other.team !== bot.team;
        if (isBotEnemy) {
          const dist = bot.mesh.position.distanceTo(other.mesh.position);
          candidates.push({
            isPlayer: false,
            bot: other,
            position: other.mesh.position,
            distance: dist
          });
        }
      }

      if (candidates.length === 0) continue;

      // Pick closest enemy
      candidates.sort((a, b) => a.distance - b.distance);
      const target = candidates[0];

      // Look at target
      bot.mesh.lookAt(target.position.x, bot.mesh.position.y, target.position.z);

      // Bot tactical movement: strafe and advance/retreat
      if (target.distance > 18) {
        // Advance
        const dir = target.position.clone().sub(bot.mesh.position).normalize();
        bot.mesh.position.x += dir.x * 5.2 * dt;
        bot.mesh.position.z += dir.z * 5.2 * dt;
      } else if (target.distance < 7) {
        // Back off
        const dir = bot.mesh.position.clone().sub(target.position).normalize();
        bot.mesh.position.x += dir.x * 4.2 * dt;
        bot.mesh.position.z += dir.z * 4.2 * dt;
      } else {
        // Strafe circle around target
        const strafe = Math.sin(performance.now() * 0.003 + bot.kills * 1.5) * 3.8;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(bot.mesh.quaternion);
        bot.mesh.position.addScaledVector(right, strafe * dt);
      }

      // Bot firing logic
      bot.shootCooldown -= dt;
      if (bot.shootCooldown <= 0 && target.distance < 45) {
        bot.shootCooldown = 0.9 + Math.random() * 1.2;
        if (target.isPlayer) {
          this.botShootPlayer(bot);
        } else if (target.bot) {
          this.botShootBot(bot, target.bot);
        }
      }
    }
  }

  private botShootBot(attacker: BotPlayer, victim: BotPlayer) {
    if (!attacker.isAlive || !victim.isAlive) return;

    const dist = attacker.mesh.position.distanceTo(victim.mesh.position);
    const accuracy = THREE.MathUtils.clamp(0.65 - dist * 0.01, 0.25, 0.6);

    // Visual bullet tracer from attacker to victim
    const targetPos = victim.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.createBulletTracer(targetPos);

    if (Math.random() < accuracy) {
      const dmg = Math.floor(16 + Math.random() * 14);
      const isHeadshot = Math.random() < 0.2;
      const finalDmg = isHeadshot ? Math.round(dmg * 1.5) : dmg;

      // Shield absorb
      if (victim.shield > 0) {
        const sDmg = Math.min(victim.shield, finalDmg);
        victim.shield -= sDmg;
      }
      victim.health -= finalDmg;

      if (victim.health <= 0) {
        attacker.kills++;
        attacker.score += 100;
        this.killBot(victim, isHeadshot, attacker.name, attacker.team);
      }
    }
  }

  private botShootPlayer(bot: BotPlayer) {
    // Bot accuracy check
    const dist = bot.mesh.position.distanceTo(this.playerPosition);
    const accuracy = THREE.MathUtils.clamp(0.7 - dist * 0.012, 0.25, 0.65);

    if (Math.random() < accuracy) {
      // Hit player
      const rawDmg = Math.floor(14 + Math.random() * 16);
      this.damagePlayer(rawDmg, bot.name, bot.mesh.position);
    }
  }

  public damagePlayer(damage: number, attackerName: string, attackerPos: THREE.Vector3) {
    if (!this.isPlayerAlive) return;

    sound.playHurt();
    this.damageVignetteTimer = 1.0;

    // Calculate angle for red damage direction HUD arrow
    const playerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const toAttacker = attackerPos.clone().sub(this.playerPosition).normalize();
    const angle = Math.atan2(toAttacker.x, toAttacker.z) - Math.atan2(playerForward.x, playerForward.z);
    this.damageDirectionAngle = angle;

    if (this.playerShield > 0) {
      const shieldDmg = Math.min(this.playerShield, damage);
      this.playerShield -= shieldDmg;
      damage -= shieldDmg;
    }

    this.playerHealth -= damage;

    if (this.playerHealth <= 0) {
      this.handlePlayerDeath(attackerName);
    }
  }

  private handlePlayerDeath(killerName: string) {
    this.isPlayerAlive = false;
    this.playerDeaths++;
    this.killstreak = 0;

    // Find killer's team in TDM
    let killerTeam: PlayerTeam | undefined;
    if (this.gameMode === 'tdm') {
      const killerBot = this.bots.find(b => b.name === killerName);
      killerTeam = killerBot ? killerBot.team : (this.playerTeam === 'blue' ? 'red' : 'blue');
      this.teamScores[killerTeam]++;

      if (this.teamScores[killerTeam] >= this.teamTargetScore && this.matchActive) {
        const winner = killerTeam === 'blue' ? 'Blue Team' : 'Red Team';
        this.triggerMatchEnd(winner);
      }
    }

    this.killFeed.unshift({
      id: 'kf_' + Math.random(),
      killer: killerName,
      victim: 'You',
      weapon: 'Enemy Fire',
      headshot: false,
      timestamp: Date.now(),
      killerTeam,
      victimTeam: this.playerTeam
    });
    if (this.killFeed.length > 5) this.killFeed.pop();

    if (this.onPlayerDeath) {
      this.onPlayerDeath(killerName);
    }

    // Auto respawn after 3 seconds
    setTimeout(() => {
      if (this.matchActive) {
        this.respawnPlayer();
      }
    }, 3000);
  }

  // Render Pass
  private render() {
    this.renderer.clear();

    // 1. Render World
    this.renderer.render(this.scene, this.camera);

    // 2. Render Viewmodel Gun in foreground without depth clipping
    this.renderer.clearDepth();
    this.renderer.render(this.viewmodelScene, this.viewmodelCamera);
  }
}
