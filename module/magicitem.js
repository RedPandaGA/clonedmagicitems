import {MAGICITEMS} from "./config.js";
import { Item5e } from "../../systems/dnd5e/module/item/entity.js";
import {MagicItemUpcastDialog} from "./magicitemupcastdialog.js";

export class MagicItem {

    constructor(flags) {
        this.data = this.defaultData();
        if (typeof flags !== 'undefined') {
            this.data = flags;
        }

        this.enabled = this.data.enabled;
        this.charges = this.data.charges;
        this.rechargeable = this.data.rechargeable;
        this.recharge = this.data.recharge;
        this.rechargeType = this.data.rechargeType;
        this.rechargeUnit = this.data.rechargeUnit;
        this.destroy = this.data.destroy;
        this.destroyCheck = this.data.destroyCheck;

        this.spells = Object.values(this.data.spells ? this.data.spells : {})
            .filter(spell => spell !== 'null')
            .map(spell => new MagicItemSpell(spell));

        this.feats = Object.values(this.data.feats ? this.data.feats : {})
            .filter(feat => feat !== 'null')
            .map(spell => new MagicItemFeat(spell));

        this.spellsGarbage = [];
        this.featsGarbage = [];

        this.savedSpells = this.spells.length;
        this.savedFeats = this.feats.length;
    }

    defaultData() {
        return {
            enabled: false,
            charges: 0,
            rechargeable: false,
            recharge: 0,
            rechargeType: 't1',
            rechargeUnit: '',
            destroy: false,
            destroyCheck: 'd1',
            spells: {},
            feats: {}
        }
    }

    get destroyChecks() {
        return MAGICITEMS.localized(MAGICITEMS.destroyChecks);
    }

    get rechargeUnits() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeUnits);
    }

    get rechargeTypes() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeTypes);
    }

    get empty() {
        return this.spells.length === 0 && this.feats.length === 0;
    }

    toggleEnabled(enabled) {
        this.enabled = enabled;
        if(!enabled) {
            this.clear();
        }
    }

    toggleRechargeable(rechargeable) {
        this.rechargeable = rechargeable;
        if(!rechargeable) {
            this.recharge = 0;
            this.rechargeType = 't1';
            this.rechargeUnit = '';
        }
    }

    clear() {
        mergeObject(this, this.defaultData());
        this.spells = [];
        this.feats = [];
        this.cleanup();
    }

    addSpell(data) {
        this.spells.push(new MagicItemSpell(data));
        this.cleanup();
    }

    removeSpell(idx) {
        this.spells.splice(idx, 1);
        this.cleanup();
    }

    get hasSpells() {
        return this.spells.length > 0;
    }

    hasSpell(spellId) {
        return this.spells.filter(spell => spell.id === spellId).length === 1;
    }

    addFeat(data) {
        this.feats.push(new MagicItemFeat(data));
        this.cleanup();
    }

    removeFeat(idx) {
        this.feats.splice(idx, 1);
        this.cleanup();
    }

    get hasFeats() {
        return this.feats.length > 0;
    }

    hasFeat(featId) {
        return this.feats.filter(feat => feat.id === featId).length === 1;
    }

    findById(itemId) {
        let items = this.spells.concat(this.feats);
        return items.filter(item => item.id === itemId)[0];
    }

    renderSheet(spellId) {
        this.findById(spellId).renderSheet();
    }

    cleanup() {
        this.spellsGarbage = [];
        this.featsGarbage = [];
        if(this.savedSpells > this.spells.length) {
            for(let i = this.spells.length; i < this.savedSpells; i++) {
                this.spellsGarbage.push(i);
            }
        }
        if(this.savedFeats > this.feats.length) {
            for(let i = this.feats.length; i < this.savedFeats; i++) {
                this.featsGarbage.push(i);
            }
        }
    }

}

class MagicItemEntry {

    constructor(data) {
        mergeObject(this, data);
    }

    renderSheet() {
        this.entity().then(entity => {
            const sheet = entity.sheet;
            sheet.options.editable = false;
            if(this.pack === 'world') {
                sheet.options.compendium = this.pack;
            }
            sheet.render(true);
        });
    }

    entity() {
        return new Promise((resolve, reject) => {
            if(this.pack === 'world') {
                const cls = CONFIG['Item'].entityClass;
                let entity = cls.collection.get(this.id);
                resolve(entity);
            } else {
                const pack = game.packs.find(p => p.collection === this.pack);
                pack.getEntity(this.id).then(entity => {
                    resolve(entity);
                });
            }
        });
    }

    data() {
        return new Promise((resolve, reject) => {
            this.entity().then(entity => {
                let data = mergeObject(entity.data, { data: { level: parseInt(this.level) }});
                resolve(data);
            })
        });
    }
}

class MagicItemFeat extends MagicItemEntry {
}

class MagicItemSpell extends MagicItemEntry {

    constructor(data) {
        super(data);
        this.baseLevel = parseInt(this.baseLevel);
        this.level = parseInt(this.level);
        this.consumption = parseInt(this.consumption);
        this.upcast = this.upcast ? parseInt(this.upcast) : this.level;
        this.upcastCost = this.upcastCost ? parseInt(this.upcastCost) : 1;
    }

    get levels() {
        let levels = {};
        for(let i = this.baseLevel; i <= 10; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
            if(i === 0) {
                break;
            }
        }
        return levels;
    }

    get upcasts() {
        let upcasts = {};
        for(let i = this.level; i <= 10; i++) {
            upcasts[i] = game.i18n.localize(`MAGICITEMS.SheetSpellUpcast${i}`);
            if(i === 0) {
                break;
            }
        }
        return upcasts;
    }

    get allowedLevels() {
        let levels = {};
        for(let i = this.level; i <= this.upcast; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
            if(i === 0) {
                break;
            }
        }
        return levels;
    }

    canUpcast() {
        return this.level < this.upcast;
    }

    canUpcastLabel() {
        return this.canUpcast() ?
            game.i18n.localize(`MAGICITEMS.SheetCanUpcastYes`) :
            game.i18n.localize(`MAGICITEMS.SheetCanUpcastNo`)
    }

    consumptionAt(level) {
        return this.consumption + this.upcastCost * (level - this.level);
    }

}

export class OwnedMagicItem extends MagicItem {

    constructor(item, actor, magicItemActor) {
        super(item.flags.magicitems);
        this.actorFlags = actor.data.flags.magicitems;
        this.id = item._id;
        this.item = item;
        this.actor = actor;
        this.name = item.name;
        this.img = item.img;
        this.uses = this.actorFlags && this.actorFlags[this.id] ? parseInt(this.actorFlags[this.id].uses) : this.charges;
        this.rechargeableLabel = this.rechargeable ?
            `(${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${this.recharge} ${MAGICITEMS.localized(MAGICITEMS.rechargeUnits)[this.rechargeUnit]} )` :
            game.i18n.localize("MAGICITEMS.SheetNoRecharge");
        this.magicItemActor = magicItemActor;

        this.allItems = this.spells.concat(this.feats);
        this.ownedEntries = [];
        this.sequentiallyBuildEntry(0);
    }

    /**
     * Very bad. We need to fetch items data sequentially to avoid server read errors.
     *
     * @param idx
     */
    sequentiallyBuildEntry(idx) {
        let item = this.allItems[idx];
        OwnedMagicItemEntry.build(this, item).then(entry => {
            console.log(`[magic item] item ${item.name} fetched`);
            this.ownedEntries.push(entry);
            setTimeout(() => {
                if(this.allItems.length > idx + 1) {
                    this.sequentiallyBuildEntry(idx + 1);
                }
            }, 300);
        }, error => {
            console.log(`[magic item] item ${item.name} fetch error, retry...`);
            setTimeout(() => {
                this.sequentiallyBuildEntry(idx);
            }, 500);
        });
    }

    setUses(uses) {
        this.uses = uses;
    }

    async roll(itemId) {
        let ownedItem = this.ownedEntries.filter(entry => entry.id === itemId)[0];
        await ownedItem.roll();
    }

    rollByName(itemName) {
        let found = this.ownedEntries.filter(entry => entry.name === itemName);
        if(!found.length) {
            return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + itemName);
        }
        found[0].roll();
    }

    onRoll(consumption, item) {
        this.uses = this.uses - consumption;
        if(this.destroyed()) {
            this.magicItemActor.destroyItem(this);
        }
    }

    destroyed() {
        let destroyed = this.uses === 0 && this.destroy;
        if(destroyed && this.destroyCheck === 'd2') {
            let r = new Roll('1d20');
            r.roll();
            destroyed = r.total === 1;
            r.toMessage({
                flavor: `<b>${this.name}</b>> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")} 
                        - ${destroyed ? "failure!" : "success!"}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token})
            });
        }
        if(destroyed) {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroy")}`
            });
        }
        return destroyed;
    }

    onShortRest() {
        if(this.rechargeUnit === MAGICITEMS.SHORT_REST) {
            return this.doRecharge();
        }
    }

    onLongRest() {
        if(this.rechargeUnit === MAGICITEMS.LONG_REST || this.rechargeUnit === MAGICITEMS.SHORT_REST) {
            return this.doRecharge();
        }
    }

    doRecharge() {
        if(this.rechargeType === MAGICITEMS.NUMERIC_RECHARGE) {
            let tot = this.uses + parseInt(this.recharge);
            this.uses = Math.min(tot, parseInt(this.charges));
            return {"flavor": `${this.recharge}`, uses: this.uses };
        }
        if(this.rechargeType === MAGICITEMS.FORMULA_RECHARGE) {
            let r = new Roll(this.recharge);
            r.roll();
            let tot = this.uses + r.total;
            this.uses = Math.min(tot, parseInt(this.charges));
            return {"flavor": `${r.result} = ${r.total}`, uses: this.uses };
        }
    }

    ownedItemBy(itemId) {
        return this.ownedEntries.filter(entry => entry.id === itemId)[0].ownedItem;
    }

    betterRolls() {
        return typeof BetterRolls !== 'undefined' && game.settings.get("betterrolls5e", "diceEnabled");
    }

}

class OwnedMagicItemEntry {

    static build(magicItem, item) {
        return new Promise((resolve, reject) => {
            let entry = new OwnedMagicItemEntry(magicItem, item);
            item.data().then(data => {
                entry.ownedItem = new Item5e(data, { actor: magicItem.actor });
                resolve(entry);
            })
        });
    }

    constructor(magicItem, item) {
        this.magicItem = magicItem;
        this.item = item;
    }

    get id() {
        return this.item.id;
    }

    get name() {
        return this.item.name;
    }

    get img() {
        return this.item.img;
    }

    async roll() {
        let consumption = this.item.consumption;
        if(this.ownedItem.type === 'spell' && this.item.canUpcast()) {
            const spellFormData = await MagicItemUpcastDialog.create(this.magicItem, this.item);
            let lvl = parseInt(spellFormData.get("level"));
            if(lvl !== this.item.level) {
                consumption = parseInt(spellFormData.get("consumption"));
                this.ownedItem = new Item5e(
                    mergeObject(this.ownedItem.data, {"data.level": lvl}, {inplace: false}),
                    { actor: this.magicItem.actor }
                );
            }
        }
        let uses = this.magicItem.uses - consumption;
        if(uses >= 0) {
            this.ownedItem.roll();
            this.magicItem.onRoll(consumption, this.ownedItem);
        } else {
            let dialog = new Dialog({
                title: this.magicItem.name + ': ' + this.item.name,
                content: game.i18n.localize("MAGICITEMS.SheetNoChargesMessage"),
                buttons: {}
            });
            dialog.render(true);
        }
    }
}