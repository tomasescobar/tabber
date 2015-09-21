/* global $, Fuse */
'use strict';

class Tabber {

    constructor() {
       this.input = $('.input input');
       this.container = $('.tab-list');
       this.cloneTabItem = this.container.children('.tab.source');

       // Get initial tabs
       this.getTabs(true);

       // Set key bindings
       var self = this;
       this.input.on('keydown', function(e) {
           self.onKeyDown(e);
       });
       this.input.on('keyup', function(e) {
           self.onKeyUp(e);
       });
   }

    renderTabs(list) {
        var self = this;

        // Restart index
        this.selectedIndex = 0;
        this.listLength = list.length;

        // Remove all previous items
        this.container.children('.tab').not('.source').remove();

        // Clone and append item for each open tab
        for (var i = 0, total = list.length; i < total; i++) {
            var t = this.cloneTabItem.clone();
            t.removeClass('source');
            t.children('.icon').css('background-image', 'url(' + list[i].favIconUrl + ')');
            t.children('.title').text(list[i].title);
            t.children('.url').text(list[i].url);

            // Add class if pinned
            if (list[i].pinned) {
                t.addClass('pinned');
            }
            // Add class if incognito
            if (list[i].incognito) {
                t.addClass('incognito');
            }

            // Save index and window data
            t.data('index', list[i].index);
            t.data('window', list[i].windowId);

            // Click event
            t.on('click', function(e) {
                self.clickTab(e);
            });

            // Hover event
            t.on('mouseover', function(e) {
                self.hoverTab(e);
            });

            t.appendTo(this.container);
        }

        // Add class when no results
        this.container[total === 0 ? 'addClass' : 'removeClass']('no-results');

        this.updateSelected();
    }

    getTabs(first) {
        var self = this;
        chrome.tabs.query({}, function(tabs) {
            self.tabList = tabs;

            // Set fuse search
            self.fuse = new Fuse(tabs, {
                keys: ['title','url']
            });

            if (first) {
                self.renderTabs(tabs);
            }
        });
    }

    searchTabs(q) {
        var filteredList;
        if (q === undefined || q === null || q === '') {
            filteredList = this.tabList;
        } else {
            filteredList = this.fuse.search(q);
        }
        this.renderTabs(filteredList);
    }

    updateSelected() {
        var tabItems = this.container.children('.tab').not('.source');
        tabItems.removeClass('selected');

        if (this.selectedIndex >= 0) {
            var item = tabItems.eq(this.selectedIndex);

            // Update class
            item.addClass('selected');

            // Make sure item is visible
            if (!this.isScrolledIntoView(item, this.container)) {
                this.scrollToElement(item, this.container);
            }
        }
    }

    selectNext() {
        if (this.selectedIndex < this.listLength - 1) {
            this.selectedIndex += 1;
        } else {
            this.selectedIndex = 0;
        }
        this.updateSelected();
    }

    selectPrev() {
        if (this.selectedIndex > 0) {
            this.selectedIndex -= 1;
        } else {
            this.selectedIndex = this.listLength - 1;
        }
        this.updateSelected();
    }

    clear() {
        // If already empty, close popup
        if (this.input.val() === '') {
            // To close it, we need to focus active window and tab
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tab) {
                chrome.windows.update(tab[0].windowId, {
                    focused: true
                }, function() {
                    chrome.tabs.highlight({
                        windowId: tab[0].windowId,
                        tabs: tab[0].index
                    });
                });
            });
            return;
        }

        this.input.val('');
        this.searchTabs();
    }

    highlightTab(tab) {
        chrome.windows.update(tab.data('window'), {
            focused: true
        }, function() {
            chrome.tabs.highlight({
                windowId: tab.data('window'),
                tabs: tab.data('index')
            });
        });
    }

    clickTab(e) {
        var tab = $(e.currentTarget);
        this.highlightTab(tab);
    }

    hoverTab(e) {
        var tab = $(e.currentTarget),
            index = this.container.children('.tab').not('.source').index(tab);

        this.selectedIndex = index;
        this.updateSelected();
    }

    goToSelectedTab() {
        var allTabs = this.container.children('.tab').not('.source'),
            selectedTab = allTabs.eq(this.selectedIndex);

        if (selectedTab.length) {
            this.highlightTab(selectedTab);
        }
    }

    isScrolledIntoView(el, parent) {
        var parentTop = parent.offset().top,
            parentBottom = parentTop + parent.height(),
            elemTop = el.offset().top,
            elemBottom = elemTop + el.outerHeight();

        return (elemBottom <= parentBottom) && (elemTop >= parentTop);
    }

    scrollToElement(el, parent) {
        var parentTop = parent.offset().top,
            parentBottom = parentTop + parent.height(),
            elTop = el.offset().top,
            elBottom = elTop + el.outerHeight(),
            pos;

        if (elBottom > parentBottom) {
            pos = parent.scrollTop() + (elBottom - parentBottom);
        } else {
            pos = parent.scrollTop() - (parentTop - elTop);
        }

        parent.scrollTop(pos);
    }

    onKeyDown(e) {
        switch (e.keyCode) {
            // Esc
            case 27:
                e.preventDefault();
                this.clear();
                break;
            // Enter
            case 13:
                e.preventDefault();
                this.goToSelectedTab();
                break;
            // Up
            case 38:
                e.preventDefault();
                this.selectPrev();
                break;
            // Down
            case 40:
                e.preventDefault();
                this.selectNext();
                break;
        }
    }

    onKeyUp(e) {
        switch (e.keyCode) {
            case 13:
            case 27:
            case 38:
            case 40:
                break;
            default:
                this.searchTabs(e.target.value);
        }
    }
}

new Tabber();
