import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameMap, MapBlock } from '../types';
import { exportMapJSON, parseMapJSON, DEFAULT_MAPS } from '../game/maps';
import { Plus, Trash2, Play, Download, Upload, Copy, Check, RotateCcw, Box, ArrowUpRight, Zap, Heart } from 'lucide-react';

interface MapEditorProps {
  onTestPlay: (map: GameMap) => void;
  onClose: () => void;
}

export const MapEditor: React.FC<MapEditorProps> = ({ onTestPlay, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapName, setMapName] = useState('My Custom Arena');
  const [blocks, setBlocks] = useState<MapBlock[]>([
    { id: 'f1', type: 'floor', x: 0, y: 0, z: 0, w: 40, h: 1.5, d: 40, color: '#1e293b' },
    { id: 'w1', type: 'wall', x: 0, y: 4, z: -20, w: 40, h: 8, d: 1.5, color: '#0f172a' },
    { id: 'w2', type: 'wall', x: 0, y: 4, z: 20, w: 40, h: 8, d: 1.5, color: '#0f172a' },
    { id: 'w3', type: 'wall', x: -20, y: 4, z: 0, w: 1.5, h: 8, d: 40, color: '#0f172a' },
    { id: 'w4', type: 'wall', x: 20, y: 4, z: 0, w: 1.5, h: 8, d: 40, color: '#0f172a' },
    { id: 'jp1', type: 'jumppad', x: 0, y: 1, z: 0, w: 4, h: 0.8, d: 4, color: '#f59e0b' },
    { id: 'sg1', type: 'speedgate', x: 10, y: 2, z: 0, w: 2, h: 4, d: 6, color: '#10b981' },
    { id: 'hp1', type: 'healthpack', x: -10, y: 1.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' },
    { id: 'sp1', type: 'spawn', x: -12, y: 1.5, z: -12, w: 2, h: 0.2, d: 2 }
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockTypeToAdd, setBlockTypeToAdd] = useState<MapBlock['type']>('crate');
  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Three.js preview scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
    camera.position.set(30, 35, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    rendererRef.current = renderer;

    // Grid helper
    const grid = new THREE.GridHelper(80, 40, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 30);
    scene.add(dirLight);

    let angle = 0;
    let animId: number;
    const animate = () => {
      // Gentle orbit camera
      angle += 0.003;
      camera.position.x = Math.sin(angle) * 55;
      camera.position.z = Math.cos(angle) * 55;
      camera.lookAt(0, 4, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Sync 3D meshes with block state
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing meshes
    meshMapRef.current.forEach((obj) => {
      scene.remove(obj);
    });
    meshMapRef.current.clear();

    // Add updated meshes
    blocks.forEach((b) => {
      let mesh: THREE.Object3D;
      const isSel = b.id === selectedBlockId;

      if (b.type === 'healthpack') {
        const grp = new THREE.Group();
        const ch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
        const cv = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
        grp.add(ch, cv);
        grp.position.set(b.x, b.y, b.z);
        mesh = grp;
      } else if (b.type === 'spawn') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16),
          new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true })
        );
        mesh.position.set(b.x, b.y, b.z);
      } else {
        const mat = new THREE.MeshStandardMaterial({
          color: isSel ? 0xec4899 : (b.color || (b.type === 'jumppad' ? 0xf59e0b : b.type === 'speedgate' ? 0x10b981 : 0x334155)),
          wireframe: isSel
        });
        mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
        mesh.position.set(b.x, b.y, b.z);
      }

      scene.add(mesh);
      meshMapRef.current.set(b.id, mesh);
    });
  }, [blocks, selectedBlockId]);

  const handleAddBlock = () => {
    const newId = 'block_' + Date.now();
    let newBlock: MapBlock;

    if (blockTypeToAdd === 'jumppad') {
      newBlock = { id: newId, type: 'jumppad', x: 0, y: 1, z: 0, w: 4, h: 0.8, d: 4, color: '#f59e0b' };
    } else if (blockTypeToAdd === 'speedgate') {
      newBlock = { id: newId, type: 'speedgate', x: 0, y: 2, z: 0, w: 2, h: 4, d: 6, color: '#10b981' };
    } else if (blockTypeToAdd === 'healthpack') {
      newBlock = { id: newId, type: 'healthpack', x: 0, y: 1.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' };
    } else if (blockTypeToAdd === 'spawn') {
      newBlock = { id: newId, type: 'spawn', x: 0, y: 1, z: 0, w: 2, h: 0.2, d: 2 };
    } else if (blockTypeToAdd === 'wall') {
      newBlock = { id: newId, type: 'wall', x: 0, y: 3, z: 0, w: 10, h: 6, d: 1.5, color: '#334155' };
    } else if (blockTypeToAdd === 'ramp') {
      newBlock = { id: newId, type: 'ramp', x: 0, y: 2, z: 0, w: 6, h: 4, d: 8, color: '#475569' };
    } else {
      // Crate
      newBlock = { id: newId, type: 'crate', x: 0, y: 2, z: 0, w: 4, h: 4, d: 4, color: '#ca8a04' };
    }

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newId);
  };

  const handleDeleteSelected = () => {
    if (!selectedBlockId) return;
    setBlocks(blocks.filter(b => b.id !== selectedBlockId));
    setSelectedBlockId(null);
  };

  const updateSelectedBlock = (partial: Partial<MapBlock>) => {
    if (!selectedBlockId) return;
    setBlocks(blocks.map(b => (b.id === selectedBlockId ? { ...b, ...partial } : b)));
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const handleExport = () => {
    const currentMap: GameMap = {
      id: 'custom_' + Date.now(),
      name: mapName,
      author: 'Community Creator',
      description: 'Player constructed arena',
      blocks,
      isCustom: true
    };
    const json = exportMapJSON(currentMap);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const imported = parseMapJSON(importJsonText);
    if (imported) {
      setMapName(imported.name);
      setBlocks(imported.blocks);
      setShowImportModal(false);
      setImportJsonText('');
    } else {
      alert('Invalid Map JSON syntax. Please check the format.');
    }
  };

  const startTestPlay = () => {
    const customMap: GameMap = {
      id: 'custom_' + Date.now(),
      name: mapName,
      author: 'You',
      description: 'Custom community arena',
      blocks,
      isCustom: true
    };
    onTestPlay(customMap);
  };

  return (
    <div id="map-editor" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl">
            <Box className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">3D ARENA MAP EDITOR</h1>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="bg-transparent text-sm text-cyan-400 font-mono border-b border-slate-700 focus:outline-none focus:border-cyan-400 py-0.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED JSON' : 'EXPORT JSON'}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            <Upload className="w-4 h-4" />
            <span>IMPORT</span>
          </button>

          <button
            onClick={startTestPlay}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono rounded-xl shadow-lg shadow-emerald-500/20 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>TEST PLAY</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500/50 rounded-xl text-xs font-mono transition"
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar: Object Palette */}
        <div className="w-72 border-r border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">ADD OBJECT</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'crate', label: 'Crate', icon: Box, color: 'text-amber-400' },
                { type: 'wall', label: 'Wall', icon: Box, color: 'text-blue-400' },
                { type: 'jumppad', label: 'Jump Pad', icon: ArrowUpRight, color: 'text-amber-500' },
                { type: 'speedgate', label: 'Speed Gate', icon: Zap, color: 'text-emerald-400' },
                { type: 'healthpack', label: 'Health Pack', icon: Heart, color: 'text-rose-400' },
                { type: 'spawn', label: 'Spawn Point', icon: Box, color: 'text-cyan-400' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setBlockTypeToAdd(item.type as MapBlock['type'])}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono transition ${
                    blockTypeToAdd === item.type
                      ? 'bg-indigo-600/30 border-indigo-400 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleAddBlock}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>PLACE IN ARENA</span>
            </button>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Block Inspector */}
          {selectedBlock ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">INSPECTOR</h3>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded border border-rose-500/30"
                  title="Delete Block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs font-mono text-cyan-400 uppercase">{selectedBlock.type} ({selectedBlock.id})</div>

              {/* Position Inputs */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono">POSITION (X, Y, Z)</div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="text-[10px] text-slate-500">X</label>
                    <input
                      type="number"
                      value={selectedBlock.x}
                      onChange={(e) => updateSelectedBlock({ x: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Y</label>
                    <input
                      type="number"
                      value={selectedBlock.y}
                      onChange={(e) => updateSelectedBlock({ y: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Z</label>
                    <input
                      type="number"
                      value={selectedBlock.z}
                      onChange={(e) => updateSelectedBlock({ z: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="text-slate-400 font-mono mt-3">DIMENSIONS (W, H, D)</div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="text-[10px] text-slate-500">WIDTH</label>
                    <input
                      type="number"
                      value={selectedBlock.w}
                      onChange={(e) => updateSelectedBlock({ w: Math.max(0.5, parseFloat(e.target.value) || 1) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">HEIGHT</label>
                    <input
                      type="number"
                      value={selectedBlock.h}
                      onChange={(e) => updateSelectedBlock({ h: Math.max(0.2, parseFloat(e.target.value) || 1) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">DEPTH</label>
                    <input
                      type="number"
                      value={selectedBlock.d}
                      onChange={(e) => updateSelectedBlock({ d: Math.max(0.5, parseFloat(e.target.value) || 1) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              Click any block in the list below or place a new one to inspect and tweak properties.
            </div>
          )}

          <div className="h-px bg-slate-800" />

          {/* Block Hierarchy List */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">MAP OBJECTS ({blocks.length})</h3>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlockId(b.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs font-mono transition ${
                    selectedBlockId === b.id
                      ? 'bg-indigo-600/40 border border-indigo-400 text-white'
                      : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="capitalize">{b.type}</span>
                  <span className="text-[10px] text-slate-500">({b.x}, {b.z})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Canvas Preview */}
        <div className="flex-1 relative bg-slate-950">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            Preview Orbiting | {blocks.length} elements placed
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold font-heading text-white mb-2">IMPORT COMMUNITY LEVEL</h3>
            <p className="text-xs text-slate-400 mb-4">Paste the JSON map string exported from another player:</p>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{ "name": "Skyline", "blocks": [...] }'
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono"
              >
                CANCEL
              </button>
              <button
                onClick={handleImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold"
              >
                LOAD MAP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
