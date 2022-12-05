const St = imports.gi.St;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const VOLTAGENOWPATH = "/sys/class/power_supply/BAT0/voltage_now";
const CURRENTNOWPATH = "/sys/class/power_supply/BAT0/current_now";
const CHARGENOWPATH = "/sys/class/power_supply/BAT0/charge_now";
const CHARGEFULLPATH = "/sys/class/power_supply/BAT0/charge_full";
const CHARGEFULLDESIGNPATH = "/sys/class/power_supply/BAT0/charge_full_design";

let sourceId = null;

class Extension {
    constructor() {
        this._indicator = null;
    }
    
    enable() {
        log(`enabling ${Me.metadata.name}`);

        let indicatorName = `${Me.metadata.name} Indicator`;

        this._indicator = new PanelMenu.Button(0.0, indicatorName, false);
        
        let label = new St.Label({
            text: 'loading...',
            style_class: 'power'
        });
        this._indicator.add_child(label);

        Main.panel.addToStatusArea(indicatorName, this._indicator);

        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 8, () => {
            label.set_text(getCurrentPower());   
            return GLib.SOURCE_CONTINUE;
        });
    }
    
    disable() {
        log(`disabling ${Me.metadata.name}`);

        if (sourceId) {
            GLib.Source.remove(sourceId);
            sourceId = null;
        }

        this._indicator.destroy();
        this._indicator = null;
    }
}

function getCurrentPower() {
    let currentPower=0;
    let battery=" - ext";
    voltageNow = Number(GLib.file_get_contents(VOLTAGENOWPATH)[1])/1000000;
    currentNow = Number(GLib.file_get_contents(CURRENTNOWPATH)[1])/1000000;
    totalEnergyNow = voltageNow * currentNow;
    chargeNow=Number(GLib.file_get_contents(CHARGENOWPATH)[1])/100000*1.1520;
    chargeFull=Number(GLib.file_get_contents(CHARGEFULLPATH)[1])/100000*1.1520;
    remainingTime = chargeNow/totalEnergyNow
    remainingPercentage = (chargeNow/chargeFull) * 100;
    chargeFullDesign = Number(GLib.file_get_contents(CHARGEFULLDESIGNPATH)[1])/100000*1.1520;
    batteryHealth = chargeFull/chargeFullDesign * 100;
    return remainingPercentage.toFixed(0) + " % [" + batteryHealth.toFixed(0) + " %]| " + chargeNow.toFixed(2) + " Wh | " + totalEnergyNow.toFixed(2)+" W | " + remainingTime.toFixed(2)+ " h";
}

function init() {
    log(`initializing ${Me.metadata.name}`);
    
    return new Extension();
}
