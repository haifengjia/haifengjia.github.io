(function () {
    var select = document.getElementById('project-mobile-jump');
    if (select) {
        select.addEventListener('change', function () {
            if (select.value) {
                window.location.hash = select.value;
            }
        });
    }

    var copyBtn = document.getElementById('surfnehf-copy-bibtex');
    var bibBlock = document.getElementById('surfnehf-bibtex');
    if (copyBtn && bibBlock) {
        copyBtn.addEventListener('click', function () {
            var text = bibBlock.innerText || bibBlock.textContent || '';
            var span = copyBtn.querySelector('span');
            function done(ok) {
                if (!span) return;
                var prev = span.textContent;
                span.textContent = ok ? 'Copied' : 'Failed';
                window.setTimeout(function () { span.textContent = prev; }, 1600);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { done(document.execCommand('copy')); } catch (e) { done(false); }
                document.body.removeChild(ta);
            }
        });
    }
})();
