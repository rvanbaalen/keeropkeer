import {$} from "./utilities";
import {dispatch, EVENTS, listen} from "./events";

export class Router {
    currentView;
    previousView = [];
    silent = false;
    constructor() {
        this.currentView = document.querySelectorAll('.applicationWindow:not(.hidden)')[0];

        listen(EVENTS.NAVIGATE_BACK, () => {
            const page = this.previousView.pop(), silent = true;
            if ($(page)) {
                this.navigate({page, silent});
            }
        });

        listen(EVENTS.NAVIGATE, (event) => {
            const {page} = event.detail;
            if ($(page)) {
                this.navigate({page});
            }
        });
    }

    hideCurrent() {
        if (this.currentView) {
            if (!this.silent) this.previousView = this.currentView;
            dispatch(EVENTS.NAVIGATE_FROM, {page: this.currentView});
            this.currentView.classList.add('hidden');
        }
    }

    navigate({page, silent}) {
        this.silent = silent || false;
        if (this.currentView?.id === page) return;
        this.hideCurrent();
        this.currentView = $(page);
        this.currentView.classList.remove('hidden');
        dispatch(EVENTS.NAVIGATE_TO, {page: this.currentView});
        this.silent = false;
    }

    static navigateTo(page) {
        dispatch(EVENTS.NAVIGATE, {page});
    }

    static back() {
        dispatch(EVENTS.NAVIGATE_BACK);
    }
}
