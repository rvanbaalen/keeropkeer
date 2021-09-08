import {$, forEachQuery, R, randomString} from "./utilities";

export class Notify {
    static TRANSITION_DELAY = 200;
    constructor() {

    }

    static hide(opts) {
        const {id, timeout = 400} = opts;
        if (!$(id)) {
            return;
        }

        $(id).classList.remove('show');
        setTimeout(() => {
            const element = $(id);
            if (element) {
                element.remove();
            }
        }, timeout);
    }

    static removePrevious() {
        let activeNotifications = document.querySelectorAll('.notification.show').length;

        if (activeNotifications > 0) {
            // Get rid of active notifications first
            let timeout = 200;
            forEachQuery('.notification.show', notification => {
                Notify.hide({id: notification.id, timeout});
                timeout += 200;
            });
        }

        return activeNotifications;
    }

    static show(opts) {
        const delay = Notify.removePrevious();
        const execute = (opts) => {
            if (typeof opts === 'string') {
                opts = {title: opts};
            }

            let {
                message,
                title = 'No message specified.',
                timeout = 4000,
                autoHide = false
            } = opts;

            const notification = Notify.createTemplate(message, title);

            $('app').append(notification);
            setTimeout(() => {
                $(notification.id).classList.toggle('show');
            }, 1);

            if (autoHide) {
                setTimeout(() => {
                    Notify.hide({id: notification.id});
                }, timeout);
            }
        };

        if (delay > 0) {
            setTimeout(() => {
                execute(opts);
            }, (delay * 200) + 200);
        } else {
            execute(opts);
        }
    }

    static createTemplate(message, title = false) {
        const notificationId = 'notification_' + randomString(5);
        const template = `
            <div class="notification" id="${notificationId}">
                ${title ? `
                <h2>${title}</h2>
                ` : ``}
                ${message ? `
                <p>${message}</p>
                ` : ``}
            </div>
        `;

        return R(template);
    }
}
