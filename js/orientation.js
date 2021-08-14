export function monitorDeviceOrientation() {
    window.addEventListener('resize', () => {
        window.scrollTo(0,1);
    });

    hideIosAddressBar();
}

export function hideIosAddressBar() {
    window.scrollTo(0,1);
}
