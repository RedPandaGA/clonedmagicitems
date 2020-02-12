import {MagicItemSheet} from "./magicitemsheet.js";
import {MagicItemTab} from "./magicItemtab.js";

const magicItemTabs = [];

Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    let acceptedTypes = ['weapon', 'equipment', 'consumable'];
    if(acceptedTypes.includes(data.entity.type)) {
        let tab = magicItemTabs[app.id];
        if(!tab) {
            tab = new MagicItemTab(app);
        }
        tab.init(html, data);
    }
});

const magicItemSheets = [];

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
    let sheet = magicItemSheets[app.id];
    if(!sheet) {
        sheet = new MagicItemSheet(app.actor);
        magicItemSheets[app.id] = sheet;
    }
    sheet.init(html, data);
});