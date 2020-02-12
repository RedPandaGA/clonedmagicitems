import {MAGICITEMS} from "./config.js";
import { Item5e } from "../../systems/dnd5e/module/item/entity.js";

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
    }

    async init() {
        this.spells = await this.buildSpells();
        this.garbage = [];
        this.savedSpells = this.spells.length;
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
            spells: {}
        }
    }

    buildSpells() {
        return new Promise((resolve, reject) => {
            Promise.all(
                Object.values(this.data.spells ? this.data.spells : {})
                    .filter(spell => spell !== 'null') // garbage...
                    .map(spellData => MAGICITEMS.fromCollection(spellData.pack, spellData.id))
            ).then(spells => {
                resolve(
                    spells.map(
                        (spell, i) => new MagicItemSpell(
                            spell,
                            this.data.spells[i].level,
                            this.data.spells[i].consumption
                        )
                    )
                );
            })
        });
    }

    get rechargeUnits() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeUnits);
    }

    get rechargeTypes() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeTypes);
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
        this.cleanup();
    }

    addSpell(spell) {
        this.spells.push(new MagicItemSpell(spell));
        this.cleanup();
    }

    removeSpell(idx) {
        this.spells.splice(idx, 1);
        this.cleanup();
    }

    hasSpell(spellId) {
        return this.spells.filter(spell => spell.id === spellId).length === 1;
    }

    renderSheet(spellId) {
        this.spells.filter(spell => spell.id === spellId)[0].renderSheet();
    }

    cleanup() {
        this.garbage = [];
        if(this.savedSpells > this.spells.length) {
            for(let i = this.spells.length; i < this.savedSpells; i++) {
                this.garbage.push(i);
            }
        }
    }

}

class MagicItemSpell {

    constructor(spell, level, consumption) {
        this.spell = spell;
        this.level = level ? level : this.spell.data.data.level;
        this.consumption = consumption ? consumption : this.level;
    }

    get id() {
        return this.spell.id;
    }

    get name() {
        return this.spell.name;
    }

    get img() {
        return this.spell.img;
    }

    get pack() {
        return this.spell.compendium.collection;
    }

    get levels() {
        let levels = {};
        for(let i = this.spell.data.data.level; i <= 10; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
        }
        return levels;
    }

    get data() {
        return mergeObject(this.spell.data, { data: { level: parseInt(this.level) }});
    }

    renderSheet() {
        const sheet = this.spell.sheet;
        sheet.options.editable = false;
        sheet.options.compendium = this.pack;
        sheet.render(true);
    }
}

export class OwnedMagicItem extends MagicItem {

    constructor(item, actor) {
        super(item.flags.magicitems);
        this.actorFlags = actor.data.flags.magicitems;
        this.id = item._id;
        this.item = item;
        this.actor = actor;
        this.name = item.name;
        this.uses = this.actorFlags && this.actorFlags[this.id] ? parseInt(this.actorFlags[this.id].uses) : this.charges;
        this.rechargeableLabel = this.rechargeable ?
            `(${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${this.recharge} ${MAGICITEMS.localized(MAGICITEMS.rechargeUnits)[this.rechargeUnit]} )` :
            game.i18n.localize("MAGICITEMS.NoRecharge");
    }

    setUses(uses) {
        this.uses = uses;
    }

    roll(spellId, consumption) {
        let uses = this.uses - consumption;
        if(uses >= 0) {
            this.ownedItem(spellId).roll();
            this.uses = uses;
            if(this.uses === 0 && this.destroy) {
                this.actor.deleteOwnedItem(this.id);
            }
        } else {
            let spell = this.spells.filter(spell => spell.id === spellId)[0];
            let dialog = new Dialog({
                title: this.name + ': ' + spell.name,
                content: game.i18n.localize("MAGICITEMS.SheetNoChargesMessage"),
                buttons: {}
            });
            dialog.render(true);
        }
    }

    ownedItem(spellId) {
        let spell = this.spells.filter(spell => spell.id === spellId)[0];
        return new Item5e(spell.data, { actor: this.actor })
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

}