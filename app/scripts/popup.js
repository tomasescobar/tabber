/* global $, Fuse */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Tabber = (function () {
    function Tabber() {
        _classCallCheck(this, Tabber);

        this.input = $('.input input');
        this.container = $('.tab-list');
        this.cloneTabItem = this.container.children('.tab.source');

        // Get initial tabs
        this.getTabs(true);

        // Set key bindings
        var self = this;
        this.input.on('keydown', function (e) {
            self.onKeyDown(e);
        });
        this.input.on('keyup', function (e) {
            self.onKeyUp(e);
        });
    }

    _createClass(Tabber, [{
        key: 'renderTabs',
        value: function renderTabs(list) {
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
                t.on('click', function (e) {
                    self.clickTab(e);
                });

                // Hover event
                t.on('mouseover', function (e) {
                    self.hoverTab(e);
                });

                t.appendTo(this.container);
            }

            // Add class when no results
            this.container[total === 0 ? 'addClass' : 'removeClass']('no-results');

            this.updateSelected();
        }
    }, {
        key: 'getTabs',
        value: function getTabs(first) {
            var self = this;
            chrome.tabs.query({}, function (tabs) {
                self.tabList = tabs;

                // Set fuse search
                self.fuse = new Fuse(tabs, {
                    keys: ['title', 'url']
                });

                if (first) {
                    self.renderTabs(tabs);
                }
            });
        }
    }, {
        key: 'searchTabs',
        value: function searchTabs(q) {
            var filteredList;
            if (q === undefined || q === null || q === '') {
                filteredList = this.tabList;
            } else {
                filteredList = this.fuse.search(q);
            }
            this.renderTabs(filteredList);
        }
    }, {
        key: 'updateSelected',
        value: function updateSelected() {
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
    }, {
        key: 'selectNext',
        value: function selectNext() {
            if (this.selectedIndex < this.listLength - 1) {
                this.selectedIndex += 1;
            } else {
                this.selectedIndex = 0;
            }
            this.updateSelected();
        }
    }, {
        key: 'selectPrev',
        value: function selectPrev() {
            if (this.selectedIndex > 0) {
                this.selectedIndex -= 1;
            } else {
                this.selectedIndex = this.listLength - 1;
            }
            this.updateSelected();
        }
    }, {
        key: 'clear',
        value: function clear() {
            // If already empty, close popup
            if (this.input.val() === '') {
                // To close it, we need to focus active window and tab
                chrome.tabs.query({
                    active: true,
                    currentWindow: true
                }, function (tab) {
                    chrome.windows.update(tab[0].windowId, {
                        focused: true
                    }, function () {
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
    }, {
        key: 'highlightTab',
        value: function highlightTab(tab) {
            chrome.windows.update(tab.data('window'), {
                focused: true
            }, function () {
                chrome.tabs.highlight({
                    windowId: tab.data('window'),
                    tabs: tab.data('index')
                });
            });
        }
    }, {
        key: 'clickTab',
        value: function clickTab(e) {
            var tab = $(e.currentTarget);
            this.highlightTab(tab);
        }
    }, {
        key: 'hoverTab',
        value: function hoverTab(e) {
            var tab = $(e.currentTarget),
                index = this.container.children('.tab').not('.source').index(tab);

            this.selectedIndex = index;
            this.updateSelected();
        }
    }, {
        key: 'goToSelectedTab',
        value: function goToSelectedTab() {
            var allTabs = this.container.children('.tab').not('.source'),
                selectedTab = allTabs.eq(this.selectedIndex);

            if (selectedTab.length) {
                this.highlightTab(selectedTab);
            }
        }
    }, {
        key: 'isScrolledIntoView',
        value: function isScrolledIntoView(el, parent) {
            var parentTop = parent.offset().top,
                parentBottom = parentTop + parent.height(),
                elemTop = el.offset().top,
                elemBottom = elemTop + el.outerHeight();

            return elemBottom <= parentBottom && elemTop >= parentTop;
        }
    }, {
        key: 'scrollToElement',
        value: function scrollToElement(el, parent) {
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
    }, {
        key: 'onKeyDown',
        value: function onKeyDown(e) {
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
    }, {
        key: 'onKeyUp',
        value: function onKeyUp(e) {
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
    }]);

    return Tabber;
})();

new Tabber();
//# sourceMappingURL=popup.js.map
