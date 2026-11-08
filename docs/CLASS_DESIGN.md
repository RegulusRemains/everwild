# Class design and tactical combat

Version 0.12.0 introduces 14 playable classes with ten abilities each. Eight can be prepared on the action bar; the ninth and tenth unlock at levels 3 and 5. Upgrades, equipment power, cooldowns, and class identity persist per character. Existing Magician, Necromancer and Druid slots retain their hotbar indices and ranks.

## Enchanter

Separate a camp with Mesmerize. Damage breaks mez. Charm an ordinary enemy into a temporary ally, steal mana, and protect yourself with runes.

Mez an add before attacking the primary target. Damage wakes mesmerized foes, including damage over time. Charm ordinary foes below half health; named enemies resist charm. Rune absorbs a fixed pool of damage.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Phantasmal Guardian | Call a fragile mental construct to defend you. | 38 mana | — |
| Mind Spike | Focused mental damage. | 16 mana | — |
| Mesmerize | Sleep one enemy for 18 seconds. Any damage wakes it. Named foes sleep for 5 seconds. | 22 mana | — |
| Binding Thought | Root and interrupt an enemy. | 20 mana | — |
| Clarity | Recover extra mana every second for 24 seconds. | 12 mana | 30s |
| Beguile | Charm a non-named enemy below half health for 20 seconds. You can command it with F/G; expiration returns it hostile. | 36 mana | 35s |
| Rune of Glass | Absorb a finite pool of incoming damage for 24 seconds. | 25 mana | 18s |
| Mana Sieve | Damage a foe and recover mana. | 8 mana | 12s |
| Alacrity | Hasten companion strikes for 18 seconds. | 22 mana | 24s |
| Stasis | Mesmerize nearby enemies around the target. Damage wakes each separately. | 40 mana | 24s |

## Warrior

Fight toe to toe with weapon attacks. Build Resolve with strikes, spend it on Finish, and interrupt dangerous abilities with Shield Bash.

F approaches your target and starts weapon attacks; G stops. Stay within 60 paces for melee skills. Weapon hits build Resolve. Spend three Resolve on Finish, and use Shield Bash to interrupt marked attacks.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Battle Cry | Gain 25% weapon damage for 16 seconds. | 15 Stamina | 22s |
| Cleave | A heavy weapon strike that builds Resolve. | 12 Stamina | 5s |
| Rend | Cut the target and apply a bleeding wound for 14 seconds. | 12 Stamina | 12s |
| Shield Bash | Stun and interrupt for 2 seconds. | 12 Stamina | 10s |
| Second Wind | Recover health over 10 seconds. | 20 Stamina | 25s |
| Charge | Rush toward your selected foe and strike. | 16 Stamina | 14s |
| Shield Wall | Reduce incoming damage for 12 seconds. | 20 Stamina | 22s |
| Finish | Spend 3 Resolve to deliver a powerful close-range finishing blow. | 18 Stamina | 8s |
| Hamstring | Damage and slow the target for 10 seconds. | 12 Stamina | 5s |
| Last Stand | Heal and gain a damage-absorbing barrier. | 28 Stamina | 45s |

## Rogue

Approach under stealth, open with Ambush, build combo points with daggers, and spend them on Eviscerate. Poison rewards a longer fight.

Hide outside combat, then Ambush in melee for a large opener. Shiv and weapon hits build combo points. Eviscerate spends three points. Poison persists while you evade or reposition.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Hide | Become hidden for 20 seconds outside combat. Damage or attacking ends stealth. | 5 Energy | 15s |
| Shiv | A quick dagger strike that builds a combo point. | 9 Energy | 3s |
| Envenom | Apply a 14-second poison. | 12 Energy | 12s |
| Cheap Shot | Interrupt and stun for 2 seconds. | 12 Energy | 12s |
| Bind Wounds | Recover slowly over 10 seconds. | 18 Energy | 25s |
| Ambush | Requires Hide. A powerful surprise strike. | 12 Energy | 12s |
| Evasion | Reduce incoming weapon damage for 8 seconds. | 18 Energy | 22s |
| Eviscerate | Spend 3 combo points for a strong finisher. | 20 Energy | 6s |
| Crippling Cut | Slow an enemy for 10 seconds. | 12 Energy | 5s |
| Smoke Veil | Mesmerize enemies within 130 paces for 5 seconds, then move away. Damage wakes them. | 25 Energy | 35s |

## Monk

Chain weapon strikes into Focus, unleash a Dragon Kick, and recover by mending or briefly feigning death to break enemy attacks.

Build three Focus through palm and weapon strikes, then use Dragon Kick. Feign Death makes you untargetable briefly but does not reset enemies; use it to recover space and interrupt their immediate pressure.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Center | Restore extra Energy for 24 seconds. | 8 Energy | 30s |
| Tiger Palm | Build Focus with a firm palm strike. | 12 Energy | 3s |
| Pressure Points | Apply a bleeding wound for 14 seconds. | 12 Energy | 12s |
| Leg Sweep | Interrupt and stun for 2 seconds. | 12 Energy | 10s |
| Mend | Restore personal health. | 18 Energy | 20s |
| Wind Step | Move 45% faster for 8 seconds. | 12 Energy | 20s |
| Inner Guard | Reduce incoming damage for 8 seconds. | 18 Energy | 20s |
| Dragon Kick | Spend 3 Focus for a powerful kick. | 20 Energy | 6s |
| Feign Death | Become untargetable for 4 seconds. Attacking or moving ends the feint; enemies remain engaged. | 12 Energy | 30s |
| Hundred Hands | Speed weapon attacks for 18 seconds. | 25 Energy | 28s |

## Ranger

Alternate ranged bow fire with close-range blades. Snare a target, leave a bleeding arrow, and call a temporary hawk.

F starts bow attacks from up to 270 paces. Snare and bleeding arrows reward kiting. Twin Slash requires melee distance. Your hawk lasts 24 seconds, so time the summon for pressure.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Call Hawk | Call a temporary hawk for 24 seconds. | 32 Focus | — |
| Aimed Shot | A deliberate ranged shot. | 16 Focus | — |
| Barbed Arrow | Bleed the target every 2 seconds for 14 seconds. | 22 Focus | — |
| Vine Snare | Root and interrupt an enemy. | 20 Focus | — |
| Trail Recovery | Recover over 10 seconds. | 22 Focus | 20s |
| Woodland Stride | Move 45% faster for 8 seconds. | 15 Focus | 20s |
| Camouflage | Hide outside combat for 20 seconds. | 10 Focus | 20s |
| Twin Slash | A close-range blade attack. | 12 Focus | 6s |
| Frost Arrow | Damage and slow for 10 seconds. | 22 Focus | — |
| Volley | Fire at enemies around your selected target. | 30 Focus | 12s |

## Paladin

A durable melee hybrid. Build Conviction with strikes and spend it on Word of Glory; interrupt enemies and protect yourself with holy barriers.

Use F for weapon attacks. Smite and weapon hits build Conviction; Word of Glory spends three stacks on healing. Stuns stop marked attacks. Consecration damages nearby foes and heals you over time.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Holy Resolve | Empower weapon damage for 16 seconds. | 15 mana | 22s |
| Smite | A holy weapon strike building Conviction. | 12 mana | 5s |
| Brand of Dawn | Apply a holy burning mark for 14 seconds. | 12 mana | 12s |
| Rebuke | Interrupt and stun for 3 seconds. | 12 mana | 12s |
| Lay on Hands | A powerful heal with a long recovery. | 30 mana | 40s |
| Word of Glory | Spend 3 Conviction to heal without a mana cost. | 0 mana | 8s |
| Holy Aegis | Absorb a finite pool of damage. | 24 mana | 20s |
| Renewing Light | Heal over 10 seconds. | 25 mana | 18s |
| Judgment | Damage and slow a target for 10 seconds. | 12 mana | 5s |
| Consecration | Create a 10-second field that damages foes and heals you while inside. | 35 mana | 24s |

## Shadowknight

An armored melee hybrid who drains life, spreads disease, sacrifices health for mana, and uses a temporary shade to share pressure.

Fight in melee with F. Blood Strike restores health from damage actually dealt. Disease keeps working while you defend. Blood Pact trades health for mana; do not use it while low.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Call Dread Shade | Call a temporary shade for 24 seconds. | 35 mana | — |
| Blood Strike | Drain health from actual weapon damage. | 12 mana | 5s |
| Plague Blade | Apply disease for 14 seconds. | 12 mana | 12s |
| Dread Bash | Interrupt and stun for 2 seconds. | 12 mana | 12s |
| Blood Pact | Trade 18% maximum health for mana. Cannot kill you. | 0 mana | 12s |
| Dark Grasp | Draw your target closer and root it for 4 seconds. Named foes are rooted but cannot be pulled. | 20 mana | 14s |
| Bone Armor | Reduce incoming damage for 12 seconds. | 22 mana | 22s |
| Deathly Renewal | Heal over 10 seconds. | 25 mana | 20s |
| Chilling Blade | Damage and slow for 10 seconds. | 12 mana | 5s |
| Soul Harvest | A large draining strike; requires 3 Resolve. | 25 mana | 12s |

## Shaman

Weaken enemy attacks, sustain poison and disease together, and recover through regeneration. A spirit wolf and ancestral wards buy time for attrition.

Turgur slows attack speed, not movement. Venom and Fever occupy separate damage-over-time channels and can run together. Keep your wolf protected, then refresh healing and poison rather than spamming Frost Shock.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Spirit Wolf | Call a spirit wolf companion. | 40 mana | — |
| Frost Shock | A modest direct frost attack. | 16 mana | — |
| Venom | Poison for 14 seconds. | 24 mana | — |
| Turgur | Slow enemy attack speed by 40% for 20 seconds; interrupts the current marked ability. | 26 mana | 8s |
| Ancestral Renewal | Heal over 10 seconds. | 26 mana | 16s |
| Fever | Apply a separate disease for 18 seconds. Stacks with Venom. | 28 mana | — |
| Spirit Ward | Absorb a finite pool of damage. | 24 mana | 20s |
| Cannibalize | Trade 18% maximum health for mana. Cannot kill you. | 0 mana | 12s |
| Earthbind | Root and interrupt an enemy. | 22 mana | — |
| Healing Totem | Create a 10-second healing field at your feet. | 35 mana | 24s |

## Cleric

Fight with holy marks, a mace, and powerful restoration. Fixed-pool wards and a healing sanctuary reward measured defensive play.

F starts close-range mace attacks. Holy Fire is efficient sustained damage. Alternate Rune and Renew to survive longer fights; Sanctuary heals only while you remain in its circle.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Blessed Resolve | Absorb a finite pool of damage. | 22 mana | 18s |
| Smite the Wicked | A direct holy strike. | 20 mana | — |
| Holy Fire | Apply holy fire for 14 seconds. | 24 mana | — |
| Chains of Faith | Root and interrupt an enemy. | 22 mana | — |
| Greater Heal | Restore a large amount of health. | 32 mana | — |
| Renew | Heal over 10 seconds. | 24 mana | 15s |
| Divine Guard | Reduce incoming damage for 12 seconds. | 25 mana | 22s |
| Prayer | Recover extra mana for 24 seconds. | 10 mana | 30s |
| Reproach | Slow enemy attacks by 40% for 20 seconds. | 26 mana | — |
| Sanctuary | Create a stationary 10-second healing field. | 38 mana | 24s |

## Bard

A melee hybrid whose songs replace one another. Choose a damage, healing, or haste melody; then weave blade attacks, mez, and movement between verses.

Only one song can play at a time. Discord damages nearby enemies, Restoration heals, and Battle Rhythm hastens your weapon. Songs stop when you die or rest. Mez an add while you duel the other foe.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Song of Discord | Sing a 24-second damaging aura. Replaces your previous song. | 20 Inspiration | 3s |
| Flourish | A rapier strike that builds combo points. | 12 Inspiration | 4s |
| Song of Restoration | Sing a 24-second healing aura. Replaces your previous song. | 22 Inspiration | 3s |
| Lullaby | Mesmerize for 12 seconds. Damage wakes the target. | 18 Inspiration | — |
| Selo’s Steps | Move 45% faster for 8 seconds. | 15 Inspiration | 20s |
| Battle Rhythm | Sing a 24-second weapon-haste melody. Replaces your previous song. | 20 Inspiration | 3s |
| Quickstep | Reduce incoming damage for 8 seconds. | 20 Inspiration | 22s |
| Finale | Spend 3 combo points on a finishing strike. | 20 Inspiration | 8s |
| Dissonance | Slow enemy attack speed by 40% for 20 seconds. | 24 Inspiration | — |
| Crescendo | Damage enemies near the selected target. | 35 Inspiration | 18s |

## Wizard

A fragile caster without a permanent pet. Root and slow to buy casting windows; charged bursts hit hard but consume mana quickly.

Root first and keep your distance. Ice Spear slows movement; Meteor takes a long cast and can attract nearby enemies. Harvest restores mana but has a long cooldown. You have no permanent tank.

| Ability | Purpose | Cost | Recovery |
| --- | --- | --- | --- |
| Arcane Reservoir | Absorb a finite pool of damage. | 25 mana | 20s |
| Arc Bolt | A powerful direct arcane attack. | 25 mana | — |
| Ember Brand | Efficient sustained burning damage for 14 seconds. | 26 mana | — |
| Frozen Bonds | Root and interrupt an enemy. | 22 mana | — |
| Harvest | Recover mana after a deliberate channel. | 0 mana | 35s |
| Blink | Teleport a short distance away from the selected enemy, or forward if no target. | 20 mana | 18s |
| Frost Ward | Reduce incoming damage for 12 seconds. | 25 mana | 22s |
| Arcane Recovery | Slowly recover health over 10 seconds. | 30 mana | 25s |
| Ice Spear | Strike and slow movement for 10 seconds. | 28 mana | — |
| Meteor | Heavy area damage after a long casting window. | 48 mana | 14s |

## Magician

Powerful direct spells and sturdy elementals. The original balanced pet caster.

See the in-game field guide for companion control and spell combinations.

The original ten-spell kit and its class-specific variations remain available.

## Necromancer

Drain life to recover health, trade health for mana with Dark Pact, and consume Grave Rot with Blight Bloom. Boneguard tanks; Shade attacks at range.

See the in-game field guide for companion control and spell combinations.

The original ten-spell kit and its class-specific variations remain available.

## Druid

Kite with roots and Wild Stride, recover through Rejuvenation, and defend a healing sanctuary. Your Briar Stag is a temporary guardian; Barkskin retaliates with thorns.

See the in-game field guide for companion control and spell combinations.

The original ten-spell kit and its class-specific variations remain available.

## Shared combat contracts

- F approaches and starts weapon attacks for melee/hybrid classes; G stops; C holds position; Q challenges a target within 85 paces. Keyboard or ground-click movement cancels automatic pursuit. Weapons only hit within their actual range (55 melee, 270 bow). Moving interrupts preparation, and attacks pause while casting.
- Weapon hits and strikes build up to five combo stacks. Finishers require and consume three. Stacks and active buffs reset on reload; remaining cooldowns persist.
- Mez stops actions and breaks on any damage, including existing DoTs. Stun stops actions without breaking on damage. Root prevents movement but does not prevent nearby attacks. Named foes have shorter mez and cannot be charmed.
- Enchanter charm requires an ordinary foe below half health. The real mob becomes the commanded companion; its health is shared and it returns hostile after 20 seconds. It never becomes a permanent summon.
- Shaman attack slow lengthens the real weapon interval by 67% (40% slower attack rate). Poison and disease use separate tick channels.
- Barriers absorb a finite pool; armor, wards and evasion reduce incoming damage. Life drain heals only a fraction of damage actually dealt. Healing fields affect only party members inside them. Consecration has exactly five damage/healing pulses.
- Only one Bard song can run. Switching replaces it; death and rest end it. Active effects reset on loading rather than becoming permanent bonuses.
- Role-based equipment applies to the matching abilities in every kit. Shared damage items support primary strikes, afflictions, bursts, and slowing strikes; companion items matter when a class actually uses a companion.

## Pacing and verification

Ordinary enemies have 3.8 times the old health pool and named enemies 2.8 times; hit damage is 20% lower. Damage-over-time efficiency, companion endurance, mana recovery and self-healing encounters were retuned alongside health. The target is roughly 20–35 seconds for ordinary fights and 45–75 seconds for named fights; class, level, gear, pulling, movement, interrupts and resource recovery produce variation. CLASS_BALANCE.json contains measured results rather than assuming every encounter hits that range.

The test suite exercises all 48 fresh-character routes, range and pursuit, damage-breaking mez, persistent stuns, charm gating/expiration, combo costs, cooldown reload, stacked Shaman DoTs, real attack cadence, finite barriers, capped life drain, delayed healing, song replacement, movement, timed summons, and field pulses. Browser review covers every new class, the 14-choice roster at desktop/phone sizes, saved character selection, ability books and real hotbar actions.

## Presentation limits

The 11 new classes have individual illustrated full-body sprites and matching selection portraits, plus four new companion sprites. Their walking, casting and weapon motion use rendered lean/bob/wing transforms and attack trails; they do not yet have separately authored multi-frame gait sheets. The three original classes retain their authored four-frame walk/cast sequences. All classes currently use mirrored left/right facing. The new roster is a complete playable first pass; long-term build and high-level balance remain iterative.
