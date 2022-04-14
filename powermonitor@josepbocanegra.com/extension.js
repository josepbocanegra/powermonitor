const St = imports.gi.St;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const POWERNOWPATH1 = "/sys/class/power_supply/BAT1/power_now";
const POWERNOWPATH2 = "/sys/class/power_supply/BAT0/power_now";
const ENERGYNOWPATH1 = "/sys/class/power_supply/BAT1/energy_now";
const ENERGYNOWPATH2 = "/sys/class/power_supply/BAT0/energy_now";

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

        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
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
    energyNow1 = Number(GLib.file_get_contents(ENERGYNOWPATH1)[1])/1000000;
    energyNow2 = Number(GLib.file_get_contents(ENERGYNOWPATH2)[1])/1000000;
    totalEnergyNow = energyNow1 + energyNow2;
    currentPower=Number(GLib.file_get_contents(POWERNOWPATH1)[1])/1000000;
    if(currentPower == 0) {
        battery=" - int";
        currentPower=Number(GLib.file_get_contents(POWERNOWPATH2)[1])/1000000;
    }
    return totalEnergyNow.toFixed(2) + "Wh - " + currentPower.toFixed(2)+"W"+battery;
}

function init() {
    log(`initializing ${Me.metadata.name}`);
    
    return new Extension();
}
