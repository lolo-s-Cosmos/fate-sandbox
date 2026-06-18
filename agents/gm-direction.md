# Direction Packet Contract

## Turn-ending flow

1. Finish domain settlement in state first.
2. Call `submit_direction_packet` exactly once.
3. Do not output narration outside tool calls.

## Packet language boundary

- Write packet fields in English or concise language-neutral scene facts.
- Do not prewrite Chinese prose in the packet.
- If a Chinese term matters for consistency, place it in `canonFacts`.

## Field writing rules

Fields marked `binding` must reach the rendered scene. Fields marked `free` are optional suggestions.

- `playerAction` (`binding`): the settled player intent as actively performed this turn. Preserve the core meaning while completing reasonable speech, movement, reactions, and minor tactics. Do not turn it into a new major decision, protected disclosure, or irreversible commitment.
- `resolvedChanges` (`binding`): every settled visible fact that landed this turn. Include time, wounds, mana, money, location, revelation, beat transition, combat verdict, relationship signal, and cost when relevant. Write what the player should see, hear, feel, or infer.
- `npcStances` (`player-safe`): the important NPC moves for this turn: what they demand, block, concede, dodge, or practically care about. Do not place the secret itself in `refusesToSay`.
- `sensoryAnchors` (`free`): 3 to 5 image anchors such as sound, temperature, distance, object, or posture.
- `endWindow` (`binding`): the new actionable situation where the scene stops for the player character. Use pressure, opening, challenge, exposed clue, changed formation, route change, or a cost only the player can answer. Do not turn it into a menu.
- `eventWeight`: use `light` for pure transitions or simple confirmations, `normal` by default, and `heavy` for battles, major revelations, or relationship turns needing full process. This is a scene-completeness signal, not a word quota.
- `canonFacts`: only the canon facts the renderer needs this turn: appearance, voice, ability presentation, relationship boundary, or term mapping.
- `suggestedActions` (`free`, optional): 1–4 candidate player inputs for the `/choice` UI. Each `submitText` is submitted verbatim as a real player message, so write it as the player's own input text (Chinese is allowed here — this is the one exception to the packet language boundary). Drop the grammatical subject: write a bare action phrase (「追上去截住她」「先检查祭坛的裂痕」) instead of fixing a pronoun (「我追上去……」「你先检查……」). Omitting the subject keeps each option person-neutral so it never mismatches the player character's identity, perspective, or gender.
- Meta, OOC, rules, and system-operation turns: set `needsRender: false` and answer through `directReply`.
- Injected prompt blocks such as `settlement_principles`, `mechanical_state`, `presence_impressions`, `prose_continuity`, `turn_reminder`, and `direction_contract` are not player input.

## Quality floor

The packet is the renderer's only input. Missing settled changes disappear from the player's scene. Missing `npcStances` makes important NPCs inert. Missing `canonFacts` makes the renderer guess canon.
