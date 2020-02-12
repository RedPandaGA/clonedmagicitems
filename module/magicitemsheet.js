import {OwnedMagicItem} from "./magicitem.js";
import {MAGICITEMS} from "./config.js";

export class MagicItemSheet {

    constructor(actor) {
        this.actor = actor;
        this.hack(this.actor);
    }

    async init(html, data) {
        this.html = html;
        this.data = data;
        this.items = await this.buildItems();
        this.render();
    }

    dispose() {

    }

    buildItems() {
        return new Promise((resolve, reject) => {
            Promise.all(
                this.data.items
                    .filter(item => typeof item.flags.magicitems !== 'undefined')
                    .map(item => this.buildItem(item))
            ).then(magicItems => resolve(magicItems))
        });
    }

    buildItem(item) {
        return new Promise((resolve, reject) => {
            let magicItem = new OwnedMagicItem(item, this.actor);
            magicItem.init().then(() => resolve(magicItem));
        })
    }

    hack(actor) {
        const parentFn = actor.getOwnedItem.bind(actor);
        actor.getOwnedItem = function(id) {
            let item = null;
            this.items.forEach(mi => {
                if(mi.hasSpell(id)) {
                    item = mi.ownedItem(id);
                }
            });
            if(item) {
                return item;
            }
            return parentFn(id);
        }.bind(this);

        const shortRest = actor.shortRest.bind(actor);
        actor.shortRest = async function () {
            let result = await shortRest(arguments);
            this.onShortRest(result);
            return result;
        }.bind(this);

        const longRest = actor.longRest.bind(actor);
        actor.longRest = async function () {
            let result = await longRest(arguments);
            this.onLongRest(result);
            return result;
        }.bind(this);
    }

    async render() {
        let template = await renderTemplate('modules/magicitems/templates/magic-item-sheet.html', this);

        let el = this.html.find(`.magic-items-content`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            this.html.find(`.spellbook .inventory-list`).append(template);
        }

        this.handleEvents();
    }

    handleEvents() {
        this.html.find('.item div.item-image.magic-item').click(evt => this.onItemRoll(evt));
        this.html.find('.item h4.spell-name').click(evt => this.onItemShow(evt));
        this.items.forEach(item => {
            this.html.find(`input[name="flags.magicitems.${item.id}.uses"]`).change(evt => {
                item.setUses(MAGICITEMS.numeric(evt.currentTarget.value, item.uses));
            });
        });
    }

    onItemRoll(evt) {
        evt.preventDefault();
        const dataset = evt.currentTarget.closest(".item").dataset;
        const magicItem = dataset.magicItem;
        const spellId = dataset.itemId;
        const consumption = parseInt(dataset.itemConsumption);
        this.items.filter(item => item.name === magicItem)[0].roll(spellId, consumption);
        this.render();
    }

    onItemShow(evt) {
        evt.preventDefault();
        const dataset = evt.currentTarget.closest(".item").dataset;
        const magicItem = dataset.magicItem;
        const spellId = dataset.itemId;
        this.items.filter(item => item.name === magicItem)[0].renderSheet(spellId);
    }

    onShortRest(result) {
        if(result) {
            this.items.forEach(item => {
                let recharge = item.onShortRest();
                if(recharge) {
                    this.applyRecharge(item, recharge);
                }
            });
            this.render();
        }
    }

    onLongRest(result) {
        if(result) {
            this.items.forEach(item => {
                let recharge = item.onLongRest();
                if(recharge) {
                    this.applyRecharge(item, recharge);
                }
            });
            this.render();
        }
    }

    applyRecharge(item, recharge) {
        let msg = `<b>Magic Item: ${item.name}</b><br> 
                    ${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${recharge.flavor}`;
        ChatMessage.create({
            user: this.actor.name,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: msg
        });
        this.actor.setFlag('magicitems', `${item.id}.uses`, recharge.uses);
    }

}