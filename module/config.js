
export const MAGICITEMS = {};

MAGICITEMS.actors = [];

MAGICITEMS.rechargeUnits = {
    "r1": "MAGICITEMS.RechargeUnitDaily",
    "r2": "MAGICITEMS.RechargeUnitDawn",
    "r3": "MAGICITEMS.RechargeUnitSunset",
    "r4": "MAGICITEMS.RechargeUnitShortRest",
    "r5": "MAGICITEMS.RechargeUnitLongRest"
};

MAGICITEMS.SHORT_REST = 'r4';
MAGICITEMS.LONG_REST = 'r5';

MAGICITEMS.rechargeTypes = {
    "t1": "MAGICITEMS.RechargeTypeNumeric",
    "t2": "MAGICITEMS.RechargeTypeFormula"
};

MAGICITEMS.destroyChecks = {
    "d1": "MAGICITEMS.DestroyCheckAlways",
    "d2": "MAGICITEMS.DestroyCheck1D20"
};

MAGICITEMS.NUMERIC_RECHARGE = 't1';
MAGICITEMS.FORMULA_RECHARGE = 't2';

MAGICITEMS.localized = function (cfg) {
    return Object.keys(cfg).reduce((i18nCfg, key) => {
            i18nCfg[key] = game.i18n.localize(cfg[key]);
            return i18nCfg;
        }, {}
    );
};

MAGICITEMS.numeric = function(value, fallback) {
    if($.isNumeric(value)) {
        return parseInt(value);
    } else {
        return fallback;
    }
};

MAGICITEMS.fromCollection = function(collection, entryId) {
    const pack = game.packs.find(p => p.collection === collection);
    return pack.getEntity(entryId).then(ent => {
        return ent;
    });
};