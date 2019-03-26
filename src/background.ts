import { EnableOnDocs, Message, LoadTemplateCSS } from './shared';

function toggleIcon(tab: chrome.tabs.Tab) {
    if (!tab) {
        return console.error('toggleIcon: tab input cannot be falsy');
    }
    const host = (new URL(tab.url)).hostname;
    if (!host) {
        return console.error('toggleIcon: hostname must be a non-nil string');
    }

    chrome.storage.sync.get(host, (data) => {
        let save: any = {}
        save[host] = !data[host]
        chrome.storage.sync.set(save, () => {
            console.log('toggleIcon: updated', host, 'to', save);
            setTabState(tab);
        });
    });
};

function setTabState(tab: chrome.tabs.Tab) {
    if (!tab) {
        return console.error('setTabState: tab input cannot be falsy');
    }
    const host = (new URL(tab.url)).hostname;
    if (!host) {
        return console.error('setTabState: hostname must be a non-nil string');
    }
    chrome.storage.sync.get(host, (data) => {
        console.log('setTabState: state of', host, 'is', data[host])
        chrome.browserAction.setIcon({ path: data[host] ? 'enabled.png' : 'disabled.png' });
        if (data[host]) {
            chrome.tabs.sendMessage(tab.id, { type: 'analyze_doc' } as Message, (resp) => {
                console.log('Done analyzing doc:', resp);
            });
        }
    });
}

chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    console.log('runtime.onInstalled fired:' + details.reason);
    LoadTemplateCSS(() => console.log('saved template.css file to storage'));
    EnableOnDocs(() => console.log('enabled extensions on gdocs.'));
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
    console.log('browserAction.onClicked fired: ', tab);
    toggleIcon(tab);
});

// Called when user switches tab. Check if enabled for this tab
chrome.tabs.onActivated.addListener((active: chrome.tabs.TabActiveInfo) => {
    console.log('tabs.onActivated fired: ', active);
    chrome.tabs.get(active.tabId, setTabState);
});