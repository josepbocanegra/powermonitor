const St = imports.gi.St;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const DATAPATH = "/sys/class/power_supply/BAT1/power_now";
const DATAPATH2 = "/sys/class/power_supply/BAT0/power_now";

let sourceId = null;

class Extension {
    constructor() {
        this._indicator = null;
    }
    
    enable() {
        log(`enabling ${Me.metadata.name}`);

        let indicatorName = `${Me.metadata.name} Indicator`;
        
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, indicatorName, false);
        
        // Add an icon
        let label = new St.Label({
            text: 'loading...'});
        this._indicator.add_child(label);

        // `Main.panel` is the actual panel you see at the top of the screen,
        // not a class constructor.
        Main.panel.addToStatusArea(indicatorName, this._indicator);

        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            log('Source triggered');
            label.set_text(getCurrentPower().toFixed(2)+"W");
    
            return GLib.SOURCE_CONTINUE;
        });
    }
    
    // REMINDER: It's required for extensions to clean up after themselves when
    // they are disabled. This is required for approval during review!
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
    let currentPower=0
    currentPower=Number(GLib.file_get_contents(DATAPATH)[1])/1000000;
    if(currentPower == 0)
        currentPower=Number(GLib.file_get_contents(DATAPATH2)[1])/1000000;
    return currentPower;
}

function init() {
    log(`initializing ${Me.metadata.name}`);
    
    return new Extension();
}
