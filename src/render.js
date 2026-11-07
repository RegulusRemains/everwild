/* Everwild — procedural woodland illustration, with no external assets. */
(function (root) {
  'use strict';
  const { WORLD, CAMPS } = root.Everwild;
  const TAU = Math.PI * 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const roads = [[180, 200], [310, 260], [430, 325], [550, 335], [710, 325], [860, 345], [970, 415], [1090, 410], [1190, 560], [1240, 720], [1330, 890], [1460, 980], [1570, 1040], [1730, 1140]];
  function random(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function canvas(w, h) {
    const result = document.createElement('canvas');
    result.width = w; result.height = h;
    return result;
  }
  function ellipse(c, x, y, rx, ry, fill, stroke) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }
  function polygon(c, points, fill, stroke) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }
  function line(c, points, color, width = 1) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function text(c, value, x, y, size = 11, color = '#e2d7b1', serif = false) {
    c.font = `${serif ? '' : '500 '}${size}px ${serif ? 'Georgia, serif' : 'system-ui, sans-serif'}`;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 3; c.strokeStyle = '#14261ed9'; c.strokeText(value, x, y);
    c.fillStyle = color; c.fillText(value, x, y);
  }
  function roadDistance(x, y) {
    let result = Infinity;
    for (let i = 1; i < roads.length; i++) {
      const [ax, ay] = roads[i - 1], [bx, by] = roads[i];
      const t = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
      result = Math.min(result, Math.hypot(x - ax - (bx - ax) * t, y - ay - (by - ay) * t));
    }
    return result;
  }
  function traceRoad(c) {
    c.beginPath(); c.moveTo(...roads[0]);
    for (let i = 1; i < roads.length - 1; i++) {
      c.quadraticCurveTo(...roads[i], (roads[i][0] + roads[i + 1][0]) / 2, (roads[i][1] + roads[i + 1][1]) / 2);
    }
    c.lineTo(...roads[roads.length - 1]);
  }
  function lake(c) {
    c.beginPath(); c.moveTo(245, 850);
    c.bezierCurveTo(240, 760, 350, 733, 415, 784);
    c.bezierCurveTo(478, 750, 540, 800, 512, 881);
    c.bezierCurveTo(558, 958, 482, 1043, 400, 1020);
    c.bezierCurveTo(310, 1070, 222, 979, 245, 850); c.closePath();
  }

  class Renderer {
    constructor(surface) {
      this.canvas = surface;
      this.ctx = surface.getContext('2d');
      this.camera = { x: 0, y: 0 };
      this.width = 1; this.height = 1; this.dpr = 1; this.zoom = 1.3;
      this.trees = [];
      this.treeSprites = Array.from({ length: 8 }, (_, i) => this._treeSprite(i));
      this.terrain = this._terrain();
      this.mapTexture = this._mapTexture();
      this.resize(surface.clientWidth || surface.width || 960, surface.clientHeight || surface.height || 620);
    }

    resize(width, height, dpr = 1) {
      this.width = Math.max(1, Math.round(Number(width) || 1));
      this.height = Math.max(1, Math.round(Number(height) || 1));
      this.dpr = clamp(Number(dpr) || 1, 1, 3);
      this.zoom = this.width < 600 ? 1.15 : 1.3;
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
    }

    worldToScreen(x, y) {
      return { x: (x - this.camera.x) * this.zoom, y: (y - this.camera.y) * this.zoom };
    }

    screenToWorld(x, y) {
      return { x: x / this.zoom + this.camera.x, y: y / this.zoom + this.camera.y };
    }

    _visible(x, y, margin = 130) {
      return x > this.camera.x - margin && x < this.camera.x + this.width / this.zoom + margin &&
        y > this.camera.y - margin && y < this.camera.y + this.height / this.zoom + margin;
    }

    _terrain() {
      const image = canvas(WORLD.w, WORLD.h), c = image.getContext('2d'), r = random(47629);
      c.fillStyle = '#36583b'; c.fillRect(0, 0, WORLD.w, WORLD.h);
      for (let i = 0; i < 1500; i++) {
        ellipse(c, r() * WORLD.w, r() * WORLD.h, 8 + r() * 80, 4 + r() * 37,
          ['#67824b13', '#203f3020', '#81945b12', '#193d2c1a'][i % 4]);
      }
      for (const place of [WORLD.spawn, ...CAMPS]) {
        const glow = c.createRadialGradient(place.x, place.y, 15, place.x, place.y, 210);
        glow.addColorStop(0, '#7f885c6b'); glow.addColorStop(0.65, '#62794e35'); glow.addColorStop(1, '#62794e00');
        c.fillStyle = glow; c.fillRect(place.x - 210, place.y - 210, 420, 420);
      }
      for (let i = 0; i < 14000; i++) {
        const x = r() * WORLD.w, y = r() * WORLD.h;
        c.strokeStyle = i % 4 ? '#a8b56a21' : '#1d392a40'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1 + r() * 3, y - 2 - r() * 3); c.stroke();
      }
      // The worn path remains legible against the darker forest floor.
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [width, color] of [[76, '#71805938'], [59, '#9387604d'], [45, '#9b8c64'], [32, '#ab9970']]) {
        traceRoad(c); c.lineWidth = width; c.strokeStyle = color; c.stroke();
      }
      for (let i = 0; i < 2300; i++) {
        const x = 130 + r() * 1660, y = 160 + r() * 1040;
        if (roadDistance(x, y) < 23) ellipse(c, x, y, 0.6 + r() * 2.8, 0.4 + r(), i % 3 ? '#ddc59a45' : '#665c4245');
      }
      lake(c); c.fillStyle = '#84906b'; c.lineWidth = 18; c.strokeStyle = '#70835b'; c.stroke(); c.fill();
      const water = c.createLinearGradient(220, 750, 520, 1050);
      water.addColorStop(0, '#497f77'); water.addColorStop(1, '#264e4d');
      lake(c); c.fillStyle = water; c.fill(); c.lineWidth = 3; c.strokeStyle = '#a7b99555'; c.stroke();
      c.save(); lake(c); c.clip();
      for (let i = 0; i < 100; i++) {
        const x = 220 + r() * 330, y = 760 + r() * 300;
        line(c, [[x, y], [x + 7 + r() * 30, y]], '#c5d2ae1c', 1);
      }
      for (let i = 0; i < 15; i++) {
        const x = 270 + r() * 215, y = 815 + r() * 170;
        ellipse(c, x, y, 5, 2.7, '#80936c');
        if (i % 4 === 0) ellipse(c, x + 1, y - 1, 2, 1.2, '#e6d9bb');
      }
      c.restore();
      // Broken flagstones and moss give the southeastern crypt its own palette.
      c.save();
      polygon(c, [[1205, 780], [1430, 735], [1690, 875], [1760, 1160], [1570, 1230], [1240, 1080], [1165, 930]], '#465548'); c.clip();
      for (let row = 0; row < 16; row++) for (let col = 0; col < 15; col++) {
        const x = 1150 + col * 44 + (row % 2) * 22, y = 730 + row * 35;
        c.fillStyle = ['#697362', '#5b695b', '#626f60', '#73806a'][Math.floor(r() * 4)];
        c.globalAlpha = 0.5 + r() * 0.35; c.fillRect(x + 2, y + 2, 41, 32);
        if (r() > 0.65) line(c, [[x + 8, y + 2], [x + 19, y + 16], [x + 13, y + 33]], '#344b3d', 1);
      }
      c.globalAlpha = 1; c.restore();
      for (let i = 0; i < 100; i++) {
        const x = 1170 + r() * 590, y = 740 + r() * 490;
        ellipse(c, x, y, 5 + r() * 12, 2 + r() * 4, '#82935b45');
      }
      // Reproducible decor; clearings and the main route stay open.
      for (let i = 0; i < 700; i++) {
        const x = 25 + r() * (WORLD.w - 50), y = 40 + r() * (WORLD.h - 65);
        if (roadDistance(x, y) < 62 || Math.hypot(x - 260, y - 250) < 175 ||
            CAMPS.some(camp => Math.hypot(x - camp.x, y - camp.y) < 172) ||
            (x > 190 && x < 570 && y > 715 && y < 1080) ||
            (x > 1150 && x < 1770 && y > 735 && y < 1235)) continue;
        if (this.trees.some(tree => Math.hypot(x - tree.x, y - tree.y) < 38)) continue;
        const tree = { x, y, sprite: Math.floor(r() * 8), scale: 0.72 + r() * 0.48 };
        this.trees.push(tree);
        ellipse(c, x + 14, y + 4, 35 * tree.scale, 11 * tree.scale, '#132e2438');
      }
      for (let i = 0; i < 280; i++) {
        const x = r() * WORLD.w, y = r() * WORLD.h;
        if (roadDistance(x, y) < 31 || (x > 215 && x < 545 && y > 745 && y < 1050)) continue;
        if (i % 3 === 0) {
          ellipse(c, x + 3, y + 3, 7, 3, '#102d2533');
          polygon(c, [[x - 6, y], [x - 3, y - 5], [x + 4, y - 6], [x + 8, y], [x + 2, y + 3]], '#77806a', '#4b614b');
          line(c, [[x - 3, y - 4], [x + 1, y - 2], [x + 5, y - 4]], '#a0a78a66');
        } else {
          for (let j = 0; j < 4; j++) {
            const px = x + r() * 12, py = y + r() * 5;
            line(c, [[px, py + 2], [px + 1, py - 6]], '#93a16d', 0.8);
            ellipse(c, px + 1, py - 6, 1.3, 1, i % 5 ? '#c9c58b' : '#b79db5');
          }
        }
      }
      return image;
    }

    _treeSprite(index) {
      const image = canvas(128, 168), c = image.getContext('2d'), r = random(437 + index * 119);
      c.translate(64, 155); c.lineJoin = 'round';
      polygon(c, [[-7, 0], [-4, -61], [4, -64], [7, 0]], '#5e5537', '#263f2e');
      line(c, [[-1, -4], [1, -57]], '#998058', 2);
      line(c, [[0, -40], [-18, -64]], '#665b3d', 4);
      line(c, [[3, -47], [21, -78]], '#665b3d', 4);
      const pine = index % 3 !== 0;
      if (pine) {
        const shades = ['#2d5239', '#3d6441', '#4c7248', '#628050'];
        for (let tier = 0; tier < 4; tier++) {
          const y = -17 - tier * 23, width = 47 - tier * 9;
          polygon(c, [[-width, y], [-width * 0.72, y - 17], [-width * 0.83, y - 17], [-width * 0.38, y - 37], [0, y - 66], [width * 0.4, y - 39], [width * 0.76, y - 17], [width * 0.6, y - 16], [width, y - 2], [width * 0.4, y + 3], [0, y + 6]], shades[(tier + index) % 2 + 1], '#254832');
          line(c, [[-width * 0.63, y - 15], [-width * 0.29, y - 34], [0, y - 57]], '#91a56544', 1.3);
          for (let j = 0; j < 5; j++) {
            const px = (r() - 0.5) * width, py = y - 6 - r() * 24;
            line(c, [[px - 3, py + 3], [px, py - 2], [px + 5, py + 1]], '#a0ad6c26', 1);
          }
        }
      } else {
        for (const [x, y, rx, ry] of [[-28, -61, 26, 28], [27, -66, 28, 31], [0, -91, 33, 31], [-22, -92, 24, 27], [5, -67, 39, 35]]) {
          const g = c.createRadialGradient(x - 10, y - 10, 1, x, y, rx * 1.2);
          g.addColorStop(0, index > 3 ? '#809455' : '#6b8a4d'); g.addColorStop(1, '#365d39');
          ellipse(c, x, y, rx, ry, g, '#315735');
        }
        for (let j = 0; j < 55; j++) {
          const a = r() * TAU, radius = Math.sqrt(r()) * 42;
          ellipse(c, Math.cos(a) * radius - 4, -80 + Math.sin(a) * radius * 0.65, 2 + r() * 4, 1.2 + r() * 2, '#c0c87822');
        }
      }
      return image;
    }

    _mapTexture() {
      const image = canvas(380, 270), c = image.getContext('2d');
      c.drawImage(this.terrain, 0, 0, 380, 270);
      for (const tree of this.trees) ellipse(c, tree.x / 5, tree.y / 5 - 3, 4.5 * tree.scale, 5.5 * tree.scale, '#284e32b3');
      c.fillStyle = '#18322426'; c.fillRect(0, 0, 380, 270);
      return image;
    }

    draw(game) {
      const c = this.ctx, p = game.player, time = game.clock || 0;
      this.camera.x = clamp(p.x - this.width / this.zoom / 2, 0, Math.max(0, WORLD.w - this.width / this.zoom));
      this.camera.y = clamp(p.y - this.height / this.zoom / 2, 0, Math.max(0, WORLD.h - this.height / this.zoom));
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = '#203d2c'; c.fillRect(0, 0, this.width, this.height);
      c.save(); c.scale(this.zoom, this.zoom); c.translate(-this.camera.x, -this.camera.y);
      c.drawImage(this.terrain, 0, 0);
      this._groundDetails(c, game, time);
      const actors = [{ kind: 'player', entity: p, y: p.y }];
      if (game.pet) actors.push({ kind: 'pet', entity: game.pet, y: game.pet.y });
      for (const mob of game.mobs) if (mob.alive && this._visible(mob.x, mob.y)) actors.push({ kind: 'mob', entity: mob, y: mob.y });
      const objects = [...actors, { kind: 'lodge', x: 140, y: 175 }, { kind: 'stone', x: WORLD.spawn.x - 58, y: WORLD.spawn.y - 36 }];
      for (const tree of this.trees) if (this._visible(tree.x, tree.y)) objects.push({ kind: 'tree', ...tree });
      for (const camp of CAMPS) if (this._visible(camp.x, camp.y, 220)) objects.push({ kind: 'camp', camp, y: camp.y - 25 });
      objects.sort((a, b) => a.y - b.y);
      for (const object of objects) {
        c.save();
        if (object.kind === 'tree') {
          const occludes = actors.some(({ entity: e }) => Math.abs(e.x - object.x) < 43 * object.scale && e.y < object.y + 9 && e.y > object.y - 116 * object.scale);
          c.globalAlpha = occludes ? 0.25 : 1;
          c.drawImage(this.treeSprites[object.sprite], object.x - 64 * object.scale, object.y - 155 * object.scale, 128 * object.scale, 168 * object.scale);
        } else if (object.kind === 'lodge') this._lodge(c, object.x, object.y, p);
        else if (object.kind === 'stone') this._bindstone(c, object.x, object.y, time, p);
        else if (object.kind === 'camp') this._camp(c, object.camp, time);
        else this._actor(c, object.kind, object.entity, game, time);
        c.restore();
      }
      for (const camp of CAMPS) if (this._visible(camp.x, camp.y)) {
        text(c, camp.name, camp.x, camp.y - 158, 15, '#e0d6b5', true);
        text(c, `LEVEL ${camp.level}–${camp.level + 1}`, camp.x, camp.y - 141, 7, '#b6c69d');
      }
      this._effects(c, game, time);
      for (let i = 0; i < 32; i++) {
        const x = (i * 269 + Math.sin(time * 0.22 + i) * 19 + 80) % WORLD.w;
        const y = (i * 173 + Math.cos(time * 0.16 + i) * 15 + 140) % WORLD.h;
        if (this._visible(x, y, 5)) ellipse(c, x, y, 0.8, 0.8, `rgba(231,223,154,${0.18 + 0.2 * (1 + Math.sin(time + i)) / 2})`);
      }
      c.restore();
      const vignette = c.createRadialGradient(this.width / 2, this.height / 2, this.width * 0.17, this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.64);
      vignette.addColorStop(0, '#0b201600'); vignette.addColorStop(1, '#0b20164a');
      c.fillStyle = vignette; c.fillRect(0, 0, this.width, this.height);
    }

    _groundDetails(c, game, time) {
      const spawn = WORLD.spawn;
      ellipse(c, spawn.x - 58, spawn.y - 33, 50, 22, '#c9cc7d0b', '#c1cb8a21');
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12;
        ellipse(c, spawn.x - 58 + Math.cos(a) * 44, spawn.y - 33 + Math.sin(a) * 21, 4, 2.3, '#8e9673', '#526448');
      }
      if (game.moveTarget) {
        const { x, y } = game.moveTarget;
        c.lineWidth = 1.2;
        ellipse(c, x, y, 8 + Math.sin(time * 5), 4, null, '#e8d498aa');
        line(c, [[x - 3, y], [x + 3, y]], '#eadcb5', 1);
        line(c, [[x, y - 2], [x, y + 2]], '#eadcb5', 1);
      }
      if (game.selected) {
        const m = game.selected;
        c.lineWidth = 1.4; ellipse(c, m.x, m.y + 1, 20, 9, '#bd664222', '#edbd82');
        c.save(); c.translate(m.x, m.y + 1); c.scale(1, 0.45); c.rotate(time * 0.65);
        for (let i = 0; i < 4; i++) {
          c.rotate(Math.PI / 2); line(c, [[-4, -27], [0, -23], [4, -27]], '#ecd098', 1.4);
        }
        c.restore();
      }
      if (game.cast) {
        const progress = clamp((time - game.cast.started) / (game.cast.done - game.cast.started), 0, 1);
        c.save(); c.translate(game.player.x, game.player.y + 2); c.scale(1, 0.5);
        c.lineWidth = 2; ellipse(c, 0, 0, 25, 25, '#b4c9a310', '#b9c8a055');
        c.beginPath(); c.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + TAU * progress); c.strokeStyle = '#ead699'; c.stroke();
        c.rotate(-time * 0.6);
        for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); polygon(c, [[0, -31], [-2, -28], [2, -28]], '#d7d6a6'); }
        c.restore();
      }
      if (game.meditate) {
        const p = game.player;
        for (let i = 0; i < 3; i++) {
          const phase = (time * 0.45 + i / 3) % 1;
          ellipse(c, p.x, p.y + 2, 15 + phase * 17, 7 + phase * 6, null, `rgba(176,205,174,${(1 - phase) * 0.3})`);
        }
      }
    }

    _lodge(c, x, y, player) {
      c.translate(x, y);
      if (Math.abs(player.x - x) < 70 && player.y < y + 5 && player.y > y - 110) c.globalAlpha = 0.4;
      ellipse(c, 11, 7, 77, 18, '#152b2540');
      polygon(c, [[-62, -58], [58, -58], [58, 0], [-62, 0]], '#998b64', '#3d4b35');
      c.fillStyle = '#526046'; c.fillRect(-65, -7, 127, 11);
      for (const bx of [-58, -8, 54]) { c.fillStyle = '#574a34'; c.fillRect(bx, -57, 5, 53); }
      line(c, [[-60, -45], [56, -45]], '#554b36', 4);
      polygon(c, [[-74, -54], [-13, -107], [71, -55], [57, -48], [-62, -47]], '#65523d', '#2c3c2b');
      polygon(c, [[-74, -54], [-13, -107], [-10, -90], [-62, -47]], '#8a7651');
      for (let i = 0; i < 4; i++) line(c, [[-58 + i * 9, -63 - i * 10], [52 - i * 13, -62 - i * 7]], '#b099613c', 1);
      c.fillStyle = '#53604d'; c.fillRect(28, -104, 15, 34); c.fillStyle = '#7c856b'; c.fillRect(25, -108, 21, 6);
      c.fillStyle = '#3b4231'; c.fillRect(-23, -36, 26, 37); c.fillStyle = '#665638'; c.fillRect(-20, -34, 21, 33);
      line(c, [[-14, -32], [-14, 0]], '#352f24', 1); ellipse(c, -3, -15, 1.3, 1.3, '#ddbf6f');
      for (const wx of [-45, 31]) {
        c.fillStyle = '#413c2a'; c.fillRect(wx - 10, -34, 21, 21);
        c.fillStyle = '#d3b873'; c.fillRect(wx - 7, -31, 15, 15);
        line(c, [[wx, -31], [wx, -16]], '#695638', 2); line(c, [[wx - 7, -24], [wx + 7, -24]], '#695638', 2);
      }
      text(c, 'WILLOWMERE', -4, 20, 7, '#bdc7a1');
    }

    _bindstone(c, x, y, time, player) {
      c.translate(x, y);
      const glow = c.createRadialGradient(0, -20, 2, 0, -20, 47);
      glow.addColorStop(0, '#b9e0bc37'); glow.addColorStop(1, '#a6d5ad00'); c.fillStyle = glow; c.fillRect(-47, -67, 94, 94);
      ellipse(c, 0, 1, 18, 8, '#9a9c77', '#495f48'); ellipse(c, 0, -2, 15, 6, '#74846a');
      const float = Math.sin(time * 1.5) * 1.7;
      polygon(c, [[0, -48 + float], [-11, -27 + float], [-8, -10 + float], [0, -4 + float], [11, -15 + float], [9, -33 + float]], '#a7c5ad', '#d3e8c1');
      polygon(c, [[0, -48 + float], [0, -4 + float], [-8, -10 + float], [-11, -27 + float]], '#699a8d');
      polygon(c, [[0, -48 + float], [9, -33 + float], [0, -24 + float]], '#d8e7bd');
      line(c, [[-3, -27 + float], [4, -24 + float], [-3, -19 + float]], '#eaf0c8', 1);
      text(c, 'Bindstone', 0, 22, 11, '#d9e1bb', true);
      if (Math.hypot(player.x - WORLD.spawn.x, player.y - WORLD.spawn.y) < 110) text(c, '[ E ]  REST & RESTORE', 0, 38, 6.5, '#bdcda8');
    }

    _camp(c, camp, time) {
      c.translate(camp.x, camp.y);
      if (camp.type === 'goblin') {
        ellipse(c, 48, -19, 52, 11, '#172b2440');
        polygon(c, [[5, -28], [35, -78], [81, -31], [62, -23]], '#9b8657', '#4c5339');
        polygon(c, [[5, -28], [35, -78], [42, -24]], '#77754e', '#4e553c');
        polygon(c, [[14, -29], [34, -61], [35, -25]], '#313d2c');
        line(c, [[33, -83], [34, -75]], '#b2a06b', 2);
        line(c, [[7, -29], [-4, -17]], '#b09d72', 1); line(c, [[79, -29], [89, -17]], '#b09d72', 1);
        c.fillStyle = '#6c6241'; c.fillRect(-57, -44, 17, 13); c.strokeStyle = '#a0925d'; c.strokeRect(-57, -44, 17, 13);
        line(c, [[-56, -42], [-41, -32]], '#403f2c');
        this._fire(c, -20, 7, time, false);
      } else {
        for (const [x, y, h] of [[-49, -63, 45], [55, -72, 58], [67, 37, 25]]) {
          ellipse(c, x + 6, y + 6, 16, 6, '#152a2540');
          polygon(c, [[x - 12, y], [x - 12, y - h], [x + 9, y - h - 3], [x + 13, y]], '#88917c', '#405448');
          polygon(c, [[x + 6, y], [x + 6, y - h], [x + 9, y - h - 3], [x + 13, y]], '#57685a');
          c.fillStyle = '#a0a78c'; c.fillRect(x - 15, y - h - 4, 28, 6);
          for (let j = 12; j < h; j += 15) line(c, [[x - 11, y - j], [x + 7, y - j - 1]], '#4f6556');
          ellipse(c, x - 3, y + 1, 15, 4, '#6f8350a6');
        }
        polygon(c, [[-37, -63], [-34, -96], [-12, -117], [27, -116], [44, -101], [43, -72], [31, -80], [28, -98], [-6, -101], [-22, -88], [-24, -63]], '#737f6d', '#405448');
        for (let i = 0; i < 3; i++) { c.fillStyle = ['#536457', '#667363', '#7a826e'][i]; c.fillRect(-23 + i * 3, -66 + i * 8, 55 - i * 6, 6); }
        this._fire(c, -50, 1, time, true);
        this._fire(c, 49, 10, time + 1, true);
      }
    }

    _fire(c, x, y, time, spectral) {
      c.save(); c.translate(x, y);
      const glow = c.createRadialGradient(0, -7, 1, 0, -7, 33);
      glow.addColorStop(0, spectral ? '#91bc9950' : '#eac26e40'); glow.addColorStop(1, '#ddad6000');
      c.fillStyle = glow; c.fillRect(-33, -40, 66, 66);
      for (let i = 0; i < 7; i++) ellipse(c, Math.cos(i * TAU / 7) * 10, Math.sin(i * TAU / 7) * 5, 4, 2.5, '#8f9071', '#56684e');
      line(c, [[-7, -1], [7, 2]], '#4f432e', 4); line(c, [[-5, 3], [6, -3]], '#685131', 4);
      const flicker = Math.sin(time * 7 + x) * 2;
      polygon(c, [[-7, -2], [-5, -11], [-2, -8], [2 + flicker, -23], [5, -11], [8, -7], [6, -2], [0, 1]], spectral ? '#8cb6a3' : '#d99b54');
      polygon(c, [[-3, -1], [-2, -9], [1, -14 + flicker], [4, -4], [1, 0]], spectral ? '#d5e5ba' : '#f1d789');
      ellipse(c, Math.sin(time * 2) * 5, -25 - (time * 13 % 15), 0.8, 1.3, spectral ? '#bdd8b5' : '#e6c47e');
      c.restore();
    }

    _actor(c, kind, entity, game, time) {
      const x = entity.x, y = entity.y;
      c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
      ellipse(c, 1, 2, kind === 'pet' ? 16 : 12, kind === 'pet' ? 6 : 4.8, '#10292170');
      if (kind === 'mob' && entity.named) {
        c.lineWidth = 1;
        ellipse(c, 0, 1, 18, 8, '#c5a56318', '#d0ae6f70');
        for (let i = 0; i < 3; i++) ellipse(c, Math.sin(time * 0.6 + i * 2) * 20, -12 + Math.cos(time + i) * 10, 0.8, 0.8, '#ddc78a');
      }
      const bob = Math.sin(time * (kind === 'pet' && entity.type === 'Air' ? 3 : 2.1) + (entity.index || 0)) * 0.6;
      c.save(); c.translate(0, bob);
      if (kind === 'player') this._magician(c, game, time);
      else if (kind === 'pet') this._elemental(c, entity, time);
      else {
        if (entity.named) c.scale(1.13, 1.13);
        if (entity.returning) c.globalAlpha = 0.55;
        if (entity.type === 'goblin') this._goblin(c, entity);
        else this._skeleton(c, entity);
      }
      c.restore();
      if (kind === 'mob') {
        if (entity.rootUntil > time) {
          c.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            c.beginPath(); c.moveTo(-13 + i * 11, 4); c.bezierCurveTo(-18 + i * 11, -7, 9 - i * 5, -8, 8 - i * 7, -19);
            c.strokeStyle = '#adc184'; c.stroke();
          }
          ellipse(c, 0, 2, 15, 6, null, '#9aaf79');
        }
        if (entity.dotUntil > time) {
          for (let i = 0; i < 3; i++) {
            const phase = (time * 1.1 + i / 3) % 1;
            ellipse(c, Math.sin(i * 2 + time) * 10, -7 - phase * 28, 2 * (1 - phase) + 0.5, 4 * (1 - phase) + 1, `rgba(239,169,85,${1 - phase})`);
          }
        }
        if (entity.named || game.selectedId === entity.id || entity.aggro) {
          text(c, entity.name, 0, entity.named ? -58 : -48, entity.named ? 9 : 8, entity.named ? '#e2c78e' : '#e0d5b9');
        }
        if (entity.hp < entity.maxHp || game.selectedId === entity.id || entity.aggro) this._health(c, entity.hp / entity.maxHp, -39, entity.named ? 35 : 28, '#c68a6b');
        if (entity.aggro && !entity.returning && game.selectedId !== entity.id) text(c, '!', 16, -35, 10, '#ecc38b');
      } else if (kind === 'pet') {
        this._health(c, entity.hp / entity.maxHp, -44, 28, '#a6ba82');
        if (entity.targetId) polygon(c, [[-3, -50], [0, -46], [3, -50]], '#cdddac');
      }
    }

    _magician(c, game, time) {
      if (game.dead) c.globalAlpha = 0.55;
      const sit = game.meditate ? 5 : 0;
      c.translate(0, sit);
      polygon(c, [[-7, -7], [-7, 1 - sit], [-2, 1 - sit], [-1, -7]], '#3a392e');
      polygon(c, [[2, -7], [3, 1 - sit], [8, 1 - sit], [8, -7]], '#3a392e');
      polygon(c, [[-6, -25], [-13, -6], [-8, -2], [2, -4], [10, -2], [13, -7], [6, -25]], '#426f7b', '#203e44');
      polygon(c, [[-4, -24], [-7, -4], [-1, -5], [3, -23]], '#648e92');
      polygon(c, [[3, -23], [3, -4], [10, -2], [8, -19]], '#355966');
      line(c, [[-11, -6], [-7, -3], [2, -5], [10, -3]], '#c5b17a', 1.3);
      line(c, [[-7, -16], [8, -16]], '#a68b56', 2);
      ellipse(c, 1, -16, 1.7, 1.7, '#ddc78e');
      polygon(c, [[-6, -24], [-13, -15], [-10, -11], [-4, -17]], '#557c82', '#284a51');
      polygon(c, [[6, -24], [12, -16], [10, -12], [4, -18]], '#527b83', '#284a51');
      ellipse(c, 11, -13, 2.1, 2.3, '#d7be92');
      line(c, [[15, 1], [14, -32], [18, -37]], '#6d5635', 2.6);
      ellipse(c, 17, -35, 3.8, 4.5, '#c5b47d', '#e7d69e');
      ellipse(c, 17, -36, 1.7, 2, game.cast ? '#f5e7bc' : '#b9d3bb');
      polygon(c, [[-10, -29], [-7, -36], [1, -41], [9, -33], [10, -24], [5, -21], [-7, -23]], '#365d6a', '#213f49');
      polygon(c, [[-7, -31], [-5, -35], [3, -34], [7, -29], [5, -24], [-3, -24]], '#d0bd94');
      polygon(c, [[-10, -29], [-7, -36], [1, -41], [5, -36], [-3, -34], [-6, -27], [-6, -23]], '#698a8a');
      line(c, [[-2, -28], [0, -28]], '#3b4437', 1); line(c, [[4, -28], [5, -28]], '#3b4437', 1);
      line(c, [[-9, -25], [-5, -22], [4, -22], [8, -25]], '#c6b27c', 1.2);
      if (game.shieldUntil > time) {
        c.lineWidth = 1.2;
        ellipse(c, 0, -20, 23, 29, '#badade0b', '#bddadd99');
        c.beginPath(); c.ellipse(0, -20, 23, 29, 0, time * 0.5, time * 0.5 + 1.2); c.strokeStyle = '#e5edce'; c.stroke();
      }
      if (game.cast) {
        const colors = ['#ced4a2', '#f0c38a', '#e7a777', '#b4d3a5', '#c7e0b3', '#cae8e0', '#c6e0e8', '#dbe4b3'];
        const glow = c.createRadialGradient(17, -36, 0, 17, -36, 16);
        glow.addColorStop(0, colors[game.cast.i]); glow.addColorStop(1, '#e4d1a000');
        c.fillStyle = glow; c.fillRect(1, -52, 32, 32);
        for (let i = 0; i < 3; i++) {
          const a = time * 3 + i * TAU / 3;
          ellipse(c, 17 + Math.cos(a) * 11, -36 + Math.sin(a) * 8, 1.2, 1.2, colors[game.cast.i]);
        }
      }
    }

    _elemental(c, pet, time) {
      if (pet.type === 'Air') {
        c.translate(0, Math.sin(time * 3) * 2 - 3);
        for (let i = 0; i < 4; i++) {
          c.lineWidth = 3 - i * 0.35;
          c.beginPath(); c.ellipse(Math.sin(time * 2 + i) * 3, -8 - i * 7, 7 + i * 3, 4, -0.15, time * 1.5 + i, time * 1.5 + i + 4.8);
          c.strokeStyle = ['#97c9bf', '#b0d8cd', '#d3e5d7', '#98c7c5'][i]; c.stroke();
        }
        polygon(c, [[-12, -28], [-7, -38], [0, -35], [10, -39], [12, -27], [5, -20], [-5, -21]], '#bad8cb99');
        ellipse(c, -4, -29, 1.5, 1.2, '#f1edce'); ellipse(c, 5, -29, 1.5, 1.2, '#f1edce');
        return;
      }
      for (const [x, y, s] of [[-9, -3, 1], [9, -3, 1], [-15, -20, 0.9], [15, -20, 0.9]]) {
        polygon(c, [[x - 6 * s, y], [x - 7 * s, y - 10 * s], [x - 1, y - 15 * s], [x + 6 * s, y - 10 * s], [x + 7 * s, y - 2]], '#7b8269', '#40533e');
        line(c, [[x - 5, y - 10], [x, y - 12], [x + 4, y - 8]], '#b2b28b', 1);
      }
      polygon(c, [[-13, -25], [-7, -32], [8, -31], [14, -24], [10, -10], [-9, -10]], '#8c9474', '#43553e');
      polygon(c, [[-12, -23], [-3, -19], [-4, -11], [-9, -10]], '#65785b');
      line(c, [[-7, -29], [0, -25], [7, -28]], '#c2bd92', 1.5);
      polygon(c, [[-9, -34], [-5, -42], [7, -41], [12, -34], [8, -26], [-7, -27]], '#9aa183', '#43553e');
      polygon(c, [[-9, -34], [-5, -42], [3, -40], [-2, -35]], '#b5b492');
      c.fillStyle = '#344c3c'; c.fillRect(-5, -34, 4, 3); c.fillRect(4, -34, 4, 3);
      c.fillStyle = '#d0dfaf'; c.fillRect(-4, -34, 2, 2); c.fillRect(5, -34, 2, 2);
      ellipse(c, -12, -27, 5, 2, '#8d9c5a'); ellipse(c, 8, -40, 4, 2, '#8ea165');
    }

    _goblin(c, mob) {
      const shaman = /Shaman|Bramble/.test(mob.name);
      line(c, [[-5, -9], [-6, 0], [-10, 0]], '#59573b', 4); line(c, [[5, -9], [6, 0], [10, 1]], '#59573b', 4);
      polygon(c, [[-7, -24], [-10, -10], [-4, -8], [1, -10], [8, -8], [8, -23]], shaman ? '#776c62' : '#98734d', '#3e4f31');
      line(c, [[-8, -14], [8, -14]], '#4e4930', 2.5);
      line(c, [[-8, -23], [-13, -14]], '#91a162', 4); line(c, [[8, -22], [12, -15]], '#91a162', 4);
      polygon(c, [[-7, -32], [-16, -34], [-11, -27], [-5, -26]], '#96a765', '#475d3b');
      polygon(c, [[7, -32], [16, -35], [12, -27], [5, -26]], '#96a765', '#475d3b');
      ellipse(c, 0, -29, 8, 8, '#a1ad6b', '#4e633e');
      polygon(c, [[-8, -33], [-5, -39], [5, -37], [9, -32], [0, -34]], shaman ? '#8a8270' : '#5b6f42');
      line(c, [[-6, -30], [-2, -29]], '#344731', 1.5); line(c, [[3, -29], [6, -31]], '#344731', 1.5);
      polygon(c, [[0, -29], [-2, -24], [3, -25]], '#bdbe7c');
      line(c, [[-3, -22], [3, -22]], '#596040', 1);
      line(c, [[13, -9], [15, -30]], '#635235', 2.5);
      if (shaman) ellipse(c, 15, -30, 4, 4, '#b7b982', '#5d6746');
      else polygon(c, [[14, -27], [13, -37], [17, -41], [18, -28]], '#afb49a', '#54664d');
    }

    _skeleton(c, mob) {
      const bone = mob.named ? '#d3caa7' : '#c4c5a7';
      line(c, [[-4, -14], [-5, -5], [-8, 0], [-11, 0]], bone, 3);
      line(c, [[4, -14], [6, -6], [6, 0], [10, 1]], bone, 3);
      line(c, [[0, -29], [0, -11]], bone, 3);
      for (let i = 0; i < 3; i++) line(c, [[-7 + i, -26 + i * 4], [0, -24 + i * 4], [7 - i, -26 + i * 4]], bone, 2);
      line(c, [[-4, -13], [4, -13]], bone, 3);
      line(c, [[-7, -27], [-12, -20], [-11, -13]], bone, 3);
      line(c, [[7, -27], [12, -23], [15, -17]], bone, 3);
      ellipse(c, 0, -34, 7.5, 7, bone, '#54604b');
      c.fillStyle = '#354c3d'; c.fillRect(-5, -36, 3, 3); c.fillRect(2, -36, 3, 3);
      polygon(c, [[0, -32], [-2, -29], [2, -29]], '#56634c');
      line(c, [[-4, -28], [4, -28]], '#56634c', 1);
      if (mob.named) polygon(c, [[-8, -40], [-10, -46], [-4, -43], [0, -48], [4, -43], [9, -46], [7, -40]], '#b7a46f', '#685f42');
      polygon(c, [[15, -16], [12, -32], [16, -38], [19, -32], [17, -16]], '#9da99a', '#4d6254');
      line(c, [[12, -17], [20, -18]], '#b1a274', 2);
      polygon(c, [[-16, -23], [-8, -22], [-8, -12], [-12, -8], [-17, -13]], '#647563', '#9ba486');
    }

    _health(c, ratio, y, width, color) {
      c.fillStyle = '#10271fe6'; c.fillRect(-width / 2 - 1, y - 1, width + 2, 4);
      c.fillStyle = color; c.fillRect(-width / 2, y, width * clamp(ratio, 0, 1), 2);
    }

    _effects(c, game, time) {
      for (const effect of game.effects || []) {
        if (!this._visible(effect.x, effect.y, 40)) continue;
        c.save(); c.globalAlpha = clamp(effect.life * 2, 0, 1);
        const numeric = /^[+−\-]?\d/.test(effect.text);
        text(c, effect.text, effect.x, effect.y - 25 - (1.25 - effect.life) * 22, numeric ? 13 : 10, effect.color || '#e4d6ae', numeric);
        c.restore();
      }
    }

    drawMap(surface, game, labels = false) {
      const c = surface.getContext('2d'), w = surface.width, h = surface.height;
      if (!w || !h) return;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
      c.drawImage(this.mapTexture, 0, 0, w, h);
      const sx = w / WORLD.w, sy = h / WORLD.h;
      c.lineWidth = labels ? 1.5 : 0.7;
      c.strokeStyle = '#e1d3a34d'; c.strokeRect(this.camera.x * sx, this.camera.y * sy, Math.min(WORLD.w, this.width / this.zoom) * sx, Math.min(WORLD.h, this.height / this.zoom) * sy);
      const spawn = { x: WORLD.spawn.x * sx, y: WORLD.spawn.y * sy };
      polygon(c, [[spawn.x, spawn.y - 5], [spawn.x + 3, spawn.y], [spawn.x, spawn.y + 4], [spawn.x - 3, spawn.y]], '#d8e5b8', '#263f30');
      if (labels) text(c, 'Willowmere · Bindstone', spawn.x + 14, spawn.y - 15, 11, '#e1e2bd', true);
      for (const camp of CAMPS) {
        const x = camp.x * sx, y = camp.y * sy, known = (game.discovered || []).includes(camp.id);
        ellipse(c, x, y, labels ? 5 : 3, labels ? 5 : 3, known ? '#bf9b69' : '#3a4934', known ? '#e5c996' : '#92a17b');
        if (labels) {
          text(c, known ? camp.name : 'Uncharted camp', x, y - 16, 11, known ? '#e5d5ac' : '#b1bea0', true);
          text(c, known ? `Level ${camp.level}–${camp.level + 1}` : '?', x, y + 15, 9, '#b5c49d');
        }
      }
      const x = game.player.x * sx, y = game.player.y * sy;
      ellipse(c, x, y, labels ? 8 : 5, labels ? 8 : 5, '#e5eadb18', '#e8e5bf80');
      polygon(c, [[x, y - 4], [x + 3, y + 3], [x, y + 1.5], [x - 3, y + 3]], '#f6edc5', '#314b35');
      if (labels) {
        text(c, 'N', w - 22, 23, 12, '#dfd4aa', true);
        line(c, [[w - 22, 34], [w - 22, 53]], '#c8c19b', 1);
        polygon(c, [[w - 22, 32], [w - 25, 39], [w - 19, 39]], '#d7cfa7');
        text(c, 'Willowmere Frontier', w / 2, h - 19, 13, '#d2cfaa', true);
      }
      c.restore();
    }
  }

  root.Everwild.Renderer = Renderer;
})(typeof globalThis !== 'undefined' ? globalThis : this);
