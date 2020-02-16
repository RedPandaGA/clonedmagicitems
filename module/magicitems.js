import {MagicItemSheet} from "./magicitemsheet.js";
import {MagicItemTab} from "./magicItemtab.js";

Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    MagicItemTab.instrument(app, html, data);
});

Hooks.on(`renderItemSheet5eDark`, (app, html, data) => {
    MagicItemTab.instrument(app, html, data);
});

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
    MagicItemSheet.instrument(app, html, data);
});

Hooks.on(`renderActorSheet5eCharacterDark`, (app, html, data) => {
    MagicItemSheet.instrument(app, html, data);
});