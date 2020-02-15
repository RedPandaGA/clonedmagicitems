# FoundryVTT - Magic Items

This module for Foundry VTT adds the ability to create magical items with spells or feats that belong to the item itself, such as staffs or 
magic wands, which will be automatically inherited from the character who owns the item.

## Installation

To install, follow these instructions:

1.  Inside Foundry, select the Game Modules tab in the Configuration and Setup menu.
2.  Click the Install Module button and enter the following URL: https://gitlab.com/riccisi/foundryvtt-magic-items/raw/master/module/module.json
3.  Click Install and wait for installation to complete.

## Usage Instructions

Once activated, a new tab named 'Magic Item' will be available for each items of type 'weapon', 'equipment' or 'consumable'.  
In this tab, you can drag spells from a compendium and configure its consumption which will be subtracted from the total number of charges each time the spell is used.  
It is also possible to configure the max number of charges, if they can be can be recharged and when, and if the item will be destroyed when the charges reach 0.

<div align="center">

![example0](/example0.png?raw=true)
</div>

Using combinations of these parameters is possible to create, for example:

* A legendary staff equipped with great thaumaturgical spells

<div align="center">

![example1](/example1.png?raw=true)
</div>

* A globe with a perennial light spell.

<div align="center">

![example2](/example2.png?raw=true)
</div>

* A scroll with a powerful necromantic spell that dissolves once pronounced.

<div align="center">

![example3](/example3.png?raw=true)
</div>

When a character is equipped with one or more magical objects, within his sheet in the spellbook/features section, 
a set of inherited spells/feats divided by item will be displayed after his owned items:

<div align="center">

![example4](/example4.png?raw=true)
</div>

<div align="center">

![example5](/example4.png?raw=true)
</div>

From here you can cast the spell provided by the items and monitor the consumption/recharges.

## Compatibility

Tested on 0.4.7 version.

## Feedback

Every suggestions/feedback are appreciated, if so, please contact me on discord (Simone#6710)

## License

FoundryVTT Babele is a module for Foundry VTT by Simone and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).