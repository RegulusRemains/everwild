/* Everwild — layered woodland illustration with a low-resolution world pass. */
(function (root) {
  'use strict';
  const { WORLD, BIOMES, biomeAt, biomeWeights, CAMPS, NPCS = [], QUESTS = [], ITEMS = {} } = root.Everwild;
  const bindstone = WORLD.bindstone || { x: WORLD.spawn.x - 58, y: WORLD.spawn.y - 36 };
  const TAU = Math.PI * 2;
  const lootNames = new Set(Object.values(ITEMS).map(item => item.name));
  const artBoxes = {"environment": [[9, 17, 298, 288], [379, 8, 196, 300], [634, 7, 300, 302], [959, 12, 290, 295], [13, 339, 290, 264], [329, 344, 282, 255], [639, 355, 290, 233], [953, 350, 289, 239], [14, 655, 286, 256], [329, 661, 281, 234], [639, 642, 289, 269], [949, 639, 298, 275], [18, 954, 285, 281], [333, 943, 264, 292], [638, 957, 274, 275], [964, 942, 271, 291]], "walk": [[38, 11, 201, 230], [294, 11, 201, 230], [550, 11, 201, 230], [806, 11, 201, 230], [19, 261, 219, 234], [275, 261, 219, 234], [531, 261, 219, 234], [787, 261, 219, 234], [22, 517, 212, 244], [278, 517, 212, 244], [534, 517, 212, 244], [790, 517, 212, 244], [32, 788, 201, 236], [288, 788, 201, 236], [544, 788, 201, 236], [800, 788, 201, 236], [25, 1024, 193, 243], [281, 1024, 193, 243], [537, 1024, 193, 243], [793, 1024, 193, 243], [23, 1282, 215, 240], [279, 1282, 215, 240], [535, 1282, 215, 240], [791, 1282, 215, 240]], "action": [[10, 22, 239, 222], [266, 22, 239, 222], [522, 22, 239, 222], [778, 22, 239, 222], [16, 283, 230, 209], [272, 283, 230, 209], [528, 283, 230, 209], [784, 283, 230, 209], [9, 523, 237, 226], [265, 523, 237, 226], [521, 523, 237, 226], [777, 523, 237, 226], [20, 775, 229, 249], [276, 775, 229, 249], [532, 775, 229, 249], [788, 775, 229, 249], [8, 1024, 246, 256], [264, 1024, 246, 256], [520, 1024, 246, 256], [776, 1024, 246, 256], [0, 1280, 256, 232], [256, 1280, 256, 232], [512, 1280, 256, 232], [768, 1280, 256, 232]]};
  artBoxes.frontier = [[13, 106, 230, 137], [269, 111, 230, 132], [548, 40, 183, 203], [781, 110, 230, 133], [13, 279, 230, 220], [269, 308, 230, 191], [525, 271, 230, 228], [781, 296, 230, 203], [13, 544, 230, 211], [269, 545, 230, 210], [525, 526, 230, 229], [781, 546, 230, 209], [13, 792, 230, 219], [269, 798, 230, 213], [525, 799, 230, 212], [781, 790, 230, 221], [21, 1058, 213, 209], [281, 1037, 206, 230], [525, 1053, 230, 214], [782, 1037, 228, 230]];
  artBoxes.journey = [[31, 14, 193, 230], [283, 14, 201, 230], [536, 14, 208, 230], [831, 70, 130, 174], [13, 277, 230, 223], [269, 292, 230, 208], [525, 292, 230, 208], [793, 270, 206, 230], [23, 526, 209, 230], [269, 605, 230, 151], [525, 582, 230, 174], [781, 592, 230, 164], [34, 782, 187, 230], [271, 812, 225, 200], [525, 799, 230, 213], [785, 880, 222, 132], [13, 1046, 230, 222], [269, 1128, 230, 140], [528, 1039, 224, 229], [782, 1102, 227, 166], [14, 1313, 228, 211], [269, 1388, 230, 136], [529, 1294, 221, 230], [781, 1305, 230, 219]];
  artBoxes.classMotion = [[0, 75, 256, 169], [256, 75, 256, 169], [512, 75, 256, 169], [768, 75, 256, 169], [0, 339, 256, 161], [256, 339, 256, 161], [512, 339, 256, 161], [768, 339, 256, 161], [0, 602, 256, 154], [256, 602, 256, 154], [512, 602, 256, 154], [768, 602, 256, 154], [0, 843, 256, 169], [256, 843, 256, 169], [512, 843, 256, 169], [768, 843, 256, 169], [0, 1107, 256, 161], [256, 1107, 256, 161], [512, 1107, 256, 161], [768, 1107, 256, 161], [0, 1370, 256, 154], [256, 1370, 256, 154], [512, 1370, 256, 154], [768, 1370, 256, 154]];
  artBoxes.roster = [[19, 14, 217, 230], [269, 14, 230, 230], [525, 14, 230, 230], [782, 14, 227, 230], [13, 270, 230, 230], [269, 270, 230, 230], [525, 270, 230, 230], [785, 270, 221, 230], [13, 526, 230, 230], [269, 526, 230, 230], [525, 526, 230, 230], [781, 526, 230, 230]];
  artBoxes.companions = [[13, 14, 230, 230], [269, 15, 230, 229], [13, 270, 230, 230], [271, 270, 226, 230]];
  const frontierTypes = {wolf:0,beetle:1,wisp:2,drake:3};
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const intentColors = { slam: '#dfad70', hex: '#e29581', heal: '#bcb6d2' };
  const activeIntent = (mob, time) => mob.intent && mob.alive && !mob.returning && !(mob.rootUntil > time) && mob.intent.done > time;
  const roads = [[180, 200], [310, 260], [430, 325], [550, 335], [710, 325], [860, 345], [970, 415], [1090, 410], [1190, 560], [1240, 720], [1330, 890], [1460, 980], [1570, 1040], [1730, 1140]];
  const roadRoutes = [roads, [[1090,410],[1550,430],[1860,670],[2290,540],[2740,580],[3060,430],[3400,520]], [[1860,670],[1900,1180],[2230,1450],[2320,1790],[2700,1940],[3040,1780],[3460,1880]]];
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
    for (const route of roadRoutes) for (let i = 1; i < route.length; i++) {
      const [ax, ay] = route[i - 1], [bx, by] = route[i];
      const t = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
      result = Math.min(result, Math.hypot(x - ax - (bx - ax) * t, y - ay - (by - ay) * t));
    }
    return result;
  }
  function traceRoad(c) {
    c.beginPath();
    for (const route of roadRoutes) {
      c.moveTo(...route[0]);
      for (let i=1;i<route.length-1;i++) c.quadraticCurveTo(...route[i],(route[i][0]+route[i+1][0])/2,(route[i][1]+route[i+1][1])/2);
      c.lineTo(...route[route.length-1]);
    }
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
      this.worldSurface = canvas(1, 1);
      this.worldCtx = this.worldSurface.getContext('2d');
      this.pixelArt = true;
      this.artStatus = {};
      const load = (name, path) => new Promise(resolve => {
        const image = new Image(); this[name] = image;
        image.onload = () => {
          this[name + 'Loaded'] = image.naturalWidth > 0; this.artStatus[name] = this[name + 'Loaded'];
          if (['floor','frontierFloor'].includes(name) && this.terrain) {
            this.trees = []; this.decor = [];
            this.terrain = this._terrain(); this.mapTexture = this._mapTexture();
          }
          resolve(this[name + 'Loaded']);
        };
        image.onerror = () => { this.artStatus[name] = false; resolve(false); };
        image.src = path;
      });
      this.artReady = Promise.all([
        load('atlas', 'assets/woodland-atlas.webp'), load('environment', 'assets/environment-atlas.webp'),
        load('companions','assets/companions-atlas.webp'), load('roster','assets/roster-atlas.webp'), load('classMotion','assets/class-motion.webp'), load('journey','assets/journey-atlas.webp'), load('frontier','assets/frontier-atlas.webp'), load('frontierFloor','assets/frontier-floor.webp'), load('walk', 'assets/walk-atlas.webp'), load('action', 'assets/action-atlas.webp'), load('floor', 'assets/floor-atlas.webp')
      ]).then(results => results.every(Boolean));
      this.camera = { x: 0, y: 0 };
      this.width = 1; this.height = 1; this.dpr = 1; this.zoom = 1.3;
      this.motionPreference = typeof root.matchMedia === 'function' ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.reducedMotion = Boolean(this.motionPreference && this.motionPreference.matches);
      this.motionPreference?.addEventListener?.('change', event => { this.reducedMotion = event.matches; });
      this.trees = [];
      this.decor = [];
      this.treeSprites = Array.from({ length: 8 }, (_, i) => this._treeSprite(i));
      this.terrain = this._terrain();
      this.mapTexture = this._mapTexture();
      this.resize(surface.clientWidth || surface.width || 960, surface.clientHeight || surface.height || 620);
    }

    _art(c, index, x, y, height) {
      if (!this.atlasLoaded) return false;
      const boxes = [[2, 7, 311, 298], [342, 0, 259, 306], [643, 4, 279, 302], [957, 7, 291, 300], [1, 330, 313, 275], [329, 326, 280, 274], [632, 332, 297, 268], [979, 324, 242, 290], [51, 634, 199, 271], [325, 633, 280, 307], [650, 629, 248, 280], [994, 675, 224, 220], [56, 941, 173, 298], [357, 940, 196, 299], [640, 948, 247, 289], [1005, 954, 181, 285]];
      const [sx, sy, sw, sh] = boxes[index];
      const width = height * sw / sh;
      c.drawImage(this.atlas, sx, sy, sw, sh, Math.round(x - width / 2), Math.round(y - height), width, height);
      return true;
    }

    _sheet(c, name, index, x, y, height) {
      if (!this[name + 'Loaded']) return false;
      const box = artBoxes[name]?.[index];
      if (!box) return false;
      const [sx, sy, sw, sh] = box, width = height * sw / sh;
      c.drawImage(this[name], sx, sy, sw, sh, Math.round(x - width / 2), Math.round(y - height), width, height);
      return true;
    }

    _pose(kind, entity, game, time) {
      const row = kind === 'player' ? 0 : kind === 'pet' ? (entity.type === 'Earth' ? 1 : 2) : entity.type === 'goblin' ? 3 : entity.ability === 'hex' ? 5 : 4;
      if (this.reducedMotion) return null;
      if(kind==='player'&&game.characterClass.skills)return null;
      if(kind==='player'&&this.classMotionLoaded){
        const cls=game.player.classId==='necromancer'?1:game.player.classId==='druid'?2:0;
        if(game.cast){const progress=clamp((time-game.cast.started)/(game.cast.done-game.cast.started),0,1);const frame=progress<.2?0:progress<.45?1:progress<.9?1+Math.floor(time*5)%2:3;return{sheet:'classMotion',index:(3+cls)*4+frame};}
        if(entity.walkUntil>time)return{sheet:'classMotion',index:cls*4+Math.floor((entity.walkDistance||0)/23)%4};
        if(entity.castReleaseUntil>time)return{sheet:'classMotion',index:(3+cls)*4+3};
        return null;
      }
      if (kind === 'player'  && game.cast) {
        const progress = clamp((time - game.cast.started) / Math.max(0.1, game.cast.done - game.cast.started), 0, 0.999);
        return { sheet: 'action', index: row * 4 + Math.min(2, Math.floor(progress * 3)) };
      }
      if (entity.strikeUntil > time) return { sheet: 'action', index: row * 4 + Math.min(3, Math.floor((time - entity.strikeAt) / 0.14)) };
      if (entity.intent) return { sheet: 'action', index: row * 4 + (entity.intent.done - time < 0.5 ? 2 : 1) };
      if (entity.walkUntil > time) return { sheet: 'walk', index: row * 4 + Math.floor(time * (row === 1 ? 5 : 8)) % 4 };
      return null;
    }

    resize(width, height, dpr = 1) {
      this.width = Math.max(1, Math.round(Number(width) || 1));
      this.height = Math.max(1, Math.round(Number(height) || 1));
      this.dpr = clamp(Number(dpr) || 1, 1, 3);
      // Keep the same vertical game scale across resolutions, while ensuring
      // ultrawide viewports never reveal an unpainted strip outside the map.
      const preferred = Math.max(1.15, Math.min(5, this.height / (this.width <= 600 ? 700 : 520))) * (this.zoomFactor || 1);
      this.zoom = Math.max(preferred, this.width / WORLD.w, this.height / WORLD.h);
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

    _texture(c, index) {
      if (!this.floorLoaded) return null;
      const tile = canvas(256, 256), t = tile.getContext('2d');
      const side = this.floor.naturalWidth / 2;
      t.drawImage(this.floor, (index % 2) * side, Math.floor(index / 2) * side, side, side, 0, 0, 256, 256);
      return c.createPattern(tile, 'repeat');
    }

    _terrain() {
      const image = canvas(WORLD.w, WORLD.h), c = image.getContext('2d'), r = random(47629);
      c.fillStyle = this._texture(c, 0) || '#284b3b'; c.fillRect(0, 0, WORLD.w, WORLD.h);
      for (let i = 0; i < 1500; i++) {
        ellipse(c, r() * WORLD.w, r() * WORLD.h, 8 + r() * 80, 4 + r() * 37,
          ['#6d88551a', '#112e3025', '#96a7760c', '#193d331a'][i % 4]);
      }
      for (const place of [WORLD.spawn, ...CAMPS]) {
        const glow = c.createRadialGradient(place.x, place.y, 15, place.x, place.y, 210);
        glow.addColorStop(0, '#7f885c6b'); glow.addColorStop(0.65, '#62794e35'); glow.addColorStop(1, '#62794e00');
        c.fillStyle = glow; c.fillRect(place.x - 210, place.y - 210, 420, 420);
      }
      for (let i = 0; i < (this.floorLoaded ? 3500 : 14000); i++) {
        const x = r() * WORLD.w, y = r() * WORLD.h;
        c.strokeStyle = i % 4 ? '#a8b56a21' : '#1d392a40'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1 + r() * 3, y - 2 - r() * 3); c.stroke();
      }
      const maskScale=12,mw=Math.ceil(WORLD.w/maskScale),mh=Math.ceil(WORLD.h/maskScale);
      const masks=BIOMES.slice(1).map(()=>canvas(mw,mh));
      const maskData=masks.map(m=>m.getContext('2d').createImageData(mw,mh));
      const forestMask=canvas(mw,mh),forestData=forestMask.getContext('2d').createImageData(mw,mh);
      for(let py=0;py<mh;py++)for(let px=0;px<mw;px++){
        const weights=biomeWeights(px*maskScale,py*maskScale),offset=(py*mw+px)*4;
        forestData.data[offset]=forestData.data[offset+1]=forestData.data[offset+2]=255;forestData.data[offset+3]=Math.round(weights[0]*255);
        for(let i=0;i<4;i++){const d=maskData[i].data;d[offset]=d[offset+1]=d[offset+2]=255;d[offset+3]=Math.round(weights[i+1]*255);}
      }
      forestMask.getContext('2d').putImageData(forestData,0,0);
      c.globalCompositeOperation='destination-in';c.drawImage(forestMask,0,0,WORLD.w,WORLD.h);c.globalCompositeOperation='lighter';
      const layer=canvas(WORLD.w,WORLD.h),lc=layer.getContext('2d');
      for(const biome of BIOMES.slice(1)){
        const tile=canvas(256,256),tc=tile.getContext('2d');
        if(this.frontierFloorLoaded){const side=this.frontierFloor.naturalWidth/2;tc.drawImage(this.frontierFloor,(biome.art%2)*side,Math.floor(biome.art/2)*side,side,side,0,0,256,256);}else{tc.fillStyle=biome.color;tc.fillRect(0,0,256,256);}
        if(biome.id==='mire'){tc.fillStyle='rgba(25,70,78,.5)';tc.fillRect(0,0,256,256);}
        const mirrored=canvas(512,512),mc=mirrored.getContext('2d');
        for(const [ix,iy]of [[0,0],[1,0],[0,1],[1,1]]){mc.save();mc.translate(ix?512:0,iy?512:0);mc.scale(ix?-1:1,iy?-1:1);mc.drawImage(tile,0,0);mc.restore();}
        lc.globalCompositeOperation='source-over';lc.clearRect(0,0,WORLD.w,WORLD.h);lc.fillStyle=lc.createPattern(mirrored,'repeat');lc.fillRect(0,0,WORLD.w,WORLD.h);
        const mask=masks[biome.art];mask.getContext('2d').putImageData(maskData[biome.art],0,0);
        lc.globalCompositeOperation='destination-in';lc.drawImage(mask,0,0,WORLD.w,WORLD.h);c.drawImage(layer,0,0);
      }
      c.globalCompositeOperation='source-over';
      // Broad patches break up the repeated ground texture: bare earth, wet peat,
      // snow shelves, ash beds, and transitional vegetation within each habitat.
      const patchColors=[['#6a7d3d','#1e3029','#59633d'],['#b59954','#675134','#d2b46b'],['#183c42','#628785','#233b3b'],['#bdcbd0','#526473','#d3dbdc'],['#2d2b31','#8b4a34','#a67958']];
      for(let i=0;i<620;i++){
        const x=r()*WORLD.w,y=r()*WORLD.h,biome=biomeAt(x,y),bi=BIOMES.indexOf(biome),radius=35+r()*135;
        if(Math.hypot(x-WORLD.spawn.x,y-WORLD.spawn.y)<230||CAMPS.some(c=>Math.hypot(x-c.x,y-c.y)<120))continue;
        c.save();c.translate(x,y);c.rotate(r()*TAU);c.scale(1,.4+r()*.5);
        const wash=c.createRadialGradient(0,0,0,0,0,radius);wash.addColorStop(0,patchColors[bi][i%3]+(bi===2?'90':'60'));wash.addColorStop(1,patchColors[bi][i%3]+'00');c.fillStyle=wash;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
        if(bi===2&&i%4===0){ellipse(c,x,y,radius*.55,radius*.2,'#183a4580','#708a7860');for(let j=0;j<4;j++){const rx=x+(j-2)*radius*.22;line(c,[[rx,y],[rx+2,y-13-r()*12]],'#78987e',1);}}
      }
      // The worn path remains legible against the darker forest floor.
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [width, color] of [[76, '#71805938'], [59, '#9387604d'], [45, '#9b8c64'], [32, '#ab9970']]) {
        traceRoad(c); c.lineWidth = width; c.strokeStyle = color; c.stroke();
      }
      if (this.floorLoaded) { traceRoad(c); c.lineWidth = 43; c.strokeStyle = this._texture(c, 1); c.stroke(); }
      for (let i = 0; i < 2300; i++) {
        const x = 130 + r() * 1660, y = 160 + r() * 1040;
        if (roadDistance(x, y) < 23) ellipse(c, x, y, 0.6 + r() * 2.8, 0.4 + r(), i % 3 ? '#ddc59a45' : '#665c4245');
      }
      this._villageGround(c);
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
      if (this.floorLoaded) {
        c.fillStyle = this._texture(c, 2); c.fillRect(1140, 730, 650, 520);
        c.save(); polygon(c, [[1480, 915], [1710, 875], [1770, 1160], [1570, 1240], [1480, 1120]], this._texture(c, 3)); c.restore();
      }
      for (let row = 0; !this.floorLoaded && row < 16; row++) for (let col = 0; col < 15; col++) {
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
      for (let i = 0; i < 3100; i++) {
        const x = 25 + r() * (WORLD.w - 50), y = 40 + r() * (WORLD.h - 65);
        if (roadDistance(x, y) < 62 || ((x - 270) / 222) ** 2 + ((y - 260) / 167) ** 2 < 1 ||
            CAMPS.some(camp => Math.hypot(x - camp.x, y - camp.y) < 172) ||
            (x > 190 && x < 570 && y > 715 && y < 1080) ||
            (x > 1150 && x < 1770 && y > 735 && y < 1235)) continue;
        const biome=biomeAt(x,y);
        const grove=(Math.sin(x/170)+Math.sin(y/143)+Math.sin((x+y)/220)+3)/6;
        if(grove<.26 || r()>grove+.25)continue;
        const spacing=biome.art===undefined?48:[125,115,135,160][biome.art];
        if (this.trees.some(tree => Math.hypot(x - tree.x, y - tree.y) < spacing)) continue;
        if(biome.art!==undefined && r()>[.58,.78,.72,.25][biome.art])continue;
        const tree = { kind:'tree', alpha:1, variant:r()<.38, biome:biome.id, frontier:biome.art, x, y, sprite: Math.floor(r() * 8), scale: 0.72 + r() * 0.48 };
        this.trees.push(tree);
        ellipse(c, x + 14, y + 4, 35 * tree.scale, 11 * tree.scale, '#132e2438');
      }
      for (let i = 0; i < 280; i++) {
        const x = r() * WORLD.w, y = r() * WORLD.h;
        if (x>1800 || roadDistance(x, y) < 31 || (x > 215 && x < 545 && y > 745 && y < 1050)) continue;
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
      for (let i = 0; i < 180; i++) {
        const x = 30 + r() * (WORLD.w - 60), y = 60 + r() * (WORLD.h - 110);
        if (x>1800 || roadDistance(x, y) < 45 || Math.hypot(x - WORLD.spawn.x, y - WORLD.spawn.y) < 150 || CAMPS.some(camp => Math.hypot(x - camp.x, y - camp.y) < 115) || (x > 200 && x < 550 && y > 745 && y < 1050)) continue;
        this.decor.push({ x, y, sprite: [4,5,5,6,10][i % 5], height: i % 5 === 4 ? 38 : 12 + r() * 15 });
      }
      // Seeded clusters, not uniform scatter: fallen logs and grass, mushroom
      // colonies and reeds, ice outcrops, cooling lava, vents, and charred stumps.
      for(let group=0;group<170;group++){
        const gx=1750+r()*(WORLD.w-1800),gy=70+r()*(WORLD.h-140),biome=biomeAt(gx,gy);if(biome.art===undefined)continue;
        const count=2+Math.floor(r()*5);
        for(let j=0;j<count;j++){
          const x=gx+(r()-.5)*170,y=gy+(r()-.5)*110;
          if(x<20||y<20||x>WORLD.w-20||y>WORLD.h-20||roadDistance(x,y)<42||CAMPS.some(c=>Math.hypot(x-c.x,y-c.y)<110))continue;
          const variant=1+Math.floor(r()*3),heights=[[35,24,33],[48,40,32],[35,60,45],[36,45,36]];
          this.decor.push({x,y,sheet:'journey',sprite:8+biome.art*4+variant,height:heights[biome.art][variant-1]*(.7+r()*.6)});
        }
      }
      return image;
    }

    _villageGround(c) {
      c.save();
      const paths = [[[260, 250], [305, 215], [365, 210]], [[260, 250], [228, 290], [180, 320]], [[310, 260], [354, 299], [418, 291]]];
      for (const points of paths) {
        line(c, points, '#8c906354', 29); line(c, points, '#a499704f', 18);
        for (let i = 0; i < 5; i++) {
          const t = i / 5, a = points[0], b = points[2];
          const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          polygon(c, [[x - 6, y - 3], [x + 4, y - 4], [x + 8, y + 1], [x - 3, y + 4]], '#a8a18160', '#69735460');
        }
      }
      ellipse(c, 180, 320, 36, 20, '#97b09b12', '#a7be9b66');
      ellipse(c, 180, 320, 29, 16, null, '#bed0a540');
      for (let i = 0; i < 8; i++) {
        const a = TAU * i / 8, x = 180 + Math.cos(a) * 32, y = 320 + Math.sin(a) * 18;
        line(c, [[x - 2, y + 2], [x, y - 2], [x + 2, y + 2]], '#b0c29885', 0.8);
      }
      ellipse(c, 399, 295, 54, 20, '#827e5230');
      // Small vegetable beds and stacked timber make this a lived-in refuge.
      for (let row = 0; row < 3; row++) {
        line(c, [[83, 235 + row * 10], [125, 229 + row * 10]], '#554d3466', 6);
        for (let col = 0; col < 5; col++) {
          const x = 87 + col * 8, y = 234 + row * 10 - col;
          ellipse(c, x - 1.5, y - 1, 2.5, 1.8, '#92a367'); ellipse(c, x + 1, y - 2, 2, 2.6, '#b0b97c');
        }
      }
      line(c, [[76, 231], [76, 266], [130, 258]], '#8b8158', 2);
      for (const [x, y] of [[76, 231], [76, 266], [130, 258]]) line(c, [[x, y + 3], [x, y - 9]], '#b4a06d', 3);
      c.restore();
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
      const image = canvas(420, 260), c = image.getContext('2d');
      c.drawImage(this.terrain, 0, 0, 420, 260);
      for (const tree of this.trees) ellipse(c, tree.x / 10, tree.y / 10 - 1, 2.2 * tree.scale, 2.7 * tree.scale, '#284e32b3');
      c.fillStyle = '#18322426'; c.fillRect(0, 0, 420, 260);
      return image;
    }

    draw(game) {
      const now=performance.now()/1000;this.frameDelta=Math.min(.05,Math.max(0,now-(this.lastFrameTime||now)));this.lastFrameTime=now;
      let c = this.worldCtx;
      const p = game.player, time = game.clock || 0;
      // World art uses a stable pixel grid; names and interface stay at display resolution.
      const scale = this.pixelArt ? 0.75 : this.dpr;
      const w = Math.max(1, Math.round(this.width * scale)), h = Math.max(1, Math.round(this.height * scale));
      if (this.worldSurface.width !== w || this.worldSurface.height !== h) {
        this.worldSurface.width = w; this.worldSurface.height = h;
      }
      const motionTime = this.reducedMotion ? 0 : time;
      this.camera.x = clamp(p.x - this.width / this.zoom / 2, 0, Math.max(0, WORLD.w - this.width / this.zoom));
      this.camera.y = clamp(p.y - this.height / this.zoom / 2, 0, Math.max(0, WORLD.h - this.height / this.zoom));
      c.setTransform(scale, 0, 0, scale, 0, 0);
      c.fillStyle = '#203d2c'; c.fillRect(0, 0, this.width, this.height);
      c.save();
      const hit=(game.visuals||[]).find(v=>v.kind==='impact'&&v.source==='enemy'&&v.life>v.maxLife-.12);
      if(hit&&!this.reducedMotion){const amplitude=Math.min(3,hit.amount*.075);c.translate(Math.sin(time*87)*amplitude,Math.cos(time*71)*amplitude*.5);}
      c.scale(this.zoom, this.zoom); c.translate(-this.camera.x, -this.camera.y);
      c.drawImage(this.terrain, 0, 0);
      this._visuals(c, game, false);
      this._intents(c, game, time);
      this._groundDetails(c, game, time);
      const actors = [{ kind: 'player', entity: p, y: p.y }];
      if (game.pet) actors.push({ kind: 'pet', entity: game.pet, y: game.pet.y });
      for (const mob of game.mobs) if (mob.alive && this._visible(mob.x, mob.y)) actors.push({ kind: 'mob', entity: mob, y: mob.y });
      for (const npc of NPCS) if (this._visible(npc.x, npc.y)) actors.push({ kind: 'npc', entity: npc, y: npc.y });
      const objects = [...actors, { kind: 'lodge', x: 140, y: 175 }, { kind: 'stone', x: bindstone.x, y: bindstone.y },
        { kind: 'signpost', x: 402, y: 202 }, { kind: 'study', x: 133, y: 307 }, { kind: 'market', x: 412, y: 285 }];
      for (const fallen of game.remains || []) if (this._visible(fallen.x, fallen.y)) objects.push({ kind: 'fallen', entity: fallen, y: fallen.y });
      for (const detail of this.decor) if (this._visible(detail.x, detail.y, 60)) objects.push({ kind: 'decor', ...detail });
      for (const tree of this.trees) if (this._visible(tree.x, tree.y, 190)) objects.push(tree);
      for (const camp of CAMPS) if (this._visible(camp.x, camp.y, 220)) objects.push({ kind: 'camp', camp, y: camp.y - 25 });
      objects.sort((a, b) => a.y - b.y);
      for (const object of objects) {
        c.save();
        if (object.kind === 'tree') {
          // The party and its current opponent reveal scenery; wandering monsters do not.
          const party = [p,...(game.pet?[game.pet]:[]),...(game.selected&&game.selected.aggro?[game.selected]:[])];
          let proximity=0;
          for(const e of party){
            const dx=(e.x-object.x)/(88*object.scale),dy=(e.y-23-(object.y-72*object.scale))/(88*object.scale);
            const d=Math.sqrt(dx*dx+dy*dy);
            proximity=Math.max(proximity,clamp((1.18-d)/0.4,0,1));
          }
          const desired=1-proximity*0.75;
          object.alpha += (desired-object.alpha)*(1-Math.exp(-this.frameDelta/(desired < object.alpha ? .14 : .3)));
          c.globalAlpha=object.alpha;
          if(object.frontier!==undefined){if(object.variant&&this.journeyLoaded)this._sheet(c,'journey',8+object.frontier*4,object.x,object.y,(object.frontier===3?90:145)*object.scale);else this._sheet(c,'frontier',12+object.frontier,object.x,object.y,145*object.scale);}
          else if (!this._art(c, object.sprite % 4, object.x, object.y, 156 * object.scale)) c.drawImage(this.treeSprites[object.sprite], object.x - 64 * object.scale, object.y - 155 * object.scale, 128 * object.scale, 168 * object.scale);
        } else if (object.kind === 'decor') this._sheet(c, object.sheet||'environment', object.sprite, object.x, object.y, object.height);
        else if (object.kind === 'fallen') this._fallen(c, object.entity);
        else if (object.kind === 'lodge') this._lodge(c, object.x, object.y, p);
        else if (object.kind === 'stone') this._bindstone(c, object.x, object.y, motionTime, p);
        else if (object.kind === 'camp') this._camp(c, object.camp, motionTime, actors.filter(actor => actor.kind !== 'mob' || actor.entity.aggro || actor.entity.id === game.selectedId));
        else if (['signpost', 'study', 'market'].includes(object.kind)) this._villageProp(c, object, game);
        else if (object.kind === 'npc') this._villager(c, object.entity);
        else this._actor(c, object.kind, object.entity, game, time);
        c.restore();
      }
      this._spellAuras(c, game, motionTime);
      this._visuals(c, game, true);
      c.restore();
      c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.imageSmoothingEnabled = !this.pixelArt;
      c.drawImage(this.worldSurface, 0, 0, this.width, this.height);
      c.save(); c.scale(this.zoom, this.zoom); c.translate(-this.camera.x, -this.camera.y);
      this._intents(c, game, time);
      for (const actor of actors) if (actor.kind === 'mob' || actor.kind === 'pet') this._actorLabel(c, actor.kind, actor.entity, game, time);
      for (const npc of NPCS) if (this._visible(npc.x, npc.y)) this._npcLabel(c, npc, game);
      this._effects(c, game, time);
      for (let i = 0; !this.reducedMotion && i < 32; i++) {
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
      const zone=game.sanctuary;if(zone&&zone.expiresAt>time){c.save();c.lineWidth=1.4;const fade=Math.min(1,zone.expiresAt-time);c.globalAlpha=fade;ellipse(c,zone.x,zone.y,zone.radius,zone.radius,'#a9d4960c','#abd69788');for(let i=0;i<8;i++){const a=i*TAU/8;ellipse(c,zone.x+Math.cos(a)*zone.radius,zone.y+Math.sin(a)*zone.radius,2,4,'#c9deb3');}if(!this.reducedMotion){const pulse=1-clamp((zone.nextPulse-time)/2,0,1);c.globalAlpha=fade*(1-pulse)*.25;ellipse(c,zone.x,zone.y,zone.radius*pulse,zone.radius*pulse,null,'#c7e4a9');}c.restore();}
      const motionTime = this.reducedMotion ? 0 : time;
      ellipse(c, bindstone.x, bindstone.y + 3, 50, 22, '#c9cc7d0b', '#c1cb8a21');
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12;
        ellipse(c, bindstone.x + Math.cos(a) * 44, bindstone.y + 3 + Math.sin(a) * 21, 4, 2.3, '#8e9673', '#526448');
      }
      if (game.moveTarget) {
        const { x, y } = game.moveTarget;
        c.lineWidth = 1.2;
        ellipse(c, x, y, 8 + Math.sin(motionTime * 5), 4, null, '#e8d498aa');
        line(c, [[x - 3, y], [x + 3, y]], '#eadcb5', 1);
        line(c, [[x, y - 2], [x, y + 2]], '#eadcb5', 1);
      }
      if (game.selected) {
        const m = game.selected;
        if (Math.hypot(m.x - game.player.x, m.y - game.player.y) > 330) {
          c.save(); c.setLineDash([5, 7]); c.lineWidth = 1;
          ellipse(c, game.player.x, game.player.y, 330, 330, null, '#cbd4b83d'); c.restore();
        }
        c.lineWidth = 1.4; ellipse(c, m.x, m.y + 1, 20, 9, '#bd664222', '#edbd82');
        c.save(); c.translate(m.x, m.y + 1); c.scale(1, 0.45); c.rotate(motionTime * 0.65);
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
        c.rotate(-motionTime * 0.6);
        for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); polygon(c, [[0, -31], [-2, -28], [2, -28]], '#d7d6a6'); }
        c.restore();
      }
      if(game.cast){
        const p=game.player,progress=clamp((time-game.cast.started)/(game.cast.done-game.cast.started),0,1),color=game.player.classId==='magician'?['#cbd3a1','#f3b475','#d88d7c','#bcace0','#a7d995','#a6d9e9','#bddce9','#c2dea0','#a8dff0','#efa272'][game.cast.i]:game.characterClass.color;
        c.save();c.translate(p.x+14,p.y-34);
        const radius=16+progress*12,glow=c.createRadialGradient(0,0,1,0,0,radius);glow.addColorStop(0,color+'a0');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(-radius,-radius,radius*2,radius*2);
        for(let i=0;i<8;i++){const a=i*TAU/8+(this.reducedMotion?0:time*2),r=32-progress*19;ellipse(c,Math.cos(a)*r,Math.sin(a)*r*.6,1.3+progress,1.5+progress,color);}
        ellipse(c,0,0,2+progress*4,2+progress*4,'#fff0d6');c.restore();
      }
      if (game.meditate) {
        const p = game.player;
        for (let i = 0; i < 3; i++) {
          const phase = (motionTime * 0.45 + i / 3) % 1;
          ellipse(c, p.x, p.y + 2, 15 + phase * 17, 7 + phase * 6, null, `rgba(176,205,174,${(1 - phase) * 0.3})`);
        }
      }
      if (game.pet?.mode === 'guard') {
        const pet = game.pet;
        c.save(); c.translate(pet.x, pet.y + 1); c.lineWidth = 0.8;
        ellipse(c, 0, 0, 21, 10, '#adbd8110', '#b8ca8b66');
        polygon(c, [[-5, 8], [-5, 13], [0, 17], [5, 13], [5, 8]], '#c0d59b35', '#ccdfa5a0');
        line(c, [[0, 9], [0, 13]], '#d0dfad', 0.8); c.restore();
      }
    }

    _intents(c, game, time) {
      for (const mob of game.mobs) {
        if (!activeIntent(mob, time)) continue;
        const intent = mob.intent, radius = Math.max(5, intent.radius || 24);
        if (!this._visible(intent.x, intent.y, radius + 10)) continue;
        const progress = clamp((time - intent.started) / Math.max(0.01, intent.done - intent.started), 0, 1);
        const color = intent.kind !== 'heal' && progress > 0.75 ? '#ef9b81' : intentColors[intent.kind] || intentColors.hex;
        c.save(); c.translate(intent.x, intent.y); c.lineWidth = 1.2;
        c.globalAlpha = 0.1 + progress * 0.05; ellipse(c, 0, 0, radius, radius, color);
        c.globalAlpha = 0.65; ellipse(c, 0, 0, radius, radius, null, color);
        c.globalAlpha = 0.35; c.setLineDash([4, 5]); ellipse(c, 0, 0, Math.max(1, radius - 5), Math.max(1, radius - 5), null, color); c.setLineDash([]);
        c.globalAlpha = 0.95; c.lineWidth = 2.5;
        c.beginPath(); c.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + progress * TAU); c.strokeStyle = color; c.stroke();
        // These circles use the engine's fixed world coordinates and actual radius.
        // They never chase the player after the enemy begins its windup.
        if (intent.kind === 'heal') {
          line(c, [[-5, 0], [5, 0]], color, 2); line(c, [[0, -5], [0, 5]], color, 2);
        } else {
          polygon(c, [[0, -9], [-8, 6], [8, 6]], '#2d342d80', color);
          text(c, '!', 0, 1, 9, color);
        }
        c.restore();
      }
    }

    _visuals(c, game, foreground) {
      for (const visual of game.visuals || []) {
        if (!(visual.life > 0)) continue;
        const radius = Math.max(8, visual.radius || 24);
        if (!this._visible(visual.x, visual.y, radius + 60) &&
            !(Number.isFinite(visual.fromX) && this._visible(visual.fromX, visual.fromY, 50))) continue;
        const progress = clamp(1 - visual.life / Math.max(0.001, visual.maxLife || visual.life), 0, 1);
        const fade = clamp((1 - progress) * 2, 0, 1), color = visual.color || '#d7cb9b';
        c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha = fade;
        if(visual.kind==='cast'){c.restore();continue;}
        if (visual.kind === 'melee') {
          if (foreground) {
            c.translate(visual.x, visual.y - 18); c.strokeStyle = color; c.lineWidth = 1.6;
            c.beginPath(); c.arc(0, 0, 15, -1.2, this.reducedMotion ? 0.8 : -1.2 + progress * 2.5); c.stroke();
          }
        } else if (visual.kind === 'summon') {
          c.translate(visual.x, visual.y);
          if (!foreground) {
            c.lineWidth = 1.5; ellipse(c, 0, 1, 30, 13, '#d2ddbb12', color);
            ellipse(c, 0, 1, 23, 10, null, color);
            for (let i = 0; i < 6; i++) { const a = i * TAU / 6; polygon(c, [[Math.cos(a)*28,Math.sin(a)*12-3],[Math.cos(a)*28-2,Math.sin(a)*12+2],[Math.cos(a)*28+2,Math.sin(a)*12+2]], color); }
          } else {
            for (let i = 0; i < 8; i++) {
              const a = i * 2.4 + (this.reducedMotion ? 0 : progress * 2), lift = this.reducedMotion ? 16 : progress * 55;
              ellipse(c, Math.cos(a) * (12 + progress * 13), -lift + Math.sin(a) * 7, 1.1, 2.1, color);
            }
          }
        } else if (visual.kind === 'impact' || visual.kind === 'discovery') {
          if (foreground) {
            c.translate(visual.x, visual.y - 18);
            const discovery = visual.kind === 'discovery';
            if(!discovery){const burst=c.createRadialGradient(0,0,0,0,0,24);burst.addColorStop(0,color+'b0');burst.addColorStop(1,color+'00');c.fillStyle=burst;c.fillRect(-24,-24,48,48);ellipse(c,0,0,5+progress*18,3+progress*12,null,color);}
            const spread = this.reducedMotion ? 10 : (discovery ? 12 + progress * 35 : 3 + progress * radius);
            c.globalAlpha = fade * (discovery ? 0.65 : 0.9);
            for (let i = 0; i < (discovery ? 9 : 10); i++) {
              const a = i * TAU / (discovery ? 9 : 10) + 0.35;
              const x = Math.cos(a) * spread, y = Math.sin(a) * spread * 0.7;
              c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), discovery ? 2 : 4, discovery ? 3 : 2);
            }
          }
        } else if (visual.kind === 'bolt') {
          if (foreground) this._bolt(c, visual, progress, color);
        } else {
          c.translate(visual.x, visual.y);
          if (!foreground) {
            const spread = this.reducedMotion ? 0.8 : 0.2 + progress * 0.8;
            if (visual.kind === 'nova' || visual.kind === 'taunt') {
              c.globalAlpha = fade * 0.09; ellipse(c, 0, 0, radius * spread, radius * spread, color);
              c.globalAlpha = fade * 0.85; c.lineWidth = visual.kind === 'nova' ? 2.5 : 1.5;
              ellipse(c, 0, 0, radius * spread, radius * spread, null, color);
              c.globalAlpha = fade * 0.35; ellipse(c, 0, 0, radius * spread * 0.85, radius * spread * 0.85, null, color);
            } else if (visual.kind === 'heal') {
              c.lineWidth = 1.4; ellipse(c, 0, 2, 18 + spread * 13, 7 + spread * 5, null, color);
            } else if (visual.kind === 'root') {
              c.globalAlpha = fade * 0.65; c.lineWidth = 1.4;
              ellipse(c, 0, 1, radius, radius * 0.45, null, color);
              for (let i = 0; i < 6; i++) {
                const a = i * TAU / 6, x = Math.cos(a) * radius, y = Math.sin(a) * radius * 0.45;
                line(c, [[x * 1.3, y * 1.3], [x * 1.07, y * 0.6], [x * 0.65, y * 0.65]], color, 1.5);
              }
            }
          } else if (visual.kind === 'heal') {
            if (Number.isFinite(visual.fromX)) {
              c.save(); c.strokeStyle = color; c.lineWidth = 1.2; c.globalAlpha = fade * 0.6;
              c.beginPath(); c.moveTo(visual.fromX - visual.x, visual.fromY - visual.y - 25);
              c.quadraticCurveTo((visual.fromX - visual.x) / 2, -45, 0, -22); c.stroke(); c.restore();
            }
            for (let i = 0; i < (this.reducedMotion ? 3 : 6); i++) {
              const a = i * 2.4, lift = this.reducedMotion ? 12 : progress * 28;
              const x = Math.cos(a) * 18, y = -13 - lift + Math.sin(a) * 11;
              line(c, [[x - 2, y], [x + 2, y]], color, 1.4); line(c, [[x, y - 2], [x, y + 2]], color, 1.4);
            }
          } else if (visual.kind === 'root') {
            const height = this.reducedMotion ? 25 : 8 + Math.min(1, progress * 4) * 22;
            for (let i = 0; i < 4; i++) {
              const x = -14 + i * 9;
              c.beginPath(); c.moveTo(x, 3); c.bezierCurveTo(x + 8, -height / 3, x - 8, -height / 2, x + 2, -height);
              c.strokeStyle = color; c.lineWidth = 1.5; c.stroke();
              polygon(c, [[x + 2, -height + 5], [x + 8, -height + 1], [x + 5, -height + 8]], color);
            }
          } else if (visual.kind === 'taunt') {
            const spread = this.reducedMotion ? 1 : progress;
            for (const side of [-1, 1]) {
              c.beginPath(); c.ellipse(0, -19, 22 + spread * 14, 27 + spread * 6, 0,
                side < 0 ? Math.PI * 0.8 : -Math.PI * 0.2, side < 0 ? Math.PI * 1.2 : Math.PI * 0.2);
              c.strokeStyle = color; c.lineWidth = 2; c.stroke();
            }
          } else if (visual.kind === 'nova' && !this.reducedMotion) {
            for (let i = 0; i < 10; i++) {
              const a = i * TAU / 10 + 0.3, distance = radius * (0.2 + progress * 0.8);
              const x = Math.cos(a) * distance, y = Math.sin(a) * distance - Math.sin(progress * Math.PI) * 15;
              line(c, [[x * 0.94, y * 0.94], [x, y]], color, 2 * (1 - progress) + 0.5);
            }
          }
        }
        c.restore();
      }
    }

    _bolt(c, visual, progress, color) {
      const fromX = Number.isFinite(visual.fromX) ? visual.fromX : visual.x;
      const fromY = Number.isFinite(visual.fromY) ? visual.fromY : visual.y;
      const dx = visual.x - fromX, dy = visual.y - fromY;
      const channels = /^#[0-9a-f]{6}$/i.test(color) ? [parseInt(color.slice(1, 3), 16), parseInt(color.slice(5, 7), 16)] : [200, 100];
      const frost = visual.spellIndex===8 || (visual.school!=='necromancer'&&channels[1]>channels[0]*1.1);
      const travel = this.reducedMotion ? 1 : clamp(progress / 0.58, 0, 1);
      if (travel < 1) {
        const tail = Math.max(0, travel - 0.27), arc = Math.sin(travel * Math.PI) * (frost ? 0 : 12);
        const x = fromX + dx * travel, y = fromY + dy * travel - 20 - arc;
        c.globalAlpha *= 0.65;
        const tx=fromX+dx*tail,ty=fromY+dy*tail-20-Math.sin(tail*Math.PI)*(frost?0:12);
        const trail=c.createLinearGradient(tx,ty,x,y);trail.addColorStop(0,color+'00');trail.addColorStop(.6,color+'88');trail.addColorStop(1,color);line(c,[[tx,ty],[x,y]],trail,frost?5:8);
        for(let i=0;i<7;i++){const t=Math.max(0,travel-i*.032),jitter=Math.sin(i*4.3+progress*19)*5;const sx=fromX+dx*t,sy=fromY+dy*t-20-Math.sin(t*Math.PI)*(frost?0:12)+jitter;c.globalAlpha=(1-i/8)*.7;ellipse(c,sx,sy,1.2,1.2,color);} 
        c.globalAlpha=1;
        for(let i=1;i<=7;i++){const t=Math.max(0,travel-i*.025),tx=fromX+dx*t,ty=fromY+dy*t-20-Math.sin(t*Math.PI)*(frost?0:12);c.globalAlpha=(1-i/8)*.55;ellipse(c,tx,ty,5*(1-i/9),3*(1-i/9),color);}
        c.globalAlpha=1;c.translate(x,y);
        const glow=c.createRadialGradient(0,0,0,0,0,24);glow.addColorStop(0,color+'ba');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(-24,-24,48,48);
        if (frost) {
          c.rotate(Math.atan2(dy, dx)); polygon(c, [[-10, 0], [-1, -3], [7, 0], [-1, 3]], color, '#e0f1eb');
        } else {
          c.globalAlpha = 0.15; ellipse(c, 0, 0, 11, 11, color); c.globalAlpha = 1;
          c.save();c.rotate(Math.atan2(dy,dx));polygon(c,[[-22,0],[-13,-5],[-8,-2],[-3,-8],[8,-4],[11,0],[6,6],[-4,8],[-11,3]],color);c.restore();
          ellipse(c, 0, 0, 7, 7, color); ellipse(c, 1, -1, 3.5, 3.5, '#f4e4b3');
        }
      } else {
        const impact = this.reducedMotion ? 0.5 : clamp((progress - 0.58) / 0.42, 0, 1);
        c.translate(visual.x, visual.y - 18); c.lineWidth = 1.5;
        ellipse(c, 0, 0, 8 + impact * 20, 6 + impact * 16, null, color);
        for (let i = 0; i < 6; i++) {
          const a = i * TAU / 6, inner = 4 + impact * 9, outer = 9 + impact * 15;
          line(c, [[Math.cos(a) * inner, Math.sin(a) * inner], [Math.cos(a) * outer, Math.sin(a) * outer]], color, frost ? 1.5 : 2.5);
          if (frost) {
            const x = Math.cos(a) * outer * 0.8, y = Math.sin(a) * outer * 0.8;
            line(c, [[x - Math.sin(a + 0.5) * 3, y + Math.cos(a + 0.5) * 3], [x, y], [x + Math.sin(a - 0.5) * 3, y - Math.cos(a - 0.5) * 3]], color, 1);
          }
        }
      }
    }

    _villageProp(c, prop, game) {
      const { x, y, kind } = prop;
      if (this.atlasLoaded && (kind === 'market' || kind === 'study')) {
        if ([game.player, game.pet].some(actor => actor && Math.abs(actor.x - x) < 55 && actor.y < y + 5 && actor.y > y - 95)) c.globalAlpha = 0.3;
        this._art(c, kind === 'market' ? 5 : 6, x, y, kind === 'market' ? 105 : 98);
        return;
      }
      c.translate(x, y); c.lineWidth = 1; c.lineJoin = 'round';
      if (kind === 'market') {
        if ([game.player, game.pet].some(actor => actor && Math.abs(actor.x - x) < 52 && actor.y > y - 82 && actor.y < y + 6)) c.globalAlpha = 0.3;
        ellipse(c, 3, 6, 47, 13, '#172e2545');
        for (const px of [-39, 37]) line(c, [[px, 2], [px, -71]], '#69583d', 3.5);
        polygon(c, [[-43, -72], [20, -77], [46, -49], [-46, -45]], '#c3b382', '#5c6848');
        for (let i = 0; i < 4; i++) polygon(c, [[-41 + i * 16, -72 - i], [-33 + i * 16, -73 - i], [-25 + i * 23, -46 - i], [-37 + i * 23, -46 - i]], '#657c63');
        line(c, [[-46, -45], [46, -49]], '#e1cca0', 2);
        for (let i = 0; i < 7; i++) polygon(c, [[-45 + i * 13, -45 - i * 0.55], [-39 + i * 13, -38 - i * 0.55], [-33 + i * 13, -46 - i * 0.55]], i % 2 ? '#af9b6c' : '#718568');
        polygon(c, [[-39, -15], [38, -19], [38, -5], [-39, 0]], '#8a6d46', '#4e5338');
        polygon(c, [[-39, -15], [-30, -25], [43, -28], [38, -19]], '#b1a079', '#716440');
        line(c, [[-31, -9], [-31, 7]], '#615437', 4); line(c, [[31, -12], [31, 4]], '#615437', 4);
        for (const [px, color] of [[-20, '#ab795c'], [-7, '#7da7b4'], [6, '#9cb180']]) {
          polygon(c, [[px - 3, -25], [px - 4, -32], [px - 1, -35], [px - 1, -39], [px + 2, -39], [px + 2, -35], [px + 5, -32], [px + 4, -25]], color, '#4d6250');
          line(c, [[px - 1, -39], [px + 2, -39]], '#dac89b', 2); line(c, [[px - 1, -31], [px - 1, -27]], '#dce1bb80');
        }
        ellipse(c, 26, -27, 10, 4, '#82704b', '#c3ab77');
        for (let i = 0; i < 5; i++) ellipse(c, 19 + i * 3, -29 - i % 2 * 2, 3, 2.5, i % 2 ? '#c4b873' : '#a3ac69');
        text(c, 'PROVISIONS', 0, -8, 6.5, '#d6c69b');
      } else if (kind === 'study') {
        ellipse(c, 0, 3, 27, 9, '#18322740');
        polygon(c, [[-13, 2], [-11, -15], [13, -15], [15, 2]], '#6f7e66', '#445e44');
        ellipse(c, 0, -17, 24, 9, '#a5aa88', '#62745a');
        polygon(c, [[-16, -22], [-3, -25], [0, -20], [14, -24], [18, -15], [2, -12], [-13, -15]], '#685e61', '#444a3b');
        polygon(c, [[-13, -22], [-3, -23], [0, -19], [0, -14], [-11, -17]], '#d1c79c');
        polygon(c, [[1, -19], [12, -22], [15, -16], [2, -14]], '#e6d8aa');
        line(c, [[-9, -20], [-3, -19]], '#8a8a63', 0.7); line(c, [[5, -18], [11, -19]], '#96906b', 0.7);
        for (let i = 0; i < 3; i++) {
          c.fillStyle = ['#907d85', '#698d89', '#a28d66'][i]; c.fillRect(21, -3 - i * 5, 15, 5);
          c.fillStyle = '#c7c59c'; c.fillRect(23, -2 - i * 5, 11, 2);
        }
      } else {
        ellipse(c, 2, 3, 17, 4, '#19352840');
        line(c, [[0, 4], [0, -65]], '#75613f', 4);
        polygon(c, [[-31, -48], [30, -48], [38, -42], [30, -36], [-31, -36]], '#9b8a5f', '#526148');
        text(c, 'BRIARWATCH', 1, -42, 5.5, '#e1d2a1');
        line(c, [[0, -65], [69, -65]], '#c4ad72', 2);
        polygon(c, [[44, -63], [67, -63], [67, -19], [56, -26], [44, -19]], '#557365', '#b8ae77');
        line(c, [[56, -53], [56, -35]], '#d7c78f', 1.3);
        line(c, [[49, -45], [56, -50], [63, -45]], '#d7c78f', 1.3);
        line(c, [[50, -39], [56, -44], [62, -39]], '#d7c78f', 1.3);
      }
    }

    _villager(c, npc) {
      if (this._art(c, npc.id === 'rowan' ? 13 : npc.id === 'liora' ? 14 : 15, npc.x, npc.y, 48)) return;
      c.translate(npc.x, npc.y); c.lineWidth = 1; c.lineJoin = 'round'; c.lineCap = 'round';
      ellipse(c, 1, 2, 13, 5, '#10292165');
      line(c, [[-5, -9], [-5, 0], [-8, 0]], '#4c4635', 4); line(c, [[5, -9], [5, 0], [9, 0]], '#4c4635', 4);
      if (npc.id === 'rowan') {
        polygon(c, [[-9, -30], [-15, -6], [-7, -3], [4, -7], [13, -4], [9, -29]], '#486d58', '#294e3c');
        polygon(c, [[-7, -28], [7, -28], [10, -13], [5, -8], [-7, -10]], '#98a58d', '#536856');
        polygon(c, [[-11, -29], [-15, -23], [-10, -19], [-5, -23]], '#b1b69b', '#5c705a');
        polygon(c, [[7, -29], [13, -25], [14, -20], [7, -20]], '#b1b69b', '#5c705a');
        line(c, [[-6, -27], [7, -12]], '#8d764e', 2.5); line(c, [[-8, -13], [8, -13]], '#69563a', 2);
        polygon(c, [[-15, -21], [-5, -22], [-4, -11], [-9, -6], [-15, -11]], '#536f59', '#c2b58a');
        line(c, [[-10, -18], [-10, -11]], '#d5c89a', 1.2);
        line(c, [[17, 1], [17, -41]], '#79613c', 2); polygon(c, [[14, -41], [17, -49], [20, -41], [17, -36]], '#bcc1a5', '#718572');
        ellipse(c, 0, -34, 6.5, 7, '#c8aa80');
        polygon(c, [[-8, -34], [-7, -41], [1, -44], [8, -39], [9, -33], [1, -36]], '#8f9e88', '#536a57');
        line(c, [[-6, -38], [1, -41], [6, -37]], '#c3c7a6', 1); line(c, [[-3, -32], [1, -32]], '#42563e', 1);
        polygon(c, [[-3, -29], [4, -30], [3, -26], [0, -24]], '#77644b');
      } else if (npc.id === 'liora') {
        polygon(c, [[-7, -28], [-15, -4], [-5, -1], [3, -4], [12, -2], [9, -27]], '#7d7189', '#4b4f53');
        polygon(c, [[-1, -26], [-5, -3], [4, -4], [5, -27]], '#a398a7');
        line(c, [[-12, -5], [-5, -2], [3, -5], [10, -3]], '#d1c096', 1.3);
        line(c, [[-8, -16], [9, -17]], '#c6b37e', 1.6);
        line(c, [[-9, -25], [-14, -16]], '#b0a4ae', 5); line(c, [[8, -25], [12, -18]], '#b0a4ae', 5);
        ellipse(c, 0, -33, 6, 7, '#ceb698');
        polygon(c, [[-8, -30], [-9, -38], [-4, -43], [5, -41], [9, -35], [8, -23], [4, -27], [4, -36], [-3, -37], [-5, -27]], '#c5c9bc', '#858e81');
        line(c, [[-3, -32], [0, -32]], '#52604e', 1); ellipse(c, 5, -39, 1.5, 1.5, '#dacc99');
        line(c, [[-18, 1], [-18, -37]], '#7b6650', 2); ellipse(c, -18, -38, 4, 5, '#b6bdc9', '#ded7bc');
        polygon(c, [[9, -22], [17, -24], [21, -17], [12, -15]], '#d6cba8', '#867b66');
      } else {
        polygon(c, [[-9, -26], [-12, -11], [-7, -6], [8, -6], [12, -12], [8, -26]], '#9c7653', '#55543a');
        polygon(c, [[-5, -23], [5, -23], [8, -5], [-8, -5]], '#c1b28a', '#8b7e5b');
        line(c, [[-7, -17], [7, -17]], '#6f6346', 1.8); c.fillStyle = '#927b56'; c.fillRect(-4, -13, 8, 5);
        line(c, [[-8, -25], [-13, -15]], '#ad845d', 5); line(c, [[9, -24], [14, -15]], '#ad845d', 5);
        ellipse(c, 0, -33, 7, 7, '#bf9a73', '#726345');
        polygon(c, [[-8, -31], [-9, -38], [-4, -42], [4, -40], [8, -34], [4, -34], [1, -38], [-5, -36], [-5, -30]], '#765c42');
        ellipse(c, 0, -39, 11, 2.5, '#a68e5f', '#726a47');
        polygon(c, [[-6, -40], [-5, -45], [5, -44], [7, -39]], '#b3a176', '#7a754d');
        line(c, [[-3, -33], [-1, -33]], '#50533b', 1); line(c, [[3, -33], [5, -33]], '#50533b', 1);
        ellipse(c, -12, -9, 4, 5, '#8a7350', '#b4a171');
        polygon(c, [[12, -14], [11, -21], [14, -24], [17, -21], [17, -15]], '#89b0a4', '#c4c9a2');
      }
    }

    _npcMarker(npc, game) {
      const states = typeof game.questState === 'function' ? QUESTS.filter(quest => quest.npcId === npc.id).map(quest => game.questState(quest.id).status) : [];
      if (states.includes('ready')) return { symbol: '?', color: '#d6e4af' };
      if (states.includes('available')) return { symbol: '!', color: '#ead294' };
      return { symbol: npc.id === 'rowan' ? '·' : '◇', color: npc.id === 'liora' ? '#c4bed9' : '#d3c596' };
    }

    _npcLabel(c, npc, game) {
      const distance = Math.hypot(npc.x - game.player.x, npc.y - game.player.y);
      if (distance > 90) return;
      const marker = this._npcMarker(npc, game);
      c.save(); c.lineWidth = 0.8;
      ellipse(c, npc.x, npc.y - 69, 9, 10, '#19392ee8', marker.color);
      text(c, marker.symbol, npc.x, npc.y - 69, 13, marker.color);
      text(c, npc.name, npc.x, npc.y - 52, 9, '#e0dab6');
      c.restore();
    }

    _lodge(c, x, y, player) {
      if (this.atlasLoaded) {
        if (Math.abs(player.x - x) < 80 && player.y < y + 5 && player.y > y - 130) c.globalAlpha = 0.35;
        this._art(c, 4, x, y, 140); return;
      }
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
      if (this.atlasLoaded) {
        const glow = c.createRadialGradient(x, y - 30, 2, x, y - 30, 45);
        glow.addColorStop(0, '#9bdfd22e'); glow.addColorStop(1, '#9bdfd200');
        c.fillStyle = glow; c.fillRect(x - 45, y - 75, 90, 90);
        this._art(c, 7, x, y, 66);


        return;
      }
      c.translate(x, y);
      const glow = c.createRadialGradient(0, -20, 2, 0, -20, 47);
      glow.addColorStop(0, '#b9e0bc37'); glow.addColorStop(1, '#a6d5ad00'); c.fillStyle = glow; c.fillRect(-47, -67, 94, 94);
      ellipse(c, 0, 1, 18, 8, '#9a9c77', '#495f48'); ellipse(c, 0, -2, 15, 6, '#74846a');
      const float = Math.sin(time * 1.5) * 1.7;
      polygon(c, [[0, -48 + float], [-11, -27 + float], [-8, -10 + float], [0, -4 + float], [11, -15 + float], [9, -33 + float]], '#a7c5ad', '#d3e8c1');
      polygon(c, [[0, -48 + float], [0, -4 + float], [-8, -10 + float], [-11, -27 + float]], '#699a8d');
      polygon(c, [[0, -48 + float], [9, -33 + float], [0, -24 + float]], '#d8e7bd');
      line(c, [[-3, -27 + float], [4, -24 + float], [-3, -19 + float]], '#eaf0c8', 1);


    }

    _camp(c, camp, time, actors) {
      if(camp.biome) { const biome=BIOMES.find(b=>b.id===camp.biome);
        this._sheet(c,'frontier',8+biome.art,camp.x,camp.y-15,155);
        for(const side of [-1,1])this._sheet(c,'frontier',12+biome.art,camp.x+side*110,camp.y+24,65);
        if(camp.type==='drake')this._fire(c,camp.x,camp.y-35,time,false);
        return;
      }
      if (this.environmentLoaded) {
        const blocked = actors.some(({ entity }) => Math.abs(entity.x - camp.x) < 90 && entity.y < camp.y && entity.y > camp.y - 145);
        if (blocked) c.globalAlpha = 0.3;
        if (camp.id === 'briar') {
          this._sheet(c, 'environment', 0, camp.x + 38, camp.y - 20, 103);
          this._sheet(c, 'environment', 8, camp.x - 52, camp.y - 15, 32);
          this._sheet(c, 'environment', 9, camp.x - 20, camp.y + 15, 31);
          this._fire(c, camp.x - 20, camp.y + 12, time, false);
        } else if (camp.id === 'mossfang') {
          this._sheet(c, 'environment', 0, camp.x - 65, camp.y - 30, 75);
          this._sheet(c, 'environment', 1, camp.x + 30, camp.y - 12, 122);
          this._sheet(c, 'environment', 6, camp.x - 10, camp.y + 10, 25);
        } else if (camp.id === 'crypt') {
          this._sheet(c, 'environment', 11, camp.x, camp.y - 12, 39);
          this._sheet(c, 'environment', 2, camp.x, camp.y - 40, 133);
          this._sheet(c, 'environment', 7, camp.x + 85, camp.y + 20, 53);
          this._sheet(c, 'environment', 4, camp.x - 75, camp.y + 5, 35);
        } else {
          this._sheet(c, 'environment', 3, camp.x, camp.y - 25, 113);
          this._sheet(c, 'environment', 7, camp.x - 85, camp.y + 15, 51);
          this._sheet(c, 'environment', 7, camp.x + 85, camp.y + 20, 45);
        }
        return;
      }
      const occluded = actors.some(({ entity }) => entity.y < camp.y - 25 && (camp.type === 'goblin'
        ? entity.y > camp.y - 78 && entity.x > camp.x - 10 && entity.x < camp.x + 95
        : entity.y > camp.y - 118 && Math.abs(entity.x - camp.x) < 80));
      if (occluded) c.globalAlpha = 0.4;
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

    _fallen(c, entity) {
      const progress = 1 - entity.life / entity.maxLife;
      c.save(); c.translate(entity.x, entity.y); c.globalAlpha = clamp(entity.life, 0, 0.65);
      c.filter = 'saturate(0.3)';
      if (!this.reducedMotion) { c.rotate(progress * (entity.facing === -1 ? -0.8 : 0.8)); c.scale(1, 1 - progress * 0.65); }
      if(frontierTypes[entity.type]!==undefined){this._sheet(c,'frontier',frontierTypes[entity.type]+(entity.named?4:0),0,0,entity.named?65:47);c.restore();return;}
      if(entity.kind==='pet'&&root.Everwild.CLASSES[entity.classId]?.skills&&this.companionsLoaded){this._sheet(c,'companions',({enchanter:0,shadowknight:1,ranger:2,shaman:3}[entity.classId]??3),0,0,47);c.restore();return;}
      if(entity.kind==='pet'&&entity.classId&&entity.classId!=='magician'){if(entity.type==='Earth')this._sheet(c,'journey',entity.classId==='necromancer'?3:7,0,0,51);else this._sheet(c,'frontier',entity.classId==='necromancer'?2:0,0,0,47);c.restore();return;}
      const index = entity.kind === 'pet' ? (entity.type === 'Earth' ? 9 : 10) : entity.type === 'goblin' ? 11 : 12;
      if (entity.named) this._sheet(c, 'environment', 12 + CAMPS.findIndex(camp => camp.id === entity.campId), 0, 0, 52);
      else this._art(c, index, 0, 0, entity.kind === 'pet' ? 51 : 44);
      c.restore();
    }

    _spellAuras(c, game, time) {
      if(game.barrier>0&&game.barrierUntil>time&&!game.dead){c.save();c.translate(game.player.x,game.player.y-22);ellipse(c,0,0,24,32,'#d3bce910',game.characterClass.color+'88');if(!this.reducedMotion)c.rotate(Math.sin(time)*.05);for(let i=0;i<4;i++){const a=i*TAU/4;ellipse(c,Math.cos(a)*24,Math.sin(a)*32,2,2,game.characterClass.color);}c.restore();}

      if (game.shieldUntil > game.clock && !game.dead) {
        const p = game.player, remaining = game.shieldUntil - game.clock;
        c.save(); c.translate(p.x, p.y - 23); c.strokeStyle = '#b0dce5'; c.lineWidth = 1.2;
        c.globalAlpha = Math.min(1, remaining / 3) * 0.5;
        ellipse(c, 0, 0, 23, 32, '#a1d4e412', '#b6deed80');
        for (let i = 0; i < 3; i++) {
          const a = i * TAU / 3 + (this.reducedMotion ? 0 : time * 0.3);
          c.beginPath(); c.ellipse(0, 0, 25, 34, 0, a, a + 0.7); c.stroke();
        }
        c.restore();
      }
      if (game.pet?.targetId) {
        const target = game.mobs.find(mob => mob.id === game.pet.targetId && mob.alive);
        if (target) {
          c.save(); c.setLineDash([2, 6]); c.lineWidth = 0.7; c.globalAlpha = 0.35;
          line(c, [[game.pet.x, game.pet.y + 2], [target.x, target.y + 2]], '#cbd6a4'); c.restore();
        }
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
      if(kind==='mob'&&entity.charmedUntil>time)return;
      const x = entity.x, y = entity.y;
      const motionTime = this.reducedMotion ? 0 : time;
      c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
      ellipse(c, 1, 2, kind === 'pet' ? 16 : 12, kind === 'pet' ? 6 : 4.8, '#10292170');
      if (kind === 'mob' && entity.named) {
        c.lineWidth = 1;
        ellipse(c, 0, 1, 18, 8, '#c5a56318', '#d0ae6f70');
        for (let i = 0; !this.reducedMotion && i < 3; i++) ellipse(c, Math.sin(time * 0.6 + i * 2) * 20, -12 + Math.cos(time + i) * 10, 0.8, 0.8, '#ddc78a');
      }
      const bob = this.reducedMotion ? 0 : Math.sin(time * (kind === 'pet' && entity.type === 'Air' ? 3 : 2.1) + (entity.index || 0)) * 0.6;
      const hit = Math.max(0, (entity.hitUntil || 0) - time) / 0.22;
      c.save(); c.translate(this.reducedMotion ? 0 : Math.sin(hit * Math.PI * 2) * 3, bob);
      if (hit > 0) c.filter = 'brightness(' + (1 + hit * 0.65) + ')';
      if (this.atlasLoaded) {
        const index = kind === 'player' ? 8 : kind === 'pet' ? (entity.type === 'Earth' ? 9 : 10) : entity.type === 'goblin' ? 11 : 12;
        if (kind === 'mob' && entity.returning) c.globalAlpha = 0.55;
        const height = kind === 'pet' ? 51 : entity.named ? 55 : 44;
        c.save();
        const face = entity.facing === -1 ? -1 : 1;
        c.scale(face, 1);
        const pose = this._pose(kind, entity, game, time);
        if(kind==='player'&&game.characterClass.skills&&this.rosterLoaded){
          if(!this.reducedMotion){if(entity.walkUntil>time)c.rotate(Math.sin((entity.walkDistance||0)/10)*.035);if(entity.strikeUntil>time||game.cast)c.rotate(Math.sin(time*14)*.075);}
          this._sheet(c,'roster',game.characterClass.artIndex,0,0,52);
        } else if(kind==='player'&&this.classMotionLoaded&&this.journeyLoaded){
          const cls=game.player.classId==='necromancer'?1:game.player.classId==='druid'?2:0;
          if(pose)this._sheet(c,pose.sheet,pose.index,0,0,52);else this._sheet(c,'journey',cls,0,0,52);
        } else if(kind==='player' && game.player.classId!=='magician' && this.journeyLoaded){
          const index=game.player.classId==='necromancer'?1:2;
          if(entity.walkUntil>time&&!this.reducedMotion)c.translate(0,Math.sin(time*10)*1.5);
          this._sheet(c,'journey',index+(game.cast?4:0),0,0,52);
        } else if(kind==='pet'&&game.characterClass.skills&&this.rosterLoaded){
          if(entity.charmedMobId){const m=game.mobs.find(m=>m.id===entity.charmedMobId);if(m&&frontierTypes[m.type]!==undefined)this._sheet(c,'frontier',frontierTypes[m.type],0,0,47);else this._art(c,m?.type==='skeleton'?12:11,0,0,47);}
          else{const spirit={enchanter:0,shadowknight:1,ranger:2,shaman:3}[entity.classId]??3;if(!this.reducedMotion&&spirit===2)c.scale(1,1+Math.sin(time*9)*.09);this._sheet(c,'companions',spirit,0,0,spirit===2?32:47);}
        } else if(kind==='pet' && game.player.classId!=='magician' && this.journeyLoaded){
          if(entity.type==='Earth')this._sheet(c,'journey',game.player.classId==='necromancer'?3:7,0,0,51);
          else {if(game.player.classId==='necromancer')c.filter='hue-rotate(55deg)';this._sheet(c,'frontier',game.player.classId==='necromancer'?2:0,0,0,47);}
        } else if(kind==='mob' && frontierTypes[entity.type]!==undefined) {
          const moving=(entity.walkUntil||0)>time;
          if(!this.reducedMotion){c.translate(0,entity.type==='wisp'?Math.sin(time*2.5)*3:moving?Math.sin(time*10)*1.7:0);if(entity.strikeUntil>time)c.rotate(Math.sin((entity.strikeUntil-time)*9)*.14);}
          this._sheet(c,'frontier',frontierTypes[entity.type]+(entity.named?4:0),0,0,entity.named?65:entity.type==='beetle'?39:47);
        } else if (entity.named && this.environmentLoaded) {
          if (entity.strikeUntil > time && !this.reducedMotion) c.rotate(Math.sin((entity.strikeUntil - time) * 7) * 0.12);
          this._sheet(c, 'environment', 12 + CAMPS.findIndex(camp => camp.id === entity.campId), 0, 0, height);
        } else if (!pose || !this._sheet(c, pose.sheet, pose.index, 0, 0, height)) this._art(c, index, 0, 0, height);
        c.restore();
      } else if (kind === 'player') this._magician(c, game, time);
      else if (kind === 'pet') this._elemental(c, entity, motionTime);
      else {
        if (entity.named) c.scale(1.13, 1.13);
        if (entity.returning) c.globalAlpha = 0.55;
        if (entity.type === 'goblin') this._goblin(c, entity);
        else this._skeleton(c, entity);
      }
      c.restore();
      if(kind==='mob'&&entity.mezUntil>time)text(c,'Zzz',0,-62,10,'#d6b7ef');
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
            const phase = (motionTime * 1.1 + i / 3) % 1;
            const x=Math.sin(i*2+motionTime)*10,y=-7-phase*28;c.save();c.globalAlpha=1-phase;if(entity.dotSchool==='druid')polygon(c,[[x,y-4],[x+3,y],[x,y+3],[x-2,y]],'#a9cd8d');else ellipse(c,x,y,2*(1-phase)+.5,entity.dotSchool==='necromancer'?2:4*(1-phase)+1,entity.dotSchool==='necromancer'?'#c2a3dc':'#efa955');c.restore();
          }
        }
        if (entity.slowUntil > time) {
          for (let i = 0; i < 5; i++) {
            const px = -16 + i * 8, py = Math.sin(i * 2) * 4;
            polygon(c, [[px, py], [px - 2, py - 5 - i % 2 * 3], [px + 2, py - 3]], '#b1e2e480', '#d2edef80');
          }
          c.save(); c.lineWidth = 1; ellipse(c, 0, 1, 15, 7, '#a4d6e413', '#b1ddea8c');
          c.translate(-20, -17);
          for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); line(c, [[-4, 0], [4, 0]], '#c7e7e9', 1); }
          c.restore();
        }
      }
    }

    _actorLabel(c, kind, entity, game, time) {
      // Labels sit above all scenery, even while their actor walks behind it.
      c.save(); c.translate(entity.x, entity.y);
      if(kind==='mob'&&entity.mezUntil>time)text(c,'Zzz',0,-62,10,'#d6b7ef');
      if (kind === 'mob') {
        const intent = activeIntent(entity, time) ? entity.intent : null;
        const healthY = entity.named ? -58 : -46;
        if (entity.hp < entity.maxHp || game.selectedId === entity.id || entity.aggro) this._health(c, entity.hp / entity.maxHp, healthY, entity.named ? 35 : 28, '#c68a6b');
        if (intent) {
          const progress = clamp((time - intent.started) / Math.max(0.01, intent.done - intent.started), 0, 1);
          const color = intentColors[intent.kind] || intentColors.hex;
          text(c, intent.name, 0, healthY - 23, 7.5, color);
          this._health(c, progress, healthY - 12, 43, color);
        }
        if (entity.aggro && !entity.returning && entity.targetId) {
          const playerFocus = entity.targetId === 'player', color = playerFocus ? '#edaf92' : '#b6d6a4';

          polygon(c, [[22, healthY + 13], [28, healthY + 13], [25, healthY + 17]], color);
        }
      } else if (kind === 'pet') {
        this._health(c, entity.hp / entity.maxHp, -44, 28, '#a6ba82');
        if (entity.targetId) polygon(c, [[-3, -50], [0, -46], [3, -50]], '#cdddac');
      }
      c.restore();
    }

    _magician(c, game, time) {
      const motionTime = this.reducedMotion ? 0 : time;
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
        c.beginPath(); c.ellipse(0, -20, 23, 29, 0, motionTime * 0.5, motionTime * 0.5 + 1.2); c.strokeStyle = '#e5edce'; c.stroke();
      }
      if (game.cast) {
        const colors = ['#ced4a2', '#f0c38a', '#e7a777', '#b4d3a5', '#c7e0b3', '#cae8e0', '#c6e0e8', '#dbe4b3', '#a9dce9', '#efb77f'];
        const glow = c.createRadialGradient(17, -36, 0, 17, -36, 16);
        glow.addColorStop(0, colors[game.cast.i]); glow.addColorStop(1, '#e4d1a000');
        c.fillStyle = glow; c.fillRect(1, -52, 32, 32);
        for (let i = 0; i < 3; i++) {
          const a = motionTime * 3 + i * TAU / 3;
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
        if (lootNames.has(effect.text)) continue;
        if (!this._visible(effect.x, effect.y, 40)) continue;
        c.save(); c.globalAlpha = clamp(effect.life * 2, 0, 1);
        const numeric = /^[+−\-]?\d/.test(effect.text);
        text(c, effect.text, effect.x, effect.y - 25 - (this.reducedMotion ? 0 : (1.25 - effect.life) * 22), numeric ? 13 : 10, effect.color || '#e4d6ae', numeric);
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
      const stone = { x: bindstone.x * sx, y: bindstone.y * sy };
      polygon(c, [[stone.x, stone.y - 5], [stone.x + 3, stone.y], [stone.x, stone.y + 4], [stone.x - 3, stone.y]], '#d8e5b8', '#263f30');
      if (labels) {
        text(c, 'Willowmere · Village', spawn.x + 14, spawn.y - 36, 11, '#e1e2bd', true);
        for (const npc of NPCS) {
          const nx = npc.x * sx, ny = npc.y * sy, marker = this._npcMarker(npc, game);
          polygon(c, [[nx, ny - 5], [nx + 4, ny], [nx, ny + 5], [nx - 4, ny]], '#2e4c37', marker.color);
          if (marker.symbol === '!' || marker.symbol === '?') text(c, marker.symbol, nx, ny, 8, marker.color);
          text(c, npc.name.split(' ').at(-1), nx, ny + 12, 8, '#d5d8b5');
        }
      }
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
        for(const b of BIOMES.slice(1))text(c,b.name,(b.x+b.w*.5)*sx,(b.y+80)*sy,10,b.art===2?'#e1eeee':'#d8cba8',true);
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

