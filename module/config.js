
export const MAGICITEMS = {};

MAGICITEMS.actors = [];

MAGICITEMS.rechargeUnits = {
    "r1": "MAGICITEMS.RechargeUnitDaily",
    "r2": "MAGICITEMS.RechargeUnitDawn",
    "r3": "MAGICITEMS.RechargeUnitSunset",
    "r4": "MAGICITEMS.RechargeUnitShortRest",
    "r5": "MAGICITEMS.RechargeUnitLongRest"
};

MAGICITEMS.DAILY = 'r1';
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

MAGICITEMS.chargeTypes = {
    "c1": "MAGICITEMS.ChargeTypeWholeItem",
    "c2": "MAGICITEMS.ChargeTypePerSpells"
};

MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM = "c1";
MAGICITEMS.CHARGE_TYPE_PER_SPELL = "c2";

MAGICITEMS.NUMERIC_RECHARGE = 't1';
MAGICITEMS.FORMULA_RECHARGE = 't2';

MAGICITEMS.tableUsages = {
    "u1": "MAGICITEMS.TableUsageAsSpell",
    "u2": "MAGICITEMS.TableUsageAsFeat",
    "u3": "MAGICITEMS.TableUsageTriggerOnUsage"
};

MAGICITEMS.TABLE_USAGE_AS_SPELL = "u1";
MAGICITEMS.TABLE_USAGE_AS_FEAT = "u2";
MAGICITEMS.TABLE_USAGE_TRIGGER = "u3";

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