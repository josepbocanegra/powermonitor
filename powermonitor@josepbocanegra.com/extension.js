const St = imports.gi.St;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const POWERNOWPATHEXT = "/sys/class/power_supply/BAT1/power_now";
const POWERNOWPATHINT = "/sys/class/power_supply/BAT0/power_now";
const ENERGYNOWPATHEXT = "/sys/class/power_supply/BAT1/energy_now";
const ENERGYNOWPATHINT = "/sys/class/power_supply/BAT0/energy_now";
const ENERGYFULLPATHEXT = "/sys/class/power_supply/BAT1/energy_full";
const ENERGYFULLPATHINT = "/sys/class/power_supply/BAT0/energy_full";
const STATUSPATHEXT = "/sys/class/power_supply/BAT1/status";
const STATUSPATHINT = "/sys/class/power_supply/BAT0/status";
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
    let currentStatusExt = GLib.file_get_contents(STATUSPATHEXT)[1];
    let currentStatusInt = GLib.file_get_contents(STATUSPATHINT)[1];
    let batteryExt = currentStatusExt == 'Charging\n' ? "⚡" : currentStatusExt == 'Discharging\n' ? "🔻" : "";
    let batteryInt = currentStatusInt == 'Charging\n' ? "⚡" : currentStatusInt == 'Discharging\n' ? "🔻" : "";
    const directPlug = batteryExt == "" && batteryInt == "";
    let batteryChargingIcon = directPlug ? "🔌" : " ";
    let currentPower=0;

    
    let energyNowExt = Number(GLib.file_get_contents(ENERGYNOWPATHEXT)[1])/1000000;
    let energyNowInt = Number(GLib.file_get_contents(ENERGYNOWPATHINT)[1])/1000000;
    let totalEnergyNow = energyNowExt + energyNowInt;
    currentPower=Number(GLib.file_get_contents(POWERNOWPATHEXT)[1])/1000000;
    if(currentPower == 0) {
        
  
        currentPower=Number(GLib.file_get_contents(POWERNOWPATHINT)[1])/1000000;
    }
    let remainingTime = totalEnergyNow/currentPower;
    let energyFullExt=Number(GLib.file_get_contents(ENERGYFULLPATHEXT)[1])/100000;
    let energyFullInt=Number(GLib.file_get_contents(ENERGYFULLPATHINT)[1])/100000;
    let energyFull=energyFullExt+energyFullInt;
    let remainingTotalPercentage = (totalEnergyNow/energyFull) * 1000;
    let remainingExtPercentage = (energyNowExt/energyFullExt) * 1000;
    let remainingIntPercentage = (energyNowInt/energyFullInt) * 1000;
    let remainingBattery = remainingTotalPercentage.toFixed(0) 
        + " % (" + remainingIntPercentage.toFixed(0) + " % int" + batteryInt + " | " 
        + remainingExtPercentage.toFixed(0) + " % ext" + batteryExt + ")" + batteryChargingIcon + "| ";
    return  remainingBattery + totalEnergyNow.toFixed(2) + " Wh | " 
    + currentPower.toFixed(2)+" W | " + (directPlug == true ? "--" : remainingTime.toFixed(2)) + " h";
}

function init() {
    log(`initializing ${Me.metadata.name}`);
    
    return new Extension();
}
