import {MAGICITEMS} from "./config.js";
import {MagicItemUpcastDialog} from "./magicitemupcastdialog.js";

export class MagicItem {

    constructor(flags) {
        this.data = mergeObject(this.defaultData(), flags || {}, { inplace: false });

        this.enabled = this.data.enabled;
        this.charges = parseInt(this.data.charges);
        this.chargeType = this.data.chargeType;
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

        this.tables = Object.values(this.data.tables ? this.data.tables : {})
            .filter(table => table !== 'null')
            .map(table => new MagicItemTable(table));

        this.spellsGarbage = [];
        this.featsGarbage = [];
        this.tablesGarbage = [];

        this.savedSpells = this.spells.length;
        this.savedFeats = this.feats.length;
        this.savedTables = this.tables.length;
    }

    defaultData() {
        return {
            enabled: false,
            charges: 0,
            chargeType: 'c1',
            rechargeable: false,
            recharge: 0,
            rechargeType: 't1',
            rechargeUnit: '',
            destroy: false,
            destroyCheck: 'd1',
            spells: {},
            feats: {},
            tables: {}
        }
    }

    get chargeTypes() {
        return MAGICITEMS.localized(MAGICITEMS.chargeTypes);
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

    get chargesOnWholeItem() {
        return this.chargeType === MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
    }

    get chargesPerSpell() {
        return this.chargeType === MAGICITEMS.CHARGE_TYPE_PER_SPELL;
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
        this.tables = [];
        this.cleanup();
    }

    support(type) {
        return ['Item', 'RollTable'].includes(type);
    }

    get items() {
        return this.spells.concat(this.feats).concat(this.tables);
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
        return this.spells.length > 0 || this.hasTableAsSpells;
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
        return this.feats.length > 0 || this.hasTableAsFeats;
    }

    hasFeat(featId) {
        return this.feats.filter(feat => feat.id === featId).length === 1;
    }

    addTable(data) {
        this.tables.push(new MagicItemTable(data));
        this.cleanup();
    }

    removeTable(idx) {
        this.tables.splice(idx, 1);
        this.cleanup();
    }

    get hasTableAsSpells() {
        return this.tableAsSpells.length === 1;
    }

    get hasTableAsFeats() {
        return this.tableAsFeats.length === 1;
    }

    hasTable(tableId) {
        return this.tables.filter(table => table.id === tableId).length === 1;
    }

    tablesByUsage(usage) {
        return this.tables.filter(table => table.usage === usage);
    }

    get tableAsSpells() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_SPELL);
    }

    get tableAsFeats() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_FEAT);
    }

    get triggeredTables() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_TRIGGER);
    }

    compatible(entity) {
        return (['spell', 'feat'].includes(entity.type) || entity.entity === 'RollTable')
            && !this.hasItem(entity.id);
    }

    addEntity(entity, pack) {
        if(entity.type === "spell") {
            this.addSpell({
                id: entity.id,
                name: entity.name,
                img: entity.img,
                pack: pack,
                baseLevel: entity.data.data.level,
                level: entity.data.data.level,
                consumption: entity.data.data.level,
                upcast: entity.data.data.level,
                upcastCost: 1
            });
            return true;
        }
        if(entity.type === "feat") {
            this.addFeat({
                id: entity.id,
                name: entity.name,
                img: entity.img,
                pack: pack,
                consumption: 1
            });
            return true;
        }
        if(entity.entity === "RollTable") {
            this.addTable({
                id: entity.id,
                name: entity.name,
                img: 'icons/svg/d20-grey.svg',
                pack: pack,
                consumption: 1
            });
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.hasSpell(itemId) || this.hasFeat(itemId) || this.hasTable(itemId);
    }

    findById(itemId) {
        return this.items.filter(item => item.id === itemId)[0];
    }

    renderSheet(spellId) {
        this.findById(spellId).renderSheet();
    }

    cleanup() {
        this.spellsGarbage = [];
        this.featsGarbage = [];
        this.tablesGarbage = [];
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
        if(this.savedTables > this.tables.length) {
            for(let i = this.tables.length; i < this.savedTables; i++) {
                this.tablesGarbage.push(i);
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
            if(this.pack === 'world') {
                sheet.options.compendium = this.pack;
            } else {
                sheet.options.editable = false;
            }
            sheet.render(true);
        });
    }

    entity() {
        return new Promise((resolve, reject) => {
            if(this.pack === 'world') {
                let entity = this.entityCls().collection.get(this.id);
                resolve(entity);
            } else {
                const pack = game.packs.find(p => p.collection === this.pack);
                pack.getEntity(this.id).then(entity => {
                    resolve(entity);
                });
            }
        });
    }

    entityCls() {
        return CONFIG['Item'].entityClass;
    }

    data() {
        return new Promise((resolve, reject) => {
            this.entity().then(entity => {
                resolve(entity.data);
            })
        });
    }
}

class MagicItemFeat extends MagicItemEntry {
}

class MagicItemTable extends MagicItemEntry {

    entityCls() {
        return CONFIG['RollTable'].entityClass;
    }

    get usages() {
        return MAGICITEMS.localized(MAGICITEMS.tableUsages);
    }

    async roll() {
        let entity = await this.entity();
        entity.draw();
    }
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
        for(let i = this.baseLevel; i <= 9; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
            if(i === 0) {
                break;
            }
        }
        return levels;
    }

    get upcasts() {
        let upcasts = {};
        for(let i = this.level; i <= 9; i++) {
            upcasts[i] = game.i18n.localize(`MAGICITEMS.SheetSpellUpcast${i}`);
            if(i === 0) {
                break;
            }
        }
        return upcasts;
    }

    get allowedLevels() {
        let levels = {};
        for(let i = this.level; i <= Math.min(this.upcast, 9); i++) {
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
        super(item.data.flags.magicitems);
        this.id = item.id;
        this.item = item;
        this.actor = actor;
        this.name = item.name;
        this.img = item.img;
        this.itemFlags = (actor.data.flags.magicitems || {})[item.id] || {};
        this.uses = parseInt(this.itemFlags.uses || this.charges);
        this.rechargeableLabel = this.rechargeable ?
            `(${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${this.recharge} ${MAGICITEMS.localized(MAGICITEMS.rechargeUnits)[this.rechargeUnit]} )` :
            game.i18n.localize("MAGICITEMS.SheetNoRecharge");
        this.magicItemActor = magicItemActor;

        this.ownedEntries = this.spells.concat(this.feats).map(item => new OwnedMagicItemEntry(this, item));
        this.ownedEntries = this.ownedEntries.concat(this.tables.map(table => new OwnedMagicItemTable(this, table)));

        this.instrument();
    }

    instrument() {
        this.item.roll = this.itemRoll(this.item.roll, this);
    }

    itemRoll(original, me) {
        return async function () {
            me.triggerTables();
            return await original.apply(me.item, arguments);
        }
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

    consume(consumption) {
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
        if([MAGICITEMS.LONG_REST, MAGICITEMS.SHORT_REST, MAGICITEMS.DAILY].includes(this.rechargeUnit)) {
            return this.doRecharge();
        }
    }

    doRecharge() {
        let amount = 0,
            msg = `<b>Magic Item: ${this.name}</b><br>${game.i18n.localize("MAGICITEMS.SheetRecharge")}: `;
        if(this.rechargeType === MAGICITEMS.NUMERIC_RECHARGE) {
            amount = parseInt(this.recharge);
            msg += `${this.recharge}`;
        }
        if(this.rechargeType === MAGICITEMS.FORMULA_RECHARGE) {
            let r = new Roll(this.recharge);
            r.roll();
            amount = r.total;
            msg += `${r.result} = ${r.total}`;
        }

        if(this.chargesOnWholeItem) {
            let updated = Math.min(this.uses + amount, parseInt(this.charges));
            this.setUses(updated);
        } else {
            this.ownedEntries.forEach(entry => {
                entry.uses = Math.min(entry.uses + amount, parseInt(this.charges));
            });
        }

        this.actor.sheet.render(true);

        ChatMessage.create({
            speaker: { actor: this.actor },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: msg
        });
    }

    entryBy(itemId) {
        return this.ownedEntries.filter(entry => entry.id === itemId)[0];
    }

    ownedItemBy(itemId) {
        return this.entryBy(itemId).ownedItem;
    }

    triggerTables() {
        this.triggeredTables.forEach(table => table.roll());
    }

}

class AbstractOwnedEntry {

    constructor(magicItem, item) {
        this.magicItem = magicItem;
        this.item = item;
        this.ownedItem = null;
        this.entryFlags = this.magicItem.itemFlags[this.item.id] || {};
        this.uses = parseInt(this.entryFlags.uses || this.magicItem.charges);
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

    get uses() {
        return this.item.uses;
    }

    set uses(uses) {
        this.item.uses = uses;
    }

    hasCharges(consumption) {
        let uses = this.magicItem.chargesOnWholeItem ? this.magicItem.uses : this.uses;
        return uses - consumption >= 0;
    }

    consume(consumption) {
        if(this.magicItem.chargesOnWholeItem) {
            this.magicItem.consume(consumption);
        } else {
            this.uses = this.uses - consumption;
        }
    }

    showNoChargesMessage(callback) {
        const message = game.i18n.localize("MAGICITEMS.SheetNoChargesMessage");
        const title = game.i18n.localize("MAGICITEMS.SheetDialogTitle");
        let d = new Dialog({
            title: title,
            content: `<b>'${this.magicItem.name}'</b> - ${message} <b>'${this.item.name}'</b><br><br>`,
            buttons: {
                use: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("MAGICITEMS.SheetDialogUseAnyway"),
                    callback: () => callback()
                },
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("MAGICITEMS.SheetDialogClose"),
                    callback: () => d.close()
                }
            },
            default: "close"
        });
        d.render(true);
    }
}

class OwnedMagicItemEntry extends AbstractOwnedEntry {

    constructor(magicItem, item) {
		super(magicItem, item);
	}
	
	async init() {
        let data = await this.item.data();
        if(data.type === 'spell' && typeof data.data.save.scaling === 'undefined') {
            data = mergeObject(data, { "data.save.scaling" : "spell" } );
        }
        this.ownedItem = Item.createOwned(data, this.magicItem.actor);
    }
	
    async roll() {

        if(!this.ownedItem) {
            await this.init();
        }

        let item = this.ownedItem;
        let level = this.item.level;
        let consumption = this.item.consumption;
        if(this.ownedItem.type === 'spell' && this.item.canUpcast()) {
            const spellFormData = await MagicItemUpcastDialog.create(this.magicItem, this.item);
            level = parseInt(spellFormData.get("level"));
            consumption = parseInt(spellFormData.get("consumption"));
        }

        if(level !== this.ownedItem.data.data.level) {
            item = Item.createOwned(
                mergeObject(this.ownedItem.data, {"data.level": level}, {inplace: false}),
                this.magicItem.actor
            );
        }

        if(this.hasCharges(consumption)) {
            item.roll();
            this.consume(consumption);
        } else {
            this.showNoChargesMessage(() => {
                item.roll();
            });
        }
    }
}

class OwnedMagicItemTable extends AbstractOwnedEntry {

    async roll() {
        let item = this.item;
        let consumption = item.consumption;
        if(this.hasCharges(consumption)) {
            await item.roll();
            this.consume(consumption);
        } else {
            this.showNoChargesMessage(() => {
                item.roll();
            });
        }
    }
}