/* Demo media has no third-party JavaScript dependencies. */
(() => {
    'use strict';
    const menu = document.querySelector('.navbar-toggler');
    const navigation = document.getElementById('navbarResponsive');
    if (menu && navigation) menu.addEventListener('click', () => {
        const open = navigation.classList.toggle('show');
        menu.setAttribute('aria-expanded', String(open));
    });

    document.querySelectorAll('.demo-video').forEach(panel => {
        const video = panel.querySelector('video');
        const overlay = panel.querySelector('.demo-video-play');
        const toggle = panel.querySelector('.demo-video__toggle');
        const seek = panel.querySelector('.demo-video__seek');
        const time = panel.querySelector('.demo-video__time');
        const mute = panel.querySelector('.demo-video__mute');
        const full = panel.querySelector('.demo-video__fullscreen');
        const error = panel.querySelector('.demo-video__error');
        const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
        const update = () => {
            toggle.innerHTML = video.paused ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 4.5a.75.75 0 0 1 1.15-.64l12 7.5a.75.75 0 0 1 0 1.28l-12 7.5A.75.75 0 0 1 7 19.5z"/></svg>' : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>';
            toggle.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
            overlay.hidden = !video.paused || video.currentTime > 0;
            seek.disabled = !Number.isFinite(video.duration);
            seek.value = video.duration ? video.currentTime / video.duration * 100 : 0;
            time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 0)}`;
            seek.setAttribute('aria-valuetext', `${formatTime(video.currentTime)} of ${formatTime(video.duration || 0)}`);
        };
        const togglePlayback = async () => {
            if (!video.getAttribute('src')) video.src = video.dataset.src;
            error.hidden = true;
            if (video.paused) {
                try { await video.play(); }
                catch (_) { if (video.error) error.hidden = false; }
            } else video.pause();
        };
        overlay.addEventListener('click', togglePlayback);
        toggle.addEventListener('click', togglePlayback);
        video.addEventListener('click', togglePlayback);
        ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach(event => video.addEventListener(event, update));
        video.addEventListener('error', () => { error.hidden = false; });
        seek.addEventListener('input', () => {
            if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value) / 100 * video.duration;
        });
        mute.addEventListener('click', () => {
            video.muted = !video.muted;
            mute.innerHTML = video.muted ? '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-volume-high" aria-hidden="true"></i>';
            mute.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
            mute.setAttribute('aria-pressed', String(video.muted));
        });
        if (!panel.requestFullscreen) full.hidden = true;
        full.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement === panel) await document.exitFullscreen();
                else await panel.requestFullscreen();
            } catch (_) { /* Inline playback remains available. */ }
        });
    });

    document.querySelectorAll('.demo-slides').forEach(viewer => {
        const count = Number(viewer.dataset.count);
        const stage = viewer.querySelector('.demo-slides__stage');
        const image = stage.querySelector('img');
        const error = viewer.querySelector('.demo-slides__error');
        const previous = viewer.querySelector('[data-direction="-1"]');
        const next = viewer.querySelector('[data-direction="1"]');
        const full = viewer.querySelector('.demo-slides__fullscreen');
        let current = 1;
        let frame = null;
        let ready = false;
        let loadingTimer;
        const update = () => {
            viewer.querySelector('.demo-slides__counter').textContent = `${current} / ${count}`;
            // An effect can be rewound or advanced without changing the page number.
            previous.disabled = viewer.dataset.player ? !ready : current === 1;
            next.disabled = viewer.dataset.player ? !ready : current === count;
        };
        const send = command => {
            if (frame && ready) frame.contentWindow.postMessage({ type: 'demo-slide-command', command }, window.location.origin);
        };
        const step = direction => {
            if (viewer.dataset.player) {
                send(direction < 0 ? 'previous-effect' : 'next-effect');
            } else {
                current = Math.max(1, Math.min(count, current + direction));
                image.src = `${viewer.dataset.directory}/slide-${String(current).padStart(2, '0')}.webp`;
                image.alt = `Slide ${current} of ${count}`;
                update();
            }
        };
        image.addEventListener('error', () => { error.hidden = false; });
        previous.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        const fail = () => {
            clearTimeout(loadingTimer);
            if (frame) frame.remove();
            frame = null;
            ready = false;
            image.hidden = false;
            error.hidden = false;
            update();
        };
        const load = () => {
            if (frame || !viewer.dataset.player) return;
            error.hidden = true;
            frame = document.createElement('iframe');
            frame.title = 'Animated SurfNeHF slides. Click or press right arrow to advance effects.';
            frame.src = viewer.dataset.player;
            frame.allowFullscreen = true;
            frame.addEventListener('error', fail);
            loadingTimer = setTimeout(fail, 30000);
            stage.append(frame);
        };
        window.addEventListener('message', event => {
            if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
            const data = event.data || {};
            if (data.type === 'demo-slide-error') { fail(); return; }
            if (data.type !== 'demo-slide-state' || !Number.isInteger(data.page) || data.page < 1 || data.page > count) return;
            clearTimeout(loadingTimer);
            ready = true;
            image.hidden = true;
            current = data.page;
            update();
        });
        // Start the animated presentation as it enters view, without a separate play gate.
        if (viewer.dataset.player) {
            const observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
            }, { rootMargin: '100px' });
            observer.observe(viewer);
        }
        viewer.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                step(event.key === 'ArrowLeft' ? -1 : 1);
            }
        });
        update();
        if (!viewer.requestFullscreen) full.hidden = true;
        full.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement === viewer) await document.exitFullscreen();
                else await viewer.requestFullscreen();
            } catch (_) { /* Inline viewing remains available. */ }
        });
    });
})();
