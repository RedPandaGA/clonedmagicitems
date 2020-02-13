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
        this.spells = Object.values(this.data.spells ? this.data.spells : {})
            .filter(spell => spell !== 'null')
            .map(spell => new MagicItemSpell(spell));

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

    constructor(spellData) {
        mergeObject(this, spellData);
    }

    get levels() {
        let levels = {};
        for(let i = this.baseLevel; i <= 10; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
        }
        return levels;
    }

    renderSheet() {
        this.entity().then(entity => {
            const sheet = entity.sheet;
            sheet.options.editable = false;
            sheet.options.compendium = this.pack;
            sheet.render(true);
        });
    }

    entity() {
        return new Promise((resolve, reject) => {
            const pack = game.packs.find(p => p.collection === this.pack);
            pack.getEntity(this.id).then(entity => {
                resolve(entity);
            });
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
            game.i18n.localize("MAGICITEMS.SheetNoRecharge");
    }

    setUses(uses) {
        this.uses = uses;
    }

    roll(spellId, consumption) {
        let uses = this.uses - consumption;
        let spell = this.spells.filter(spell => spell.id === spellId)[0];
        if(uses >= 0) {
            this.uses = uses;
            spell.data().then(data => {
                new Item5e(data, { actor: this.actor }).roll();
                if(this.uses === 0 && this.destroy) {
                    this.actor.deleteOwnedItem(this.id);
                }
            });
        } else {
            let dialog = new Dialog({
                title: this.name + ': ' + spell.name,
                content: game.i18n.localize("MAGICITEMS.SheetNoChargesMessage"),
                buttons: {}
            });
            dialog.render(true);
        }
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