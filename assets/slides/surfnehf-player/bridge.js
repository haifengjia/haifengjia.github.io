/* Connect the locally exported Impress animation engine to the Demo controls. */
(function () {
    'use strict';
    var origin = window.location.origin;
    var xlink = 'http://www.w3.org/1999/xlink';
    var display = SlideShow.prototype.displaySlide;
    function hydrateImages(element) {
        if (!element) return;
        var images = Array.from(element.querySelectorAll('image[data-src]'));
        if (element.matches && element.matches('image[data-src]')) images.unshift(element);
        images.forEach(function (image) {
            if (!image.hasAttributeNS(xlink, 'href')) image.setAttributeNS(xlink, 'href', image.getAttribute('data-src'));
        });
    }
    // The engine snapshots animated shapes during initialization, before lazy
    // images load. Hydrate that snapshot before it is cloned back into the slide.
    var startElement = AnimatedElement.prototype.notifySlideStart;
    AnimatedElement.prototype.notifySlideStart = function (context) {
        hydrateImages(this.aBaseElement);
        return startElement.call(this, context);
    };

    function notify() {
        window.parent.postMessage({ type: 'demo-slide-state', page: nCurSlide + 1 }, origin);
    }
    SlideShow.prototype.displaySlide = function (index, skipTransition) {
        index = Math.max(0, Math.min(theMetaDoc.nNumberOfSlides - 1, index));
        var slide = document.getElementById('id' + (index + 1));
        hydrateImages(slide);
        var result = display.call(this, index, skipTransition);
        document.querySelectorAll('.Slide image[data-animated]').forEach(function (image) {
            if (!slide.contains(image)) image.removeAttributeNS(xlink, 'href');
        });
        notify();
        return result;
    };
    window.addEventListener('message', function (event) {
        if (event.origin !== origin || event.source !== window.parent || !aSlideShow) return;
        var data = event.data || {};
        if (data.type !== 'demo-slide-command') return;
        if (data.command === 'next-effect') dispatchEffects(1);
        if (data.command === 'previous-effect') aSlideShow.rewindEffect();
        if (data.command === 'page' && Number.isInteger(data.page)) aSlideShow.displaySlide(data.page - 1, false);
        if (data.command === 'replay') aSlideShow.displaySlide(nCurSlide, false);
        notify();
    });
    var initialise = window.onload;
    window.onload = function () {
        try { initialise(); }
        catch (error) {
            window.parent.postMessage({ type: 'demo-slide-error' }, origin);
            throw error;
        }
    };
})();
