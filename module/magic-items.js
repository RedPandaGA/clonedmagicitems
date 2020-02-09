
import { Item5e } from "../../systems/dnd5e/module/item/entity.js";

Hooks.on(`renderItemSheet5e`, (app, html, data) => {

    if(data.entity.type === 'weapon') {
        new MagicItemConf(app, html, data).init();    
    }
    
});

Hooks.on(`renderActorSheet5eCharacterIt`, (app, html, data) => {

    new MagicItemSheet(app, html, data).init();              
});

class MagicItemSheet {

    constructor(app, html, data) {
        this.actor = app.actor;
        this.html = html;        
        this.items = data.items.filter(item => typeof item.flags.magicitems !== 'undefined');
    }

    hack(actor) {
        const parentFn = actor.getOwnedItem.bind(actor);
        const magicItems = this.items; 
        actor.getOwnedItem = function(id) {
            let item = null;
            magicItems.forEach(mi => {
                if(mi.items[id]) {
                    item = mi.items[id];
                } 
            });
            if(item) {
                return item;
            }
            return parentFn(id);
        }   
    }

    async init() {
        if(this.items.length > 0) {
            this.items = this.items.map(item => new MagicItem(item, this.actor));
            this.hack(this.actor);
            this.render();
        }
    }

    async render() {
        let template = await renderTemplate('modules/magic-items/templates/magic-item-sheet.html', this);

        let el = this.html.find(`.magic-items-content`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            this.html.find(`.spellbook .inventory-list`).append(template);
        }

        this.handleEvents();
    }

    handleEvents() {
        this.html.find('.item .item-image.magic-item').click(evt => this.onItemRoll(evt));
        this.items.forEach(item => item.handleEvents(this.html));
    }

    onItemRoll(evt) {
        evt.preventDefault();
        const dataset = event.currentTarget.closest(".item").dataset;
        const magicItem = dataset.magicItem;
        const itemId = dataset.itemId;
        const consumption = parseInt(dataset.itemConsumption);
        this.items.filter(item => item.name === magicItem)[0].roll(itemId, consumption);
        this.render();
    }
}

class MagicItem {

    constructor(item, actor) {
        this.id = item._id;
        this.actor = actor;
        this.name = item.name;
        this.enabled = item.flags.magicitems.enabled;
        this.charges = parseInt(item.flags.magicitems.charges);
        this.uses = actor.data.flags.magicitems[this.id] ? 
                    parseInt(actor.data.flags.magicitems[this.id].uses) : this.charges;
        this.recharge = item.flags.magicitems.recharge;
        this.rechargeUnit = item.flags.magicitems.rechargeUnit;
        this.spells = Object.values(item.flags.magicitems.spells ? item.flags.magicitems.spells : {}).filter(spell => spell !== 'null');
        this.buildSpellItems();
    }

    buildSpellItems() {
        this.items = [];
        this.spells.forEach(spell => this.buildSpellItem(spell));
    }

    handleEvents(html) {
        html.find(`input[name="flags.magicitems.${this.id}.uses"]`).change(evt => {
            this.uses = parseInt(evt.currentTarget.value);
        });
    }

    async buildSpellItem(spell) {
        let data = await this.importItemFromCollection(spell.pack, spell.id);
        data.data.level = parseInt(spell.level);
        this.items[spell.id] = new Item5e(data, { actor: this.actor });
    }

    importItemFromCollection(collection, entryId) {
        const pack = game.packs.find(p => p.collection === collection);
        return pack.getEntity(entryId).then(ent => {
            return ent.data;
        });
    }

    roll(itemId, consumption) {
        let uses = this.uses - consumption;
        let spell = this.spells.filter(spell => spell.id === itemId)[0];
        if(uses >= 0) {
            this.items[itemId].roll();
            this.uses = this.uses - consumption;   
        } else {
            let d = new Dialog({
                title: this.name + ': ' + spell.name,
                content: "<p>Non ci sono cariche sufficienti per lanciare l'incantesimo.</p>",
                buttons: {}
            });
            d.render(true);
        }
    }
}

class Check {

    static numeric(value, fallback) {
        if($.isNumeric(value)) {
            return parseInt(value);   
        } else {
            return fallback;
        }    
    }
}

class MagicItemConf {

    constructor(app, html, data) {
        this.app = app;
        this.item = app.item;

        this.data = MagicItemConf.DEFAULT_DATA;
        if (typeof this.item.data.flags.magicitems !== 'undefined') {
            this.data = this.item.data.flags.magicitems;
        }

        this.enabled = this.data.enabled;
        this.charges = this.data.charges;
        this.recharge = this.data.recharge;
        this.rechargeUnit = this.data.rechargeUnit;
        this.spells = Object
                        .values(this.data.spells ? this.data.spells : {})
                        .filter(spell => spell !== 'null')
                        .map(spell => new SpellConf(spell));
        this.savedSpells = this.spells.length;
        this.garbage = [];

        if (html[0].localName !== "div") {
            this.html = $(html[0].parentElement.parentElement);
        } else {
            this.html = html;
        }  
    }

    get rechargeUnits() {
        return {
            "": "",
            "r1": "Giornaliera",
            "r2": "All'alba",
            "r3": "Al tramonto",
            "r4": "Riposo Breve",
            "r5": "Riposo lungo",
        }
    }

    static get DEFAULT_DATA() {
        return {
            enabled: false,
            charges: 0,
            recharge: 0,
            rechargeUnit: '',
            spells: {}
        }
    }

    async init() {
        this.app.form.ondragover = ev => this._onDragOver(ev);
        this.app.form.ondrop = ev => this._onDrop(ev);

        let tabs = this.html.find(`form nav.sheet-navigation.tabs`);
        tabs.append($(
            '<a class="item" data-tab="magicitems">Magic Item</a>'   
        ));

        $(this.html.find(`.sheet-body`)).append($(
            '<div class="tab magic-items" data-group="primary" data-tab="magicitems"></div>'
        ));
        
        this.render();  
    }

    async render() {
        let template = await renderTemplate('modules/magic-items/templates/magic-item-tab.html', this);
        let el = $(`.magic-items-content`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            $(this.html.find('.tab.magic-items')).append(template);   
        }

        let content = this.html.find('.magic-item-enabled');
        if(this.enabled) {
            content.show();
        } else {
            content.hide();
        }

        this.resize();

        this.handleEvents();
    }

    handleEvents() {
        this.html.find('input[name="flags.magicitems.enabled"]').click(evt => {
            this.toggleEnabled(evt.target.checked);    
        });
        this.html.find('input[name="flags.magicitems.charges"]').change(evt => {
            this.setCharges(Check.numeric(evt.target.value, this.charges));   
        });
        this.html.find('input[name="flags.magicitems.recharge"]').change(evt => {
            this.setRecharge(Check.numeric(evt.target.value, this.recharge));       
        });
        this.html.find('select[name="flags.magicitems.rechargeUnit"]').change(evt => {
            this.setRechargeUnit(evt.target.value);       
        });
        this.html.find('.item-delete').click(evt => {
            this.removeSpell(evt.target.getAttribute("data-item-name"));   
        });
        this.html.find('a[data-tab="magicitems"]').click(evt => {
            setTimeout(() => {
                this.resize();    
            }, 100);
        });   
    }

    resize() {
        this.html.find('.tab.magic-items').css("height", this.html.find(".magic-items-content").height());   
    }

    toggleEnabled(enabled) {
        this.enabled = enabled;
        if(!enabled) {
            this.clear();    
        }
        this.render();
    }

    setCharges(charges) {
        this.charges = charges;
        this.render();
    }

    setRecharge(recharge) {
        this.recharge = recharge;
        this.render();
    }

    setRechargeUnit(unit) {
        this.rechargeUnit = unit;
        this.render();
    }

    clear() {
        this.enabled = false;
        this.charges = 0;
        this.recharge = 0;
        this.rechargeUnit = '';
        this.spells = [];
        this.removed = [];
        this.cleanup();
    }

    _onDragOver(evt) {
        evt.preventDefault();
        return false;
    }
  
    async _onDrop(evt) {
        evt.preventDefault();

        let data;
        try {
            data = JSON.parse(evt.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") { 
                return;
            }
        } catch (err) {
            return false;
        }

        let pack = data.pack;
        let id = data.id;
        if (pack) {
            data = await this.importItemFromCollection(pack, id);
        }

        if(data.type !== "spell") {
            return;
        } 

        this.addSpell(data, pack, id); 
    }

    importItemFromCollection(collection, entryId) {
        const pack = game.packs.find(p => p.collection === collection);
        return pack.getEntity(entryId).then(ent => {
            return ent.data;
        });
    }

    addSpell(data, pack, id) {
        this.spells.push(SpellConf.fromCompendium(data, pack, id));
        this.cleanup();
        this.render();
    }

    removeSpell(idx) {
        this.spells.splice(idx, 1)
        this.cleanup();
        this.render();
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

class SpellConf {

    constructor(data) {
        mergeObject(this, data);  
    }

    get levels() {
        let levels = {};
        for(let i = this.level; i <= 10; i++) {
            levels[i] = i + 'th'; 
        }
        return levels;
    }

    static fromCompendium(data, pack, id) {
        return new SpellConf({
            "id": id, 
            "name": data.name, 
            "img": data.img,
            "pack": pack,
            "level": data.data.level, 
            "consumption": 0
        });
    }

}