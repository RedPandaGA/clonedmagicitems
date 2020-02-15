import {MAGICITEMS} from "./config.js";
import {MagicItem} from "./magicitem.js";

export class MagicItemTab {

    constructor(app) {
        this.app = app;
        this.item = app.item;

        this.app.form.ondragover = ev => this._onDragOver(ev);
        this.app.form.ondrop = ev => this._onDrop(ev);

        this.hack(this.app);
    }

    init(html) {

        this.magicItem = new MagicItem(this.item.data.flags.magicitems);

        if (html[0].localName !== "div") {
            this.html = $(html[0].parentElement.parentElement);
        } else {
            this.html = html;
        }

        let tabs = this.html.find(`form nav.sheet-navigation.tabs`);
        tabs.append($(
            '<a class="item" data-tab="magicitems">Magic Item</a>'
        ));

        $(this.html.find(`.sheet-body`)).append($(
            '<div class="tab magic-items" data-group="primary" data-tab="magicitems"></div>'
        ));

        this.render();
    }

    hack(app) {
        app.setPosition = function(position={}) {
            position.height = this._sheetTab === "details" || "magicitems" ? "auto" : this.options.height;
            return this.__proto__.__proto__.setPosition.apply(this, [position])
        };
    }

    async render() {
        let template = await renderTemplate('modules/magicitems/templates/magic-item-tab.html', this.magicItem);
        let el = this.html.find(`.magic-items-content`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            this.html.find('.tab.magic-items').append(template);
        }

        let magicItemEnabled = this.html.find('.magic-item-enabled');
        if(this.magicItem.enabled) {
            magicItemEnabled.show();
        } else {
            magicItemEnabled.hide();
        }

        let magicItemRecharge = this.html.find('.form-group.magic-item-recharge');
        if(this.magicItem.rechargeable) {
            magicItemRecharge.show();
        } else {
            magicItemRecharge.hide();
        }

        this.handleEvents();

        this.app.setPosition();
    }

    handleEvents() {
        this.html.find('input[name="flags.magicitems.enabled"]').click(evt => {
            this.magicItem.toggleEnabled(evt.target.checked);
            this.render();
        });
        this.html.find('input[name="flags.magicitems.charges"]').change(evt => {
            this.magicItem.charges = MAGICITEMS.numeric(evt.target.value, this.magicItem.charges);
            this.render();
        });
        this.html.find('input[name="flags.magicitems.rechargeable"]').change(evt => {
            this.magicItem.toggleRechargeable(evt.target.checked);
            this.render();
        });
        this.html.find('input[name="flags.magicitems.recharge"]').change(evt => {
            this.magicItem.recharge = evt.target.value;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.rechargeType"]').change(evt => {
            this.magicItem.rechargeType = evt.target.value;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.rechargeUnit"]').change(evt => {
            this.magicItem.rechargeUnit = evt.target.value;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.destroy"]').change(evt => {
            this.magicItem.destroy = evt.target.checked;
            this.render();
        });
        this.html.find('.item-delete').click(evt => {
            this.magicItem.removeSpell(evt.target.getAttribute("data-item-name"));
            this.render();
        });
        this.magicItem.spells.forEach((spell, idx) => {
            this.html.find(`select[name="flags.magicitems.spells.${idx}.level"]`).change(evt => {
                spell.level = parseInt(evt.target.value);
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.spells.${idx}.consumption"]`).change(evt => {
                spell.consumption = MAGICITEMS.numeric(evt.target.value, spell.consumption);
                this.render();
            });
            this.html.find(`a[data-item-idx="${idx}"]`).click(evt => {
                spell.renderSheet();
            });
        });
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
        let entity;
        if (pack) {
            entity = await MAGICITEMS.fromCollection(pack, data.id);

        } else {
            pack = 'world';
            const cls = CONFIG[data.type].entityClass;
            entity = cls.collection.get(data.id);
        }

        if(entity.type !== "spell") {
            return;
        }

        this.magicItem.addSpell({
            id: entity.id,
            name: entity.name,
            img: entity.img,
            pack: pack,
            baseLevel: entity.data.data.level,
            level: entity.data.data.level,
            consumption: entity.data.data.level
        });

        this.render();
    }
}