/* Browser input, accessible menus, and local persistence for Everwild. */
(function () {
  'use strict';
  const { Game, Renderer, WORLD, CAMPS, SPELLS, ITEMS, NPCS, QUESTS, SUPPLIES, VERSION } = window.Everwild;
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
  let pendingNpc = null;
  let currentNpcId = null;
  let hotbarSignature = '';
  let inventoryFilter = 'all';
  let lastVisualId = 0, discoveryUntil = 0;
  const discoveryQueue = [];
  let audioContext = null, soundEnabled = false, lastImpactSound = -Infinity;
  try {
    renderer.pixelArt = localStorage.getItem('everwild_pixel_art') !== 'false';
    soundEnabled = localStorage.getItem('everwild_sound') === 'true';
  } catch (_) {}
  function syncPresentationButtons() {
    $('sound').textContent = soundEnabled ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('art-style').setAttribute('aria-pressed', String(renderer.pixelArt));
    $('art-style').textContent = renderer.pixelArt ? 'Pixel art' : 'Smooth art';
  }
  function unlockAudio() {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audioContext) audioContext = new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) { /* Sound is optional on browsers without Web Audio. */ }
  }
  function tone(frequency, delay, duration, volume, endFrequency, type = 'sine') {
    if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency || frequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(start); oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function presentationFeedback(now) {
    for (const visual of game.visuals) {
      if (visual.id <= lastVisualId) continue;
      lastVisualId = visual.id;
      if (visual.kind === 'impact' && now - lastImpactSound > 85) {
        lastImpactSound = now;
        const enemy = visual.source === 'enemy';
        tone(enemy ? 105 : 190, 0, 0.14, enemy ? 0.065 : 0.035, enemy ? 38 : 65, 'triangle');
      } else if (visual.kind === 'summon') { tone(110, 0, 0.7, 0.02, 220); tone(330, 0.18, 0.6, 0.015); }
      else if (visual.kind === 'bolt') tone(380, 0, 0.22, 0.018, 100, 'triangle');
      else if (visual.kind === 'discovery') discoveryQueue.push({ id: visual.itemId, rare: visual.rare });
    }
    if (now >= discoveryUntil && discoveryQueue.length) {
      const found = discoveryQueue.shift(), item = ITEMS[found.id];
      if (item) {
        const panel = $('discovery');
        panel.classList.toggle('rare', found.rare);
        panel.innerHTML = arcanaIcon(itemArt[found.id], 'discovery-art') + '<small>' + (found.rare ? 'A RARE DISCOVERY' : 'SOMETHING WORTH KEEPING') + '</small><strong>' + escape(item.name) + '</strong><span>Open your pack [I] to inspect and equip</span>';
        panel.hidden = false; discoveryUntil = now + (found.rare ? 6500 : 4200);
        [392, 493.88, 587.33, ...(found.rare ? [783.99] : [])].forEach((note, i) => tone(note, i * 0.13, 0.65, 0.018));
      }
    } else if (now >= discoveryUntil) $('discovery').hidden = true;
  }
  $('sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled; unlockAudio(); syncPresentationButtons();
    try { localStorage.setItem('everwild_sound', String(soundEnabled)); } catch (_) {}
  });
  $('art-style').addEventListener('click', () => {
    renderer.pixelArt = !renderer.pixelArt; syncPresentationButtons();
    try { localStorage.setItem('everwild_pixel_art', String(renderer.pixelArt)); } catch (_) {}
  });
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  syncPresentationButtons();


  const itemArt = { ...Object.fromEntries(Object.keys(ITEMS).slice(0, 8).map((id, index) => [id, index + 8])), 'worn-linen-robe':20, 'waxed-travel-cloak':21, 'mosswoven-mantle':22, 'emberwoven-robe':23 };
  const spellArt = [0, 1, 2, 3, 4, 5, 6, 7, 16, 17];
  const spellRoles = ['Companion · endurance', 'Direct damage', 'Damage over time', 'Control · interrupt', 'Companion · recovery', 'Companion · offense', 'Protection', 'Recovery', 'Damage · slow', 'Area damage'];
  function arcanaIcon(index, extra = '') {
    if (index >= 20) return `<span class="atlas-icon garb-art ${extra}" aria-hidden="true" style="background-position:${(index - 20) % 2 * 100}% ${Math.floor((index - 20) / 2) * 100}%"></span>`;
    if (index >= 16) return `<span class="atlas-icon extra-arcana ${extra}" aria-hidden="true" style="background-position:${(index - 16) % 2 * 100}% ${Math.floor((index - 16) / 2) * 100}%"></span>`;
    return `<span class="atlas-icon ${extra}" aria-hidden="true" style="background-position:${index % 4 * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%"></span>`;
  }
  function itemComparison(item) {
    const current = ITEMS[game.player.equipment[item.slot]];
    if (current?.id === item.id) return '<p class="comparison">Currently equipped</p>';
    const labels = { hp: 'health', mp: 'mana', power: 'spell power' };
    const changes = Object.keys(labels).map(key => {
      const delta = (item.stats[key] || 0) - (current?.stats[key] || 0);
      return delta ? `<span class="${delta > 0 ? 'gain' : 'loss'}">${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${labels[key]}</span>` : '';
    }).filter(Boolean).join(' · ') || 'Same base stats';
    return `<div class="comparison">Compared with ${escape(current?.name || 'an empty ' + item.slot + ' slot')}<p>${changes}</p>${current?.effect ? `<p class="loss">Replaces ${escape(current.effectName)}: ${escape(current.effect)}</p>` : ''}</div>`;
  }

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
    pendingNpc = null;
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

  const spellColors = ['#c5bc91', '#e2aa76', '#cf927c', '#b5acd1', '#b6c890', '#a6ced0', '#adc3d6', '#cabda3', '#b6d9e3', '#e7ad72'];
  for (let slot = 0; slot < 8; slot++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spell';
    button.id = 'spell' + slot;
    button.addEventListener('click', () => castHotbar(slot));
    $('actionbar').appendChild(button);
  }

  function refreshHotbar() {
    const signature = game.player.hotbar.join(',') + ':' + game.player.spellRanks.join(',') + ':' + game.player.level + ':' + Object.values(game.player.equipment).join(',');
    if (signature === hotbarSignature) return;
    hotbarSignature = signature;
    game.player.hotbar.forEach((index, slot) => {
      const spell = SPELLS[index];
      const button = $('spell' + slot);
      button.style.setProperty('--spell-color', spellColors[index]);
      button.title = `${spell.name} [${slot + 1}] — ${game.spellProfile(index).summary}. ${spell.description} ${spell.cast}s cast, ${spell.cost} mana.`;
      button.setAttribute('aria-label', button.title);
      button.dataset.spellIndex = String(index);
      button.innerHTML = `<span class="spell-top"><span class="spell-icon">${arcanaIcon(spellArt[index])}</span><kbd>${slot + 1}</kbd></span><b>${escape(spell.name)}</b><small>${spell.cost} mana · ${spell.cast}s</small><span class="rank-dot">${game.player.spellRanks[index] > 1 ? 'ⅡⅢ'[game.player.spellRanks[index] - 2] : ''}</span>`;
    });
  }

  function castHotbar(slot) { cast(game.player.hotbar[slot]); }

  function cast(index) {
    act(() => {
      pendingNpc = null;
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
    refreshHotbar();
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
    setText('pet-combat-stats', pet ? `${pet.damage} damage per strike · ${pet.type === 'Earth' ? 'sturdy tank' : 'swift striker'}${game.hasEquipped('ring-of-bound-earth') ? ' · Stonebound −20% damage taken' : ''}` : '');
    const petTarget = pet && game.mobs.find(mob => mob.id === pet.targetId && mob.alive);
    setText('pet-order', petTarget ? `Attacking ${petTarget.name} · ${Math.hypot(pet.x-petTarget.x,pet.y-petTarget.y)>35 ? 'closing in' : 'next strike in ' + Math.max(0,pet.attackAt-game.clock).toFixed(1) + 's'} · Q to taunt` : pet ? (pet.mode === 'guard' ? 'Guarding you · defends when you are attacked' : 'Following passively · F attacks, C guards') : 'Earth endures. Air strikes quickly.');
    const completeQuests = QUESTS.filter(quest => game.questState(quest.id).status === 'completed').length;
    setText('quest-count', `${completeQuests} / ${QUESTS.length} complete →`);
    const nextSpell = SPELLS.find(spell => spell.unlockLevel > player.level);
    const unassigned = SPELLS.find((spell, index) => spell.unlockLevel > 1 && game.isSpellUnlocked(index) && !player.hotbar.includes(index));
    setText('next-spell', unassigned ? `${unassigned.name} is unlocked. Assign it in your spellbook.` : nextSpell ? `${nextSpell.name} awakens at level ${nextSpell.unlockLevel}.` : 'All ten spells unlocked · shape your own spell bar.');
    const selected = game.selected;
    updateTacticalTip(selected);
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
      $('threat-info').hidden = !selected.aggro || selected.returning;
      const yourThreat = selected.threatPlayer / Math.max(1, selected.threatPlayer + selected.threatPet) * 100;
      const onYou = selected.targetId === 'player';
      setText('threat-label', onYou ? 'Attention: YOU' : selected.targetId ? 'Attention: your elemental' : 'Closing in');
      setText('threat-value', `${Math.round(yourThreat)}% yours`);
      meter('threat-bar', yourThreat, 100);
      $('threat-bar').classList.toggle('danger', onYou);
      $('enemy-intent').hidden = !selected.intent;
      if (selected.intent) {
        setText('enemy-intent-name', `${selected.intent.name} · ${Math.max(0, selected.intent.done - game.clock).toFixed(1)}s`);
        setText('enemy-intent-hint', selected.intent.kind === 'heal' ? 'Arcane Root interrupts healing' : 'Step out · Arcane Root interrupts');
        meter('enemy-intent-bar', game.clock - selected.intent.started, selected.intent.done - selected.intent.started);
      }
    }
    const nearHome = Math.hypot(player.x - WORLD.spawn.x, player.y - WORLD.spawn.y) < 150;
    const camp = CAMPS.find(candidate => Math.hypot(player.x - candidate.x, player.y - candidate.y) < 235);
    setText('area-name', camp ? camp.name : 'Willowmere Frontier');
    setText('area-note', nearHome ? 'A quiet refuge at the edge of the unknown' : camp ? `Level ${camp.level} territory · tread carefully` : 'Follow the eastern road into the wilds');
    const stateText = game.dead ? 'Spirit unbound' : game.inCombat ? 'In combat' : game.meditate ? 'Meditating' : nearHome ? 'Sanctuary' : 'Exploring';
    $('world-state').innerHTML = `<i style="background:${game.inCombat ? '#d49b77' : '#8fbd9d'}"></i> ${stateText}`;
    updateObjective();
    const remaining = game.cast ? Math.max(0, game.cast.done - game.clock) : 0;
    setText('cast-status', game.cast ? `Casting ${SPELLS[game.cast.i].name}` : game.meditate ? 'Meditating · recovering mana' : game.dead ? 'Return to the bindstone' : 'Ready for the road');
    meter('cast-progress', game.cast ? game.clock - game.cast.started : 0, game.cast ? game.cast.done - game.cast.started : 1);
    setText('cast-time', game.cast ? remaining.toFixed(1) + 's' : '');
    for (let slot = 0; slot < 8; slot++) {
      const index = player.hotbar[slot];
      const button = $('spell' + slot);
      button.disabled = game.dead || player.mp < SPELLS[index].cost || isPaused();
      button.classList.toggle('casting', Boolean(game.cast && game.cast.i === index));
    }
    $('rest').innerHTML = `<kbd>R</kbd> ${game.meditate ? 'Stand up' : 'Meditate'}`;
    $('rest').classList.toggle('active', game.meditate);
    for (const id of ['attack', 'follow', 'guard', 'rest', 'interact']) $(id).disabled = game.dead || isPaused();
    $('guard').classList.toggle('active', Boolean(pet && pet.mode === 'guard'));
    const tauntRemaining = pet ? Math.max(0, (pet.tauntReadyAt || 0) - game.clock) : 0;
    $('taunt').disabled = !pet || game.dead || isPaused() || tauntRemaining > 0;
    $('taunt').innerHTML = `<kbd>Q</kbd> ${tauntRemaining > 0 ? Math.ceil(tauntRemaining) + 's' : 'Taunt'}`;
    const supplyRemaining = Math.max(0, game.supplyReadyAt - game.clock);
    setText('health-count', player.supplies['health-tonic'] || 0);
    setText('mana-count', player.supplies['mana-tonic'] || 0);
    setText('supply-cooldown', supplyRemaining > 0 ? Math.ceil(supplyRemaining) + 's recovery' : '');
    for (const id of ['health-tonic', 'mana-tonic']) $(id).disabled = game.dead || isPaused() || supplyRemaining > 0 || !player.supplies[id];
    const nearbyNpc = game.nearestNpc();
    $('interaction-hint').hidden = game.dead || game.inCombat || (!nearbyNpc && !pendingNpc);
    setText('interaction-hint', pendingNpc ? `Walking to ${NPCS.find(npc => npc.id === pendingNpc)?.name || 'villager'}…` : nearbyNpc ? `${nearbyNpc.name} · click to talk` : '');
    $('death-overlay').hidden = !game.dead;
    $('paused-overlay').hidden = !manualPause || game.dead;
    const newest = game.logs.length ? game.logs[game.logs.length - 1].id : 0;
    if (newest !== lastLog) {
      lastLog = newest;
      $('log').innerHTML = game.logs.slice(-24).reverse().map(entry => `<div class="${escape(entry.type)}">${escape(entry.text)}</div>`).join('');
    }
    renderer.drawMap($('minimap'), game);
  }

  function updateTacticalTip(selected) {
    const p = game.player, pet = game.pet;
    const slotKey = index => { const slot = p.hotbar.indexOf(index); return slot >= 0 ? '[' + (slot + 1) + ']' : 'in your spellbook [B]'; };
    const threats = game.mobs.filter(mob => mob.aggro && !mob.returning && mob.alive);
    const intent = threats.find(mob => mob.intent)?.intent;
    let tip = '', urgent = false;
    if (game.dead) tip = 'Your belongings are safe. Return to the bindstone; future victories repay experience debt.';
    else if (intent) { tip = intent.kind === 'heal' ? `Healing ritual: Arcane Root ${slotKey(3)} interrupts it.` : `Leave the marked ground or interrupt with Arcane Root ${slotKey(3)}. Recall an endangered pet with [G].`; urgent = true; }
    else if (threats.length > 1) { tip = 'Several enemies are engaged. Control one with Root, heal your pet, or retreat to Willowmere.'; urgent = true; }
    else if (pet && pet.hp < pet.maxHp * 0.55) { tip = `Your elemental is hurt. Pet Mend ${slotKey(4)} restores up to ${game.spellProfile(4).heal} health.`; urgent = true; }
    else if (selected?.targetId === 'player' && selected.aggro) { tip = `The enemy is on you. Send your pet [F], then taunt [Q] in range. Magic Shield ${slotKey(6)} reduces incoming damage.`; urgent = true; }
    else if (p.mp < 35) tip = 'Mana is low. Drink a mana tonic [X], or find safety and meditate [R]. The bindstone restores your party free.';
    else if (p.inventory.some(id => !p.equipment[ITEMS[id].slot])) tip = 'A new find can strengthen you. Open your pack [I], compare its properties, and equip it.';
    else if (!pet) tip = `Summon an Earth Pet ${slotKey(0)} before entering a camp. Earth endures; air trades durability for faster damage.`;
    else if (selected && !selected.aggro) tip = 'Send your elemental [F] and let it reach the enemy before adding damage. Pull a lone guard first.';
    else if (game.inCombat) tip = `Burning Mark ${slotKey(2)} deals efficient damage over time. Save mana for Pet Mend and Root; use [G] to recall.`;
    else if (game.activeQuests.some(quest => quest.status === 'ready')) tip = 'Your assignment is ready. Return to the quest giver for experience, copper, and the next lead.';
    else if (game.questState('crypt-proof').status === 'completed') tip = 'The eastern road is safer. Revisit named camps for relics, refine your spell ranks, or prepare for Othrek’s Vigil.';
    else tip = 'Choose a lone guard. Return to the bindstone between hunts, study ranks at levels 2 and 5, and carry tonics for named foes.';
    setText('tactical-tip', tip);
    $('tactical-tip').classList.toggle('urgent', urgent);
  }

  function updateObjective() {
    const quest = QUESTS.find(value => game.questState(value.id).status === 'ready') ||
      QUESTS.find(value => game.questState(value.id).status === 'active') ||
      QUESTS.find(value => game.questState(value.id).status === 'available');
    if (!quest) {
      setText('objective-title', 'The Eastern Road · complete');
      setText('objective-text', 'Your first expedition is complete. Refine your equipment and spells, then prepare for Othrek’s Vigil when you are ready.');
      meter('objective-progress', 1, 1);
      return;
    }
    const state = game.questState(quest.id);
    const npc = NPCS.find(value => value.id === quest.npcId);
    setText('objective-title', quest.title);
    if (state.status === 'available') setText('objective-text', `Speak with ${npc.name} in Willowmere to take this assignment.`);
    else if (state.status === 'ready') setText('objective-text', `Ready to report. Return to ${npc.name} for your reward.`);
    else if (!game.pet && game.player.kills === 0) setText('objective-text', 'Summon an Earth Elemental [1], then follow the road east to Briarwatch.');
    else setText('objective-text', `${quest.objectiveText} · ${state.progress} / ${state.required}`);
    meter('objective-progress', state.progress, state.required);
  }

  function menuTabs(active) {
    return '<div class="menu-tabs">' + [['journal', 'Assignments'], ['camps', 'Camp notes'], ['map', 'Frontier map'], ['spellbook', 'Spellbook']]
      .map(([name, label]) => `<button class="${name === active ? 'current' : ''}" data-action="menu" data-menu="${name}">${label}</button>`).join('') + '</div>';
  }

  function nearNpc(npc) {
    return npc && Math.hypot(game.player.x - npc.x, game.player.y - npc.y) <= 90;
  }

  function completionCard() {
    return `<section class="completion-card"><span class="eyebrow">FIRST EXPEDITION COMPLETE</span><h3>The eastern road is open.</h3><p>You answered Rowan’s call, broke Bramblemaw’s binding, and ended the Bonewarden’s watch. Willowmere has a reason to light its lanterns again.</p><div>Level ${game.player.level} magician · ${game.player.kills} victories · ${game.player.inventory.length} unique finds</div><button data-action="menu" data-menu="camps">Choose your next hunt →</button></section>`;
  }

  function rewardText(quest) {
    const rewards = [];
    if (quest.reward.xp) rewards.push(`${quest.reward.xp} XP`);
    if (quest.reward.gold) rewards.push(`${quest.reward.gold} copper`);
    if (quest.reward.itemId && ITEMS[quest.reward.itemId]) rewards.push(ITEMS[quest.reward.itemId].name);
    return rewards.map(value => `<span>✧ ${escape(value)}</span>`).join('');
  }

  function questCard(quest, npcId = null) {
    const state = game.questState(quest.id);
    const npc = NPCS.find(value => value.id === quest.npcId);
    const labels = { available: 'AVAILABLE', locked: 'UNDISCOVERED', active: 'IN PROGRESS', ready: 'READY TO REPORT', completed: 'COMPLETED' };
    const local = npcId === npc.id && nearNpc(npc) && !game.dead && !game.inCombat;
    let action = '';
    if (state.status === 'available') action = local ? `<button class="primary" data-action="accept-quest" data-quest="${quest.id}">Take assignment</button>` : `<button data-action="visit-npc" data-npc="${npc.id}">Visit ${escape(npc.name)}</button>`;
    else if (state.status === 'ready') action = local ? `<button class="primary" data-action="turn-in" data-quest="${quest.id}">Report back · claim reward</button>` : `<button data-action="visit-npc" data-npc="${npc.id}">Return to ${escape(npc.name)}</button>`;
    else if (state.status === 'active') action = '<button data-action="menu" data-menu="camps">Read camp notes</button>';
    const prerequisite = QUESTS.find(value => value.id === quest.prerequisite);
    return `<article class="quest-card ${state.status}" data-quest-card="${quest.id}"><div class="quest-top"><h3>${escape(quest.title)}</h3><span class="status-badge">${labels[state.status]}</span></div>` +
      `<p>${state.status === 'locked' ? `Complete ${escape(prerequisite?.title || 'the previous assignment')} to follow this lead.` : escape(quest.description)}</p>` +
      `<p class="quest-objective">${escape(quest.objectiveText)}${['active', 'ready'].includes(state.status) ? ` · ${state.progress} / ${state.required}` : ''}</p>` +
      `<div class="quest-progress-line"><i style="width:${Math.max(0, Math.min(100, state.progress / Math.max(1, state.required) * 100))}%"></i></div><div class="quest-rewards">${rewardText(quest)}</div>` +
      `<div class="quest-actions"><small>${escape(npc.name)} · Willowmere</small>${action}</div></article>`;
  }

  function showFeedback(message, ok = true) {
    if (!message) return;
    if (!dialog.open) { toast(message); return; }
    $('dialog-content').querySelector('.menu-feedback')?.remove();
    const notice = document.createElement('div');
    notice.className = 'menu-feedback' + (ok ? '' : ' error');
    notice.setAttribute('role', 'status');
    notice.textContent = message;
    $('dialog-content').prepend(notice);
  }

  function requestNpc(id) {
    const npc = NPCS.find(value => value.id === id);
    if (!npc) return;
    if (game.dead || game.inCombat) { showFeedback('Return safely to the village before talking.', false); return; }
    if (nearNpc(npc)) { currentNpcId = npc.id; openMenu('npc:' + npc.id); }
    else {
      if (dialog.open) closeMenu();
      pause(false);
      pendingNpc = npc.id;
      game.moveTo(npc.x - 24, npc.y + 30);
      toast(`Approaching ${npc.name}. Move or cast to cancel.`);
    }
  }

  function interact() {
    act(() => {
      const result = game.interact();
      if (result.npcId) requestNpc(result.npcId);
      else toast(result.message);
      return result;
    });
  }

  function openMenu(name) {
    if (name.startsWith('npc:')) {
      const npc = NPCS.find(value => value.id === name.slice(4));
      if (!nearNpc(npc) || game.inCombat || game.dead) { toast('Move close to the villager and finish combat before talking.'); return; }
      currentNpcId = npc.id;
    }
    if (dialog.open && activeMenu === name) { closeMenu(); return; }
    clearInput();
    activeMenu = name;
    const content = $('dialog-content');
    const player = game.player;
    if (name.startsWith('npc:')) {
      const npc = NPCS.find(value => value.id === currentNpcId);
      setText('dialog-title', npc.name);
      const assignments = QUESTS.filter(quest => quest.npcId === npc.id && game.questState(quest.id).status !== 'locked');
      content.innerHTML = `<div class="npc-intro"><div class="npc-portrait ${npc.id}">${escape(npc.name.replace(/^(Warden|Elementalist|Quartermaster) /, '').charAt(0))}</div><div><span class="eyebrow">${escape(npc.role)}</span><p>${escape(npc.description)}</p></div></div><div class="npc-dialogue">${game.npcDialogue(npc.id).map(line => `<p>“${escape(line)}”</p>`).join('')}</div>`;
      if (npc.id === 'mara') {
        content.innerHTML += `<div class="journal-summary"><span>Supplies for the road</span><span>${player.gold} copper in your pack</span></div><div class="shop-list">` + Object.values(SUPPLIES).map(supply =>
          `<article class="shop-item"><span class="supply-symbol">${supply.id === 'health-tonic' ? '♧' : '◈'}</span><h3>${escape(supply.name)}</h3><p>${escape(supply.description)}</p><div class="owned">Carrying ${player.supplies[supply.id] || 0} · shared 20s recovery</div><button data-action="buy-supply" data-item="${supply.id}" ${player.gold < supply.cost ? 'disabled' : ''}>Buy · ${supply.cost} copper</button></article>`
        ).join('') + '</div>';
      }
      if (npc.id === 'rowan' && game.questState('crypt-proof').status === 'completed') content.innerHTML += completionCard();
      if (assignments.length) content.innerHTML += '<div class="quest-list">' + assignments.map(quest => questCard(quest, npc.id)).join('') + '</div>';
      if (npc.id === 'liora') content.innerHTML += '<div class="npc-links"><button class="primary" data-action="menu" data-menu="spellbook">Study and arrange spells</button><button data-action="menu" data-menu="guide">Learn pet tactics</button></div>';
      else content.innerHTML += '<div class="npc-links"><button data-action="menu" data-menu="journal">Your assignments</button><button data-action="menu" data-menu="camps">Ask about the camps</button></div>';
      content.innerHTML += '<p class="npc-close-note">The village waits while you talk. Close this conversation to continue your expedition.</p>';
    } else if (name === 'journal') {
      setText('dialog-title', 'The Eastern Road');
      const completed = QUESTS.filter(quest => game.questState(quest.id).status === 'completed').length;
      content.innerHTML = menuTabs('journal') + (completed === QUESTS.length ? completionCard() : '') + `<p>${completed === QUESTS.length ? 'The first expedition is recorded below. Revisit the camps, compare their relics, and prepare your next spell bar when you are ready.' : 'Willowmere’s quiet roads have become dangerous. Help the people here, learn what the goblins are carrying, and trace the disturbance toward the crypt.'}</p><div class="journal-summary"><span>Your expedition</span><span>${completed} of ${QUESTS.length} assignments completed</span></div><div class="quest-list">` + QUESTS.map(quest => questCard(quest)).join('') + '</div><p class="muted" style="margin-top:17px">Accept an assignment before hunting its targets. Existing equipment can satisfy item evidence assignments, and you keep the equipment when you report back.</p>';
    } else if (name === 'camps') {
      setText('dialog-title', 'Rumors from the road');
      content.innerHTML = menuTabs('camps') + '<p>Every camp has a reason to return. Learn the guards, watch for the named foe, and choose the piece of equipment you want to pursue.</p><div class="camp-list">' + CAMPS.map(camp => {
        const item = ITEMS[camp.rareItemId];
        const found = game.discovered.includes(camp.id);
        return `<article class="camp-card"><div class="camp-heading"><h3>${escape(camp.name)}</h3><span class="camp-level">Lv. ${camp.level}–${camp.level + 1} · ${found ? 'Discovered' : 'Rumored'}</span></div><p>${escape(camp.description)}</p><p><strong>${escape(camp.namedName)}</strong> commands this camp.</p>${item ? `<div class="camp-loot">${arcanaIcon(itemArt[item.id])}<div><strong>${escape(item.name)}</strong><small>${escape(item.description)}</small>${item.effect ? `<small class="gear-magic">${escape(item.effectName)}: ${escape(item.effect)}</small>` : ''}</div></div>` : ''}${camp.bonusItemId ? `<div class="camp-loot bonus-loot">${arcanaIcon(itemArt[camp.bonusItemId])}<div><strong>${escape(ITEMS[camp.bonusItemId].name)}</strong><small>${Math.round(camp.bonusDropChance * 100)}% additional drop chance · ${escape(ITEMS[camp.bonusItemId].effect)}</small></div></div>` : ''}<p class="camp-tip">${escape(camp.roleHint)}</p><p class="muted">Guards return after ${camp.delay}s. Named foes can appear again in their camp. Duplicate equipment becomes copper.</p></article>`;
      }).join('') + '</div>';
    } else if (name === 'guide') {
      setText('dialog-title', 'Your first expedition');
      content.innerHTML = '<p>You are a magician on the edge of Willowmere. Your elemental is your companion, your shield, and the heart of your strategy.</p>' +
        '<div class="guide-cards"><div class="guide-card"><span>01</span><b>Meet the warden</b><p>Click Warden Rowan by the road and take his first assignment. Summon an Earth Elemental with 1 before leaving Willowmere.</p></div><div class="guide-card"><span>02</span><b>Choose your fight</b><p>Follow the road east. Target a Briarwatch scout, press F, and let your pet engage. Add Fire Bolt with 2; use Q to have your pet taunt.</p></div><div class="guide-card"><span>03</span><b>Come home stronger</b><p>Equip loot with I and report to Rowan. Liora helps with spells, Mara sells tonics, and the bindstone restores your party.</p></div></div>' +
        '<h3>Read the fight</h3><p>Amber ground circles warn of an enemy’s special attack. Move outside the circle before it fills, or interrupt the enemy with Arcane Root. Rooted enemies can still strike anyone beside them. Your target card shows whether you or your elemental has its attention.</p>' +
        '<h3>A companion with commands</h3><p>Guard [C] tells your pet to defend you when you are hit. Attack [F] sends it to your chosen enemy. Follow [G] recalls it passively so it will not immediately start another fight. Taunt [Q] pulls a nearby enemy’s attention toward the elemental and recovers in 12 seconds.</p>' +
        '<div class="build-guides"><article><h3>Steady earth</h3><p>An Earth Pet holds attention while Burning Mark works. Save mana for Root and Pet Mend; a Mosswoven Mantle strengthens each mend, and the earth ring reduces incoming pet damage.</p></article><article><h3>Swift air</h3><p>An Air Pet deals more damage but needs closer care. A linen robe adds mana and spell power for a faster kill. Grik’s charm replenishes mana between fights; the Boneguard protects you when attention slips.</p></article></div><h3>Deliberate magic</h3><p>Moving interrupts a cast without spending mana. Spells keep the target chosen when casting began. Frost Lance unlocks at level 3 and slows a foe; Ember Nova unlocks at level 5 and hits nearby enemies. Open the spellbook [B] to assign any unlocked spell to one of your eight hotbar slots.</p>' +
        '<h3>Progress that stays with you</h3><p>Defeated enemies return after 45–75 seconds. Named enemies have a chance to return in their camp’s final guard position and carry rare gear. Duplicates become copper. At levels 2 and 5, buy spell ranks at the bindstone. Death adds 15% of your next level’s XP requirement as debt; you keep your level, items, and copper.</p>' +
        '<div class="controls-grid">' + [['WASD / ↑↓←→', 'Move (or click ground)'], ['Click / Space', 'Choose / nearest target'], ['Tab', 'Cycle targets while canvas focused'], ['1–8', 'Cast the assigned hotbar spell'], ['F / G', 'Pet attack / passive follow'], ['C / Q', 'Pet guard / taunt'], ['R', 'Meditate / stand'], ['E', 'Talk nearby / use bindstone'], ['Z / X', 'Health / mana tonic'], ['I / M', 'Pack / frontier map'], ['J / B', 'Quest journal / spellbook'], ['Esc', 'Stop moving / pause']].map(([key, text]) => `<div><kbd>${key}</kbd><span>${text}</span></div>`).join('') + '</div>' +
        '<p class="muted" style="margin-top:20px">On touch devices: tap ground to move, tap an enemy to target, then use the spell and pet buttons. Trees, water, and ruin walls are scenery in this prototype; they do not block movement.</p>';
    } else if (name === 'inventory') {
      setText('dialog-title', 'Your traveling pack');
      const slots = ['charm', 'focus', 'ring', 'garb'];
      const visibleItems = player.inventory.filter(id => inventoryFilter === 'all' || ITEMS[id].slot === inventoryFilter);
      visibleItems.sort((a, b) => Number(player.equipment[ITEMS[b].slot] === b) - Number(player.equipment[ITEMS[a].slot] === a) || Number(ITEMS[b].rarity === 'rare') - Number(ITEMS[a].rarity === 'rare'));
      content.innerHTML = `<div class="pack-summary"><div><span class="eyebrow">YOUR EQUIPMENT</span><p>${player.inventory.length} discoveries · ${player.gold} copper</p></div><div>${player.maxHp} health · ${player.maxMp} mana · +${player.power || 0} spell power</div></div><div class="gear-slots">` + slots.map(slot => {
        const item = ITEMS[player.equipment[slot]];
        return `<div class="gear-slot ${item?.rarity || ''}">${item ? arcanaIcon(itemArt[item.id]) : '<span class="empty-slot">◇</span>'}<small>${slot.toUpperCase()}</small><strong>${escape(item?.name || 'Empty slot')}</strong>${item?.effectName ? `<span class="gear-magic">${escape(item.effectName)}</span>` : ''}</div>`;
      }).join('') + `</div><div class="menu-tabs" aria-label="Filter equipment">` + ['all', ...slots].map(filter => `<button data-action="filter-items" data-filter="${filter}" aria-pressed="${filter === inventoryFilter}" class="${filter === inventoryFilter ? 'current' : ''}">${filter === 'all' ? 'All finds' : filter}</button>`).join('') + '</div><div class="inventory-list">' +
        (visibleItems.length ? visibleItems.map(id => {
          const item = ITEMS[id], equipped = player.equipment[item.slot] === id;
          const stats = Object.entries(item.stats).map(([key, value]) => `${value < 0 ? '−' : '+'}${Math.abs(value)} ${key === 'hp' ? 'health' : key === 'mp' ? 'mana' : 'spell power'}`).join(' · ');
          const camp = CAMPS.find(camp => camp.rareItemId === id || camp.id === item.campId);
          const gift = QUESTS.find(quest => quest.reward.itemId === id);
          const giver = gift && NPCS.find(npc => npc.id === gift.npcId);
          return `<article class="item-card ${item.rarity}">${arcanaIcon(itemArt[id], 'item-art')}<div class="item-details"><span class="eyebrow">${item.rarity.toUpperCase()} · ${item.slot.toUpperCase()}</span><strong>${escape(item.name)}</strong><p class="item-lore">“${escape(item.description)}”</p><p class="item-stats">${stats}</p>${item.effect ? `<div class="item-magic"><strong>✦ ${escape(item.effectName)}</strong><p>${escape(item.effect)}</p></div>` : ''}${itemComparison(item)}${camp ? `<small class="item-origin">Recovered from ${escape(camp.namedName)} · ${escape(camp.name)}${id === camp.bonusItemId ? ' · ' + Math.round(camp.bonusDropChance * 100) + '% chance after victory' : ''}</small>` : gift ? `<small class="item-origin">Gift from ${escape(giver.name)} · ${escape(gift.title)}</small>` : id === 'worn-linen-robe' ? '<small class="item-origin">Your first ordinary victory guarantees this useful find.</small>' : ''}</div><button data-action="equip" data-item="${id}" ${equipped || game.dead ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip'}</button></article>`;
        }).join('') : '<p class="empty-pack">No finds in this part of your pack yet. Your first victory awards equipment; named foes carry unique magic.</p>') + '</div><h3>Supplies for the road</h3><div class="supply-pack">' + Object.values(SUPPLIES).map(supply => `<button data-action="use-supply" data-item="${supply.id}" ${!player.supplies[supply.id] || game.dead || game.supplyReadyAt > game.clock ? 'disabled' : ''}>${escape(supply.name)} ×${player.supplies[supply.id] || 0} · Use</button>`).join('') + '</div><p class="supplies-note">Tonics share a 20-second recovery. Buy more from Mara in Willowmere. Duplicate equipment is salvaged into copper.</p><div class="menu-actions"><button data-action="menu" data-menu="spellbook">Study your spells →</button><button data-action="menu" data-menu="journal">Quest journal</button></div>';
    } else if (name === 'spellbook') {
      setText('dialog-title', 'The magician’s spellbook');
      const near = Math.hypot(player.x - WORLD.spawn.x, player.y - WORLD.spawn.y) <= 110;
      content.innerHTML = menuTabs('spellbook') + `<div class="menu-note">${near ? 'You are within reach of the bindstone.' : 'Return to the Willowmere bindstone to study upgrades.'} Rank 2 requires level 2 and 45 copper. Rank 3 requires level 5 and 90 copper. You have ${player.gold} copper. Assign unlocked spells to your eight hotbar slots below.</div><div class="spellbook-list">` + SPELLS.map((spell, index) => {
        const rank = player.spellRanks[index];
        const required = rank === 1 ? 2 : 5;
        const unlocked = game.isSpellUnlocked(index);
        const canBuy = unlocked && rank < 3 && near && !game.inCombat && !game.dead && player.level >= required && player.gold >= game.upgradeCost(index);
        const label = !unlocked ? `Unlocks at level ${spell.unlockLevel}` : rank >= 3 ? 'Mastered' : player.level < required ? `Needs level ${required}` : `Upgrade · ${game.upgradeCost(index)}c`;
        const assigned = player.hotbar.indexOf(index);
        const choices = '<option value="-1">Choose a slot…</option>' + player.hotbar.map((currentIndex, slot) => `<option value="${slot}" ${assigned === slot ? 'selected' : ''}>${slot + 1} · ${escape(SPELLS[currentIndex].name)}</option>`).join('');
        return `<div class="spell-card ${unlocked ? '' : 'locked'}">${arcanaIcon(spellArt[index], 'spellbook-art')}<div class="spell-details"><span class="eyebrow">${spellRoles[index]}</span><strong>${escape(spell.name)} · ${unlocked ? 'Rank ' + rank : 'Unlearned'}</strong><p>${escape(spell.description)}</p><p>${spell.cost} mana · ${spell.cast}s cast</p><div class="spell-numbers"><small>AT YOUR LEVEL</small><p>${escape(game.spellProfile(index).summary)}</p>${unlocked && rank < 3 ? `<small>NEXT RANK</small><p>${escape(game.spellProfile(index, rank + 1).summary)}</p>` : ''}</div>${spell.unlockLevel > 1 ? `<p class="unlock-note">${unlocked ? 'Unlocked at' : 'Requires'} level ${spell.unlockLevel}</p>` : ''}</div><div class="spell-card-controls"><button data-action="upgrade" data-index="${index}" ${canBuy ? '' : 'disabled'}>${label}</button><label class="spell-bind">Action bar slot<select aria-label="Assign ${escape(spell.name)} to a hotbar slot" data-spell-index="${index}" ${!unlocked || game.dead ? 'disabled' : ''}>${choices}</select></label></div></div>`;
      }).join('') + '</div><p class="muted" style="margin-top:15px">Spell ranks improve strength or duration. Summon a new elemental after upgrading its spell to receive the new rank’s benefits.</p>';
    } else if (name === 'map') {
      setText('dialog-title', 'The Willowmere frontier');
      content.innerHTML = menuTabs('map') + '<p>The road leads east through goblin territory, then southeast to the old crypt. Rowan, Liora, and Mara wait in Willowmere. Discover camps by approaching them.</p><canvas id="world-map" width="1000" height="710" aria-label="Map of Willowmere, showing your position, village, and discovered camps"></canvas><div class="map-legend"><span>✦ You</span><span>◆ Willowmere</span><span>● Discovered camp</span><span>? Unexplored</span></div>';
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
    lastVisualId = 0; discoveryQueue.length = 0; discoveryUntil = 0;
    $('discovery').hidden = true;
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
    if (action === 'filter-items') {
      if (['all', 'charm', 'focus', 'ring', 'garb'].includes(button.dataset.filter)) inventoryFilter = button.dataset.filter;
      refreshMenu();
    } else if (action === 'menu') openMenu(button.dataset.menu);
    else if (action === 'visit-npc') requestNpc(button.dataset.npc);
    else if (['accept-quest', 'turn-in', 'buy-supply', 'use-supply'].includes(action)) {
      let result;
      if (action === 'accept-quest') result = game.acceptQuest(button.dataset.quest);
      else if (action === 'turn-in') result = game.turnInQuest(button.dataset.quest);
      else if (action === 'buy-supply') result = game.buySupply(button.dataset.item);
      else result = game.useSupply(button.dataset.item);
      if (result.ok) save();
      refreshMenu();
      showFeedback(result.message, result.ok);
    }
    else if (action === 'equip' || action === 'upgrade') {
      const result = action === 'equip' ? game.equip(button.dataset.item) : game.buyUpgrade(Number(button.dataset.index));
      save();
      refreshMenu();
      if (result && result.message) showFeedback(result.message, result.ok);
    } else if (action === 'save-now') {
      const saved = save();
      button.innerHTML = saved ? '<strong>Character saved</strong><small>Your progress is safe in this browser.</small>' : '<strong>Storage is blocked</strong><small>Use Export character to keep your progress.</small>';
    } else if (action === 'export') exportCharacter();
    else if (action === 'import') { $('import-file').value = ''; $('import-file').click(); }
    else if (action === 'reset-review') openMenu('reset');
    else if (action === 'reset-confirm') replaceGame(null);
    else if (action === 'import-confirm' && pendingImport) replaceGame(pendingImport);
  });

  $('dialog-content').addEventListener('change', event => {
    const select = event.target.closest('select[data-spell-index]');
    if (!select || Number(select.value) < 0) return;
    const result = game.assignSpell(Number(select.value), Number(select.dataset.spellIndex));
    if (result.ok) save();
    refreshMenu();
    showFeedback(result.message, result.ok);
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
  $('guard').addEventListener('click', () => act(() => game.commandPet('guard')));
  $('taunt').addEventListener('click', () => act(() => game.commandPet('taunt')));
  $('rest').addEventListener('click', () => act(() => { pendingNpc = null; return game.toggleMeditate(); }));
  $('interact').addEventListener('click', interact);
  for (const id of ['health-tonic', 'mana-tonic']) $(id).addEventListener('click', () => useSupply(id));

  function useSupply(id) {
    act(() => {
      const result = game.useSupply(id);
      if (result.ok) save();
      return result;
    });
  }

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
    if (!event.repeat && ['i', 'm', 'j', 'b', '?'].includes(key)) {
      event.preventDefault();
      openMenu(({ i: 'inventory', m: 'map', j: 'journal', b: 'spellbook', '?': 'guide' })[key]);
      return;
    }
    if (isPaused()) return;
    const canvasFocus = document.activeElement === canvas || document.activeElement === document.body;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      pendingNpc = null;
      keys.add(key);
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (/^[1-8]$/.test(key)) { event.preventDefault(); castHotbar(Number(key) - 1); }
    else if (key === 'f') act(() => game.commandPet('attack'));
    else if (key === 'g') act(() => game.commandPet('follow'));
    else if (key === 'c') act(() => game.commandPet('guard'));
    else if (key === 'q') act(() => game.commandPet('taunt'));
    else if (key === 'r') act(() => { pendingNpc = null; return game.toggleMeditate(); });
    else if (key === 'e') interact();
    else if (key === 'z') useSupply('health-tonic');
    else if (key === 'x') useSupply('mana-tonic');
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
    const npc = NPCS.find(value => hitDistance(value) < 1.2);
    pendingNpc = null;
    if (mob) game.setTarget(mob.id);
    else if (npc) requestNpc(npc.id);
    else if (Math.abs(point.x - WORLD.bindstone.x) < 32 && point.y > WORLD.bindstone.y - 56 && point.y < WORLD.bindstone.y + 44 && Math.hypot(game.player.x - WORLD.spawn.x, game.player.y - WORLD.spawn.y) <= 110) {
      const result = game.restoreAtBindstone(); toast(result.message);
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
      if (pendingNpc && !game.dead && !game.inCombat) {
        const npc = NPCS.find(value => value.id === pendingNpc);
        if (nearNpc(npc)) requestNpc(npc.id);
      }
      saveElapsed += dt;
      if (saveElapsed >= 7 || lastDead !== game.dead) { saveElapsed = 0; lastDead = game.dead; save(); }
    }
    presentationFeedback(now);
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

