/* Browser input, accessible menus, and local persistence for Everwild. */
(function () {
  'use strict';
  const { Game, Renderer, WORLD, CAMPS, SPELLS, ITEMS, VERSION } = window.Everwild;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const SAVE_KEY = 'everwild_save';
  const canvas = $('game');
  const dialog = $('menu-dialog');
  let storageAvailable = true;
  let loadWarning = '';
  let savedData = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        savedData = JSON.parse(raw);
        if (!validSave(savedData)) throw new Error('Unrecognized save');
      } catch (_) {
        // Retain unreadable bytes in case the player wants to recover them later.
        localStorage.setItem('everwild_save_recovery', raw);
        savedData = null;
        loadWarning = 'Your previous save could not be read. A recovery copy was kept in this browser. A new character is ready.';
      }
    }
  } catch (_) {
    storageAvailable = false;
    loadWarning = 'Browser storage is unavailable. Use Save → Export character to keep your progress.';
  }
  let game = new Game({ save: savedData });
  const renderer = new Renderer(canvas);
  let manualPause = false;
  let activeMenu = '';
  let keys = new Set();
  let lastFrame = performance.now();
  let uiElapsed = 1;
  let saveElapsed = 0;
  let lastLog = -1;
  let lastDead = game.dead;
  let toastUntil = 0;
  let pendingImport = null;

  function validSave(value) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
      value.player && typeof value.player === 'object' && !Array.isArray(value.player) &&
      typeof value.player.level === 'number' && Number.isFinite(value.player.level) &&
      Array.isArray(value.player.inventory);
  }

  function checkSaveVersion(version) {
    if (version === undefined || version === null) return; // Original v0.1 saves had no version field.
    const value = String(version);
    if (!/^\d+(?:\.\d+){0,2}$/.test(value)) throw new Error('This file has an unrecognized save version.');
    const incoming = value.split('.').map(Number);
    const current = VERSION.split('.').map(Number);
    for (let i = 0; i < current.length; i++) {
      const part = incoming[i] || 0;
      if (part > current[i]) throw new Error('This save comes from a newer game version. Update Everwild before importing it.');
      if (part < current[i]) return;
    }
  }

  function isPaused() { return manualPause || dialog.open || document.hidden; }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game.serialize()));
      storageAvailable = true;
      $('save-status').textContent = 'Progress saved';
      return true;
    } catch (_) {
      storageAvailable = false;
      $('save-status').textContent = 'Storage blocked · export your save';
      return false;
    }
  }

  function toast(message) {
    if (!message) return;
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastUntil = performance.now() + 4500;
  }

  function clearInput() {
    keys.clear();
    game.cancelMovement();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    renderer.resize(bounds.width, bounds.height, Math.min(window.devicePixelRatio || 1, 2));
    renderer.draw(game);
    renderer.drawMap($('minimap'), game);
  }

  function pause(value) {
    manualPause = typeof value === 'boolean' ? value : !manualPause;
    clearInput();
    $('paused-overlay').hidden = !manualPause || game.dead;
    $('pause').textContent = manualPause ? '▷' : 'Ⅱ';
    $('pause').setAttribute('aria-label', manualPause ? 'Resume game' : 'Pause game');
    if (manualPause) save();
  }

  function act(callback) {
    if (isPaused()) return;
    const result = callback();
    if (result && result.ok === false) toast(result.message);
    updateUI();
  }

  const iconPaths = [
    '<path d="m6 10 6-6 7 4 3 9-6 6-11-4Z"/><path d="m6 10 7 4 6-6m-6 6 3 9M9 8l5-1m-6 10h3m5 0h2"/>',
    '<path d="M15 3c1 7 7 8 7 14a8 8 0 0 1-16 0c0-4 3-6 5-8-1 6 2 5 3 3 2-3 1-6 1-9Z"/><path d="M14 16c-6 6 3 10 3 4"/>',
    '<circle cx="14" cy="14" r="8"/><path d="m14 2 2 8 8 4-8 3-2 9-3-9-9-3 9-4Z"/>',
    '<path d="M14 3v15m0-9-7-4m7 8 7-6M14 18l-8 7m8-7 8 7m-8-7-1 8M6 13l3 7m12-6-2 7"/>',
    '<path d="m5 12 9-8 9 8-3 11H8Z"/><path d="M14 10v10m-5-5h10"/>',
    '<path d="M4 10h15a4 4 0 1 0-4-4M3 15h18a3 3 0 1 1-3 3M7 20h5a3 3 0 1 1-3 3"/>',
    '<path d="M14 3 5 7v8c0 5 9 10 9 10s9-5 9-10V7Z"/><path d="m9 14 3 4 7-8"/>',
    '<path d="M14 24S3 17 3 10c0-7 9-8 11-2 3-6 11-5 11 2 0 7-11 14-11 14Z"/><path d="M14 11v8m-4-4h8"/>'
  ];
  const spellColors = ['#c5bc91', '#e2aa76', '#cf927c', '#b5acd1', '#b6c890', '#a6ced0', '#adc3d6', '#cabda3'];
  SPELLS.forEach((spell, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spell';
    button.id = 'spell' + index;
    button.style.setProperty('--spell-color', spellColors[index]);
    button.title = `${spell.name} [${spell.key}] — ${spell.description} ${spell.cast}s cast, ${spell.cost} mana.`;
    button.setAttribute('aria-label', button.title);
    button.innerHTML = `<span class="spell-top"><span class="spell-icon"><svg viewBox="0 0 28 28" aria-hidden="true">${iconPaths[index]}</svg></span><kbd>${escape(spell.key)}</kbd></span><b>${escape(spell.name)}</b><small>${spell.cost} mana · ${spell.cast}s</small><span class="rank-dot"></span>`;
    button.addEventListener('click', () => cast(index));
    $('actionbar').appendChild(button);
  });

  function cast(index) {
    act(() => {
      game.cancelMovement();
      return game.castSpell(index);
    });
  }

  function setText(id, text) {
    const node = $(id);
    if (node.textContent !== String(text)) node.textContent = text;
  }
  function meter(id, value, maximum) {
    $(id).style.width = Math.max(0, Math.min(100, value / Math.max(1, maximum) * 100)).toFixed(2) + '%';
  }

  function updateUI() {
    const player = game.player;
    const pet = game.pet;
    setText('level', `Level ${player.level} · Magician`);
    setText('hptext', `${Math.ceil(player.hp)} / ${player.maxHp}`);
    setText('mptext', `${Math.ceil(player.mp)} / ${player.maxMp}`);
    setText('xptext', player.level === 20 ? 'Maximum level' : `${player.xp} / ${game.xpNeeded()}`);
    meter('hpbar', player.hp, player.maxHp);
    meter('mpbar', player.mp, player.maxMp);
    meter('xpbar', player.xp, game.xpNeeded());
    setText('gold', player.gold.toLocaleString());
    setText('kill-count', `${player.kills} ${player.kills === 1 ? 'victory' : 'victories'}`);
    setText('discovery-count', `${game.discovered.length} / ${CAMPS.length}`);
    setText('pack-count', `${player.inventory.length} items →`);
    setText('debt', player.debt ? `${player.debt} XP debt · future victories repay it` : 'Your spirit is unburdened.');
    setText('pet-type', pet ? pet.type.toUpperCase() : 'UNSUMMONED');
    setText('pet-name', pet ? `${pet.type} Elemental` : 'A little less alone');
    setText('pet-info', pet ? `${Math.ceil(pet.hp)} / ${pet.maxHp} health` : 'Call an elemental to your side.');
    setText('pet-sigil', pet ? (pet.type === 'Earth' ? '◈' : '≋') : '◇');
    meter('petbar', pet ? pet.hp : 0, pet ? pet.maxHp : 1);
    const petTarget = pet && game.mobs.find(mob => mob.id === pet.targetId && mob.alive);
    setText('pet-order', petTarget ? `Attacking ${petTarget.name}` : pet ? 'Following you · select a foe and press F' : 'Earth endures. Air strikes quickly.');
    const selected = game.selected;
    $('target-card').hidden = !selected;
    if (selected) {
      const diff = selected.level - player.level;
      const con = diff >= 3 ? 'DANGEROUS' : diff >= 1 ? 'CHALLENGING' : diff <= -3 ? 'TRIVIAL' : 'EVEN MATCH';
      setText('target-name', selected.name);
      setText('target-level', `Lv. ${selected.level}`);
      setText('target-con', selected.named ? '✦ NAMED · ' + con : con);
      $('target-con').style.color = diff >= 3 ? '#e5a28a' : selected.named ? '#c9afdf' : '#bcbf8d';
      meter('target-hp', selected.hp, selected.maxHp);
      setText('target-state', `${Math.ceil(selected.hp)} / ${selected.maxHp} HP · ${selected.returning ? 'Returning home' : selected.rootUntil > game.clock ? 'Rooted' : selected.aggro ? 'In combat' : 'Unaware'}`);
    }
    const nearHome = Math.hypot(player.x - WORLD.spawn.x, player.y - WORLD.spawn.y) < 120;
    const camp = CAMPS.find(candidate => Math.hypot(player.x - candidate.x, player.y - candidate.y) < 235);
    setText('area-name', camp ? camp.name : 'Willowmere Frontier');
    setText('area-note', nearHome ? 'A quiet refuge at the edge of the unknown' : camp ? `Level ${camp.level} territory · tread carefully` : 'Follow the eastern road into the wilds');
    const stateText = game.dead ? 'Spirit unbound' : game.inCombat ? 'In combat' : game.meditate ? 'Meditating' : nearHome ? 'Sanctuary' : 'Exploring';
    $('world-state').innerHTML = `<i style="background:${game.inCombat ? '#d49b77' : '#8fbd9d'}"></i> ${stateText}`;
    if (!pet && !player.kills) {
      setText('objective-title', 'An ally in the wild');
      $('objective-text').innerHTML = 'Summon an Earth Elemental with <kbd>1</kbd>. It will stand beside you.';
    } else if (!player.kills) {
      setText('objective-title', 'The eastern road');
      $('objective-text').innerHTML = 'Find a goblin east of Willowmere. Select it, then send your pet with <kbd>F</kbd>.';
    } else if (player.inventory.length && !Object.keys(player.equipment).length) {
      setText('objective-title', 'Spoils of the frontier');
      $('objective-text').innerHTML = 'Your first equipment is in your pack. Press <kbd>I</kbd> and equip it.';
    } else if (player.level < 2) {
      setText('objective-title', 'Learn the wilds');
      setText('objective-text', 'Hunt Briarwatch’s scouts. Meditate between fights and keep your elemental healthy.');
    } else if (player.spellRanks.every(rank => rank === 1)) {
      setText('objective-title', 'A deeper understanding');
      setText('objective-text', 'Return to the bindstone. Open your spellbook to study a rank 2 spell for 45 copper.');
    } else {
      setText('objective-title', 'Beyond the lantern light');
      $('objective-text').innerHTML = 'Seek named foes for rare equipment. Press <kbd>M</kbd> to chart your next expedition.';
    }
    const remaining = game.cast ? Math.max(0, game.cast.done - game.clock) : 0;
    setText('cast-status', game.cast ? `Casting ${SPELLS[game.cast.i].name}` : game.meditate ? 'Meditating · recovering mana' : game.dead ? 'Return to the bindstone' : 'Ready for the road');
    meter('cast-progress', game.cast ? game.clock - game.cast.started : 0, game.cast ? game.cast.done - game.cast.started : 1);
    setText('cast-time', game.cast ? remaining.toFixed(1) + 's' : '');
    for (let i = 0; i < SPELLS.length; i++) {
      const button = $('spell' + i);
      button.disabled = game.dead || player.mp < SPELLS[i].cost || isPaused();
      button.classList.toggle('casting', Boolean(game.cast && game.cast.i === i));
      button.querySelector('.rank-dot').textContent = player.spellRanks[i] > 1 ? 'ⅡⅢ'[player.spellRanks[i] - 2] : '';
    }
    $('rest').innerHTML = `<kbd>R</kbd> ${game.meditate ? 'Stand up' : 'Meditate'}`;
    $('rest').classList.toggle('active', game.meditate);
    for (const id of ['attack', 'follow', 'rest', 'interact']) $(id).disabled = game.dead || isPaused();
    $('death-overlay').hidden = !game.dead;
    $('paused-overlay').hidden = !manualPause || game.dead;
    const newest = game.logs.length ? game.logs[game.logs.length - 1].id : 0;
    if (newest !== lastLog) {
      lastLog = newest;
      $('log').innerHTML = game.logs.slice(-24).reverse().map(entry => `<div class="${escape(entry.type)}">${escape(entry.text)}</div>`).join('');
    }
    renderer.drawMap($('minimap'), game);
  }

  function openMenu(name) {
    if (dialog.open && activeMenu === name) { closeMenu(); return; }
    clearInput();
    activeMenu = name;
    const content = $('dialog-content');
    const player = game.player;
    if (name === 'guide') {
      setText('dialog-title', 'Your first expedition');
      content.innerHTML = '<p>You are a magician on the edge of Willowmere. Your elemental is your companion, your shield, and the heart of your strategy.</p>' +
        '<div class="guide-cards"><div class="guide-card"><span>01</span><b>Call a companion</b><p>Stand still and press 1 to summon an Earth Elemental. It is the sturdier choice for your first journey.</p></div><div class="guide-card"><span>02</span><b>Choose your fight</b><p>Follow the road east. Target the western goblin scout at Briarwatch. Press F, let your pet engage, then cast Fire Bolt with 2.</p></div><div class="guide-card"><span>03</span><b>Come home stronger</b><p>Equip loot from your pack. Rest with R, mend your pet with 5, and return to the bindstone with E to recover.</p></div></div>' +
        '<h3>Deliberate magic</h3><p>Moving interrupts a cast without spending mana. Spells keep the target you chose when casting began. Root can hold an extra enemy; a rooted foe can still strike anyone beside it. Follow recalls your pet, but enemies can pursue it. Nearby allies may help each other.</p>' +
        '<h3>Progress that stays with you</h3><p>Defeated enemies return after 45–75 seconds. Named enemies have a chance to return in their camp’s final guard position and carry rare gear. Duplicates become copper. At levels 2 and 5, buy spell ranks at the bindstone. Death adds 15% of your next level’s XP requirement as debt; you keep your level, items, and copper.</p>' +
        '<div class="controls-grid">' + [['WASD / ↑↓←→', 'Move (or click ground)'], ['Click / Space', 'Choose / nearest target'], ['Tab', 'Cycle targets while canvas focused'], ['1–8', 'Cast a spell'], ['F / G', 'Pet attack / follow'], ['R', 'Meditate / stand'], ['E', 'Use the bindstone'], ['I / M', 'Pack / frontier map'], ['Esc', 'Stop moving / pause'], ['?', 'Open this guide']].map(([key, text]) => `<div><kbd>${key}</kbd><span>${text}</span></div>`).join('') + '</div>' +
        '<p class="muted" style="margin-top:20px">On touch devices: tap ground to move, tap an enemy to target, then use the spell and pet buttons. Trees, water, and ruin walls are scenery in this prototype; they do not block movement.</p>';
    } else if (name === 'inventory') {
      setText('dialog-title', 'Your traveling pack');
      content.innerHTML = `<p>${player.gold} copper · ${player.inventory.length} unique items. Equip one charm, one focus, and one ring. Duplicate loot is automatically salvaged into copper.</p><div class="equipment-row">${['charm', 'focus', 'ring'].map(slot => `<span>${slot}: ${escape(ITEMS[player.equipment[slot]]?.name || 'Empty')}</span>`).join('')}</div>` +
        `<div class="menu-note">${player.maxHp} maximum health · ${player.maxMp} maximum mana · +${player.power || 0} spell power</div><div class="inventory-list">` +
        (player.inventory.length ? player.inventory.map(id => {
          const item = ITEMS[id];
          const equipped = player.equipment[item.slot] === id;
          const stats = Object.entries(item.stats).map(([key, value]) => `+${value} ${key === 'hp' ? 'health' : key === 'mp' ? 'mana' : 'spell power'}`).join(' · ');
          return `<div class="item-card ${item.rarity}"><div><strong>${escape(item.name)}</strong><p>${escape(item.description)}</p><p>${stats}</p></div><button data-action="equip" data-item="${id}" ${equipped || game.dead ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip'}</button></div>`;
        }).join('') : '<p>Your pack is light. Your first victory will award equipment; named enemies carry rare finds.</p>') + '</div><div class="menu-actions"><button data-action="menu" data-menu="spellbook">Study your spells →</button><button data-action="menu" data-menu="guide">Field guide</button></div>';
    } else if (name === 'spellbook') {
      setText('dialog-title', 'The magician’s spellbook');
      const near = Math.hypot(player.x - WORLD.spawn.x, player.y - WORLD.spawn.y) <= 110;
      content.innerHTML = `<div class="menu-note">${near ? 'You are within reach of the bindstone.' : 'Return to the Willowmere bindstone to study upgrades.'} Rank 2 requires level 2 and 45 copper. Rank 3 requires level 5 and 90 copper. You have ${player.gold} copper.</div><div class="spellbook-list">` + SPELLS.map((spell, index) => {
        const rank = player.spellRanks[index];
        const required = rank === 1 ? 2 : 5;
        const canBuy = rank < 3 && near && !game.inCombat && !game.dead && player.level >= required && player.gold >= game.upgradeCost(index);
        const label = rank >= 3 ? 'Mastered' : player.level < required ? `Needs level ${required}` : `Upgrade · ${game.upgradeCost(index)}c`;
        return `<div class="spell-card"><div><strong>${escape(spell.name)} · Rank ${rank}</strong><p>${escape(spell.description)}</p><p>${spell.cost} mana · ${spell.cast}s cast</p></div><button data-action="upgrade" data-index="${index}" ${canBuy ? '' : 'disabled'}>${label}</button></div>`;
      }).join('') + '</div><p class="muted" style="margin-top:15px">Spell ranks improve strength or duration. Summon a new elemental after upgrading its spell to receive the new rank’s benefits.</p>';
    } else if (name === 'map') {
      setText('dialog-title', 'The Willowmere frontier');
      content.innerHTML = '<p>The road leads east through goblin territory, then southeast to the old crypt. Discover camps by approaching them. Use the map to plan your next trip.</p><canvas id="world-map" width="1000" height="710" aria-label="Map of Willowmere, showing your position and discovered camps"></canvas><div class="map-legend"><span>✦ You</span><span>◆ Bindstone</span><span>● Discovered camp</span><span>? Unexplored</span></div>';
    } else if (name === 'save') {
      setText('dialog-title', 'Keep your story');
      content.innerHTML = `<p>Your character saves automatically in this browser. Export a character file to transfer between computers, browsers, the direct HTML file, and a hosted game.</p><div class="save-banner">Level ${player.level} Magician · ${player.kills} victories · ${player.gold} copper<br><small>${storageAvailable ? 'Browser storage is available.' : 'Browser storage is blocked. Export before closing this page.'}</small></div><div class="stack-buttons"><button data-action="save-now"><strong>Save now</strong><small>Write your current progress to this browser.</small></button><button data-action="export"><strong>Export character</strong><small>Download a small JSON backup of your progress.</small></button><button data-action="import"><strong>Import character</strong><small>Choose a character file, then review before replacing this save.</small></button></div><div class="menu-actions"><button data-action="menu" data-menu="guide">Field guide</button><button data-action="menu" data-menu="spellbook">Spellbook</button><button class="danger-button" data-action="reset-review">New character</button></div><p class="muted">Saves preserve character progression, equipment, position, and death state. Encounters restart and elementals must be summoned again after loading. A saved position beside a guard is moved to safety on reload. There is no cloud synchronization.</p>`;
    } else if (name === 'reset') {
      setText('dialog-title', 'Begin a new story?');
      content.innerHTML = '<p>This replaces the character saved in this browser. Export your current character first if you want to return to it.</p><div class="menu-actions"><button data-action="export">Export current character</button><button class="danger-button" data-action="reset-confirm">Replace with a new character</button><button data-action="menu" data-menu="save">Keep playing</button></div>';
    } else if (name === 'import-review' && pendingImport) {
      const incoming = new Game({ save: pendingImport });
      setText('dialog-title', 'Import this character?');
      content.innerHTML = `<p>This will replace the active character with a level ${incoming.player.level} Magician carrying ${incoming.player.gold} copper and ${incoming.player.inventory.length} items.</p><div class="menu-actions"><button data-action="export">Export current character</button><button class="primary" data-action="import-confirm">Import and replace</button><button data-action="menu" data-menu="save">Cancel</button></div>`;
    } else return;
    if (!dialog.open) dialog.showModal();
    content.scrollTop = 0;
    if (name === 'map') renderer.drawMap($('world-map'), game, true);
    updateUI();
  }

  function closeMenu() {
    dialog.close();
    activeMenu = '';
    clearInput();
    canvas.focus({ preventScroll: true });
    updateUI();
  }

  function refreshMenu() {
    const name = activeMenu;
    activeMenu = '';
    openMenu(name);
  }

  function exportCharacter() {
    const blob = new Blob([JSON.stringify(game.serialize(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Everwild-level-${game.player.level}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function replaceGame(data) {
    game = new Game({ save: data });
    pendingImport = null;
    lastDead = game.dead;
    lastLog = -1;
    manualPause = false;
    pause(false);
    save();
    closeMenu();
    renderer.draw(game);
    updateUI();
  }

  $('dialog-content').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'menu') openMenu(button.dataset.menu);
    else if (action === 'equip' || action === 'upgrade') {
      const result = action === 'equip' ? game.equip(button.dataset.item) : game.buyUpgrade(Number(button.dataset.index));
      if (result && result.message) toast(result.message);
      save();
      refreshMenu();
    } else if (action === 'save-now') {
      const saved = save();
      button.innerHTML = saved ? '<strong>Character saved</strong><small>Your progress is safe in this browser.</small>' : '<strong>Storage is blocked</strong><small>Use Export character to keep your progress.</small>';
    } else if (action === 'export') exportCharacter();
    else if (action === 'import') { $('import-file').value = ''; $('import-file').click(); }
    else if (action === 'reset-review') openMenu('reset');
    else if (action === 'reset-confirm') replaceGame(null);
    else if (action === 'import-confirm' && pendingImport) replaceGame(pendingImport);
  });

  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 200000) throw new Error('This file is too large to be an Everwild character save.');
      const data = JSON.parse(await file.text());
      if (!validSave(data)) throw new Error('This file does not contain a valid Everwild character.');
      checkSaveVersion(data.version);
      pendingImport = data;
      openMenu('import-review');
    } catch (error) {
      const notice = document.createElement('p');
      notice.className = 'menu-note';
      notice.textContent = 'Import failed: ' + (error.message || 'The file could not be read.');
      $('dialog-content').prepend(notice);
    }
  });

  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openMenu(button.dataset.dialog)));
  $('map-toggle').addEventListener('click', () => openMenu('map'));
  $('dialog-close').addEventListener('click', closeMenu);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  $('pause').addEventListener('click', () => { pause(); updateUI(); });
  $('resume').addEventListener('click', () => { pause(false); canvas.focus({ preventScroll: true }); });
  $('revive').addEventListener('click', () => { game.revive(); pause(false); save(); updateUI(); canvas.focus({ preventScroll: true }); });
  $('attack').addEventListener('click', () => act(() => game.commandPet('attack')));
  $('follow').addEventListener('click', () => act(() => game.commandPet('follow')));
  $('rest').addEventListener('click', () => act(() => game.toggleMeditate()));
  $('interact').addEventListener('click', () => act(() => { const result = game.interact(); toast(result.message); return result; }));

  function cycleTarget() {
    const targets = game.mobs.filter(mob => mob.alive && !mob.returning && Math.hypot(mob.x - game.player.x, mob.y - game.player.y) <= 440)
      .sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y));
    if (targets.length) game.setTarget(targets[(targets.findIndex(mob => mob.id === game.selectedId) + 1) % targets.length].id);
    else game.targetNearest();
  }

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      event.preventDefault();
      if (event.repeat) return;
      if (dialog.open) closeMenu();
      else { pause(); updateUI(); }
      return;
    }
    if (!event.repeat && ['i', 'm', '?'].includes(key)) {
      event.preventDefault();
      openMenu(key === 'i' ? 'inventory' : key === 'm' ? 'map' : 'guide');
      return;
    }
    if (isPaused()) return;
    const canvasFocus = document.activeElement === canvas || document.activeElement === document.body;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      keys.add(key);
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (/^[1-8]$/.test(key)) { event.preventDefault(); cast(Number(key) - 1); }
    else if (key === 'f') act(() => game.commandPet('attack'));
    else if (key === 'g') act(() => game.commandPet('follow'));
    else if (key === 'r') act(() => game.toggleMeditate());
    else if (key === 'e') act(() => { const result = game.interact(); toast(result.message); return result; });
    else if (key === ' ' && canvasFocus) { event.preventDefault(); act(() => game.targetNearest()); }
    else if (key === 'tab' && document.activeElement === canvas) { event.preventDefault(); act(cycleTarget); }
  });
  document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInput(); save(); pause(true); }
    lastFrame = performance.now();
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', event => {
    if (isPaused() || game.dead || event.button > 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    const bounds = canvas.getBoundingClientRect();
    const point = renderer.screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
    const hitDistance = enemy => Math.hypot((enemy.x - point.x) / 24, (enemy.y - 18 - point.y) / 31);
    const mob = game.mobs.filter(enemy => enemy.alive).sort((a, b) => hitDistance(a) - hitDistance(b))
      .find(enemy => hitDistance(enemy) < 1.15);
    if (mob) game.setTarget(mob.id);
    else if (Math.abs(point.x - (WORLD.spawn.x - 58)) < 32 && point.y > WORLD.spawn.y - 92 && point.y < WORLD.spawn.y + 8 && Math.hypot(game.player.x - WORLD.spawn.x, game.player.y - WORLD.spawn.y) < 110) {
      const result = game.interact(); toast(result.message);
    } else game.moveTo(point.x, point.y);
    updateUI();
  });

  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - lastFrame) / 1000));
    lastFrame = now;
    if (!isPaused()) {
      game.update(dt, {
        dx: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
        dy: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
      });
      saveElapsed += dt;
      if (saveElapsed >= 7 || lastDead !== game.dead) { saveElapsed = 0; lastDead = game.dead; save(); }
    }
    renderer.draw(game);
    uiElapsed += dt;
    if (uiElapsed >= 0.1) { uiElapsed = 0; updateUI(); }
    if (now > toastUntil) $('toast').hidden = true;
    requestAnimationFrame(frame);
  }

  window.everwild = Object.freeze({ get game() { return game; }, renderer, openMenu, save, get paused() { return isPaused(); } });
  setText('version', VERSION);
  resize();
  updateUI();
  if (loadWarning) { game.log(loadWarning, 'warning'); toast(loadWarning); }
  requestAnimationFrame(frame);
})();
