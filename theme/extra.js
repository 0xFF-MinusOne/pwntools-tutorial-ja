/* コードの窓: <pre> を帯つきの枠で包む（3つの丸・言語・コピーのボタン） */
(function () {
  var COPY = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var COPIED_MS = 1800;

  function languageOf(pre) {
    var code = pre.querySelector('code');
    var m = ((code && code.className) + ' ' + pre.className + ' ' + (pre.parentNode.className||'')).match(/language-([\w+#-]+)/);
    return m ? m[1] : 'text';
  }

  [].forEach.call(document.querySelectorAll('.md-typeset pre'), function (pre) {
    if (pre.parentNode.classList.contains('code-block')) return;
    var frame = document.createElement('div');
    frame.className = 'code-block';

    var header = document.createElement('div');
    header.className = 'code-header';

    var dots = document.createElement('span');
    dots.className = 'window-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<i></i><i></i><i></i>';

    var lang = document.createElement('span');
    lang.className = 'code-language';
    lang.textContent = languageOf(pre);

    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'code-copy';
    copy.title = 'コピー';
    copy.setAttribute('aria-label', 'コードをコピー');
    copy.innerHTML = COPY;
    copy.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(pre.innerText.replace(/\n$/, '')).then(function () {
        copy.innerHTML = CHECK;
        copy.setAttribute('data-copied', '');
        setTimeout(function () { copy.innerHTML = COPY; copy.removeAttribute('data-copied'); }, COPIED_MS);
      });
    });

    header.append(dots, lang, copy);
    pre.parentNode.insertBefore(frame, pre);
    frame.append(header, pre);
  });
})();
