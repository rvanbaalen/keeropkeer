import {$} from "./utilities";
import {dispatch, EVENTS, listen} from "./events";

export class Application {
    currentView;
    defaultView = 'levelSelect';
    constructor() {
        this.currentView = document.querySelectorAll('.applicationWindow:not(.hidden)')[0];

        listen(EVENTS.NAVIGATE, (event) => {
            const {page} = event.detail;
            if ($(page)) {
                this.navigate(page);
            }
        });
    }

    hideCurrent() {
        if (this.currentView) {
            dispatch(EVENTS.NAVIGATE_FROM, {page: this.currentView});
            this.currentView.classList.add('hidden');
        }
    }

    navigate(page) {
        if (this.currentView?.id === page) return;
        this.hideCurrent();
        this.currentView = $(page);
        this.currentView.classList.remove('hidden');
        dispatch(EVENTS.NAVIGATE_TO, {page: this.currentView});
    }

    static navigateTo(page) {
        dispatch(EVENTS.NAVIGATE, {page});
    }
}
