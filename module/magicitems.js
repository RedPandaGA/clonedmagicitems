import {MagicItemActor} from "./magicitemactor.js";
import {MagicItemSheet} from "./magicitemsheet.js";
import {MagicItemTab} from "./magicItemtab.js";

//CONFIG.debug.hooks = true;

Hooks.once('ready', () => {
    game.actors.entities.forEach(actor => {
        MagicItemActor.bind(actor);
    });
});

Hooks.once('createActor', (actor) => {
    MagicItemActor.bind(actor);
});

Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    MagicItemTab.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
    MagicItemSheet.bind(app, html, data);
});

Hooks.on("hotbarDrop", async (bar, data, slot) => {
    if ( data.type !== "MagicItem" ) return;

    const command = `MagicItems.roll("${data.magicItemName}","${data.itemName}");`;
    let macro = game.macros.entities.find(m => (m.name === data.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: data.name,
            type: "script",
            img: data.img,
            command: command,
            flags: {"dnd5e.itemMacro": true}
        }, {displaySheet: false});
    }
    game.user.assignHotbarMacro(macro, slot);

    return false;
});

window.MagicItems = {

    actor: function(id) {
        return MagicItemActor.get(id);
    },

    roll: function(magicItemName, itemName) {

        const speaker = ChatMessage.getSpeaker();
        let actor;
        if ( speaker.token ) actor = game.actors.tokens[speaker.token];
        if ( !actor ) actor = game.actors.get(speaker.actor);

        const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
        if ( !magicItemActor ) return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoActor"));

        magicItemActor.rollByName(magicItemName, itemName);
    },

    bindItemSheet: function(app, html, data) {
        MagicItemTab.bind(app, html, data);
    },

    bindCharacterSheet: function(app, html, data) {
        MagicItemSheet.bind(app, html, data);
    }
};