/* Режим предложения правок + подсветка их состояния.
 *
 * Для кого: автор сайта получает ссылку вида
 *     https://www.kapchits.online/ru/#pravka=<токен>
 * После первого открытия токен сохраняется в браузере, адрес очищается,
 * и на каждой странице появляется пометка «Режим правок». Выделяешь текст —
 * всплывает кнопка «Предложить правку».
 *
 * Подсветка (только в режиме токена, чужие её не видят): скрипт читает тикеты
 * этой страницы из Issues репозитория и отмечает на странице
 *   — жёлтым  фрагменты с ОТКРЫТОЙ правкой (предложено, ещё не применено);
 *   — зелёным фрагменты с ЗАКРЫТОЙ правкой (уже применено), с прежним текстом
 *     в подсказке.
 * При повторном выделении такого фрагмента в диалоге показывается, что уже
 * предлагалось.
 *
 * Куда уходят правки: Issues приватного репозитория geedaha/kapchits через
 * GitHub API, прямо из браузера. Токен — fine-grained PAT только с правом
 * Issues на этот репозиторий. Сервера нет, сайт статический.
 *
 * Выключение: #pravka=off. Проверка вёрстки без токена: #pravka=test.
 */
(function () {
  "use strict";
  var KEY = "kapchits-pravka-token";
  var REPO = "geedaha/kapchits";

  var m = (location.hash + "&" + location.search).match(/[#?&]pravka=([^&]+)/);
  if (m) {
    var t = decodeURIComponent(m[1]);
    if (t === "off") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
    history.replaceState(null, "", location.pathname + location.search.replace(/[?&]pravka=[^&]+/, ""));
  }
  var token = localStorage.getItem(KEY);
  if (!token) return;
  var TEST = token === "test";

  /* --- пометка режима ------------------------------------------------ */
  var badge = document.createElement("div");
  badge.className = "pravka-badge";
  badge.innerHTML = "Режим правок" + (TEST ? " (проба)" : "") +
    ' · <a href="#" data-off>выключить</a>';
  badge.querySelector("[data-off]").addEventListener("click", function (e) {
    e.preventDefault(); localStorage.removeItem(KEY); location.reload();
  });

  var btn = document.createElement("button");
  btn.className = "pravka-btn"; btn.type = "button";
  btn.textContent = "Предложить правку"; btn.hidden = true;

  var current = null;   /* {text, prefix, suffix} */
  var known = [];       /* разобранные тикеты этой страницы */

  function onSelect() {
    var sel = window.getSelection();
    var text = sel ? String(sel).trim() : "";
    if (!text || text.length < 3 || sel.rangeCount === 0) { btn.hidden = true; return; }
    var r = sel.getRangeAt(0);
    if (badge.contains(r.startContainer) || dlg.contains(r.startContainer)) return;
    var prefix = "", suffix = "";
    if (r.startContainer.nodeType === 3)
      prefix = r.startContainer.textContent.slice(Math.max(0, r.startOffset - 60), r.startOffset);
    if (r.endContainer.nodeType === 3)
      suffix = r.endContainer.textContent.slice(r.endOffset, r.endOffset + 60);
    current = { text: text, prefix: prefix, suffix: suffix };
    var rect = r.getBoundingClientRect();
    btn.style.top = (window.scrollY + rect.bottom + 8) + "px";
    btn.style.left = Math.max(8, window.scrollX + rect.left) + "px";
    btn.hidden = false;
  }
  document.addEventListener("mouseup", function () { setTimeout(onSelect, 1); });
  document.addEventListener("touchend", function () { setTimeout(onSelect, 50); });

  /* --- диалог --------------------------------------------------------- */
  var dlg = document.createElement("dialog");
  dlg.className = "pravka-dialog";
  dlg.innerHTML =
    '<form method="dialog">' +
    '<h3>Предложить правку</h3>' +
    '<p class="pravka-hint" data-hint hidden></p>' +
    '<label>Выделено на странице:</label>' +
    '<blockquote data-quote></blockquote>' +
    '<label for="pravka-new">Как должно быть:</label>' +
    '<textarea id="pravka-new" rows="4"></textarea>' +
    '<label for="pravka-note">Пояснение (необязательно):</label>' +
    '<textarea id="pravka-note" rows="2"></textarea>' +
    '<div class="pravka-actions">' +
    '<button value="send" class="pravka-send">Отправить</button>' +
    '<button value="cancel" class="pravka-cancel" formnovalidate>Отмена</button>' +
    "</div>" +
    '<p class="pravka-status" data-status hidden></p>' +
    "</form>";

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  btn.addEventListener("click", function () {
    if (!current) return;
    btn.hidden = true;
    dlg.querySelector("[data-quote]").textContent = current.text;
    dlg.querySelector("#pravka-new").value = current.text;
    dlg.querySelector("#pravka-note").value = "";
    /* подсказка: не предлагали ли уже этот фрагмент */
    var hint = dlg.querySelector("[data-hint]"); hint.hidden = true; hint.textContent = "";
    var n = norm(current.text);
    for (var i = 0; i < known.length; i++) {
      var it = known[i];
      if (norm(it.oldText) === n || norm(it.newText) === n) {
        if (it.state === "open") {
          hint.textContent = "Здесь уже есть предложенная правка (#" + it.number + "): «" +
            it.newText + "»" + (it.note ? ". Пояснение: " + it.note : "");
          dlg.querySelector("#pravka-new").value = it.newText;
        } else {
          hint.textContent = "Здесь уже применена правка (#" + it.number + "). Прежде было: «" + it.oldText + "».";
        }
        hint.hidden = false; break;
      }
    }
    /* вернуть кнопки в исходное состояние (после прошлой отправки могли смениться) */
    dlg.querySelector(".pravka-send").hidden = false;
    dlg.querySelector(".pravka-cancel").textContent = "Отмена";
    setStatus(""); dlg.showModal();
  });

  function setStatus(msg, ok) {
    var el = dlg.querySelector("[data-status]");
    el.hidden = !msg; el.textContent = msg;
    el.className = "pravka-status" + (ok ? " ok" : "");
  }

  /* после успешной отправки: убрать «Отправить», «Отмену» сделать «Закрыть» */
  function done() {
    dlg.querySelector(".pravka-send").hidden = true;
    dlg.querySelector(".pravka-cancel").textContent = "Закрыть";
  }

  dlg.querySelector(".pravka-send").addEventListener("click", function (e) {
    e.preventDefault();
    var replacement = dlg.querySelector("#pravka-new").value.trim();
    var note = dlg.querySelector("#pravka-note").value.trim();
    var body =
      "### Страница\n" + location.href + "\n(" + document.title + ")\n\n" +
      "### Выделено\n> " + current.text.replace(/\n/g, "\n> ") + "\n\n" +
      "### Где искать\n…" + current.prefix + "【выделено】" + current.suffix + "…\n\n" +
      "### Как должно быть\n> " + (replacement || "(не указано)").replace(/\n/g, "\n> ") +
      (note ? "\n\n### Пояснение\n" + note : "") +
      "\n\n---\n*Отправлено со страницы " + new Date().toISOString() + "*";
    var title = "[Правка] " + document.title.replace(/ \| Kapchits\.Online$/, "");

    if (TEST) {
      console.log("ПРОБА, правка не отправлена:\n" + title + "\n\n" + body);
      setStatus("Проба: правка показана в консоли, никуда не отправлена.", true);
      done();
      return;
    }
    setStatus("Отправляю…");
    fetch("https://api.github.com/repos/" + REPO + "/issues", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
                 "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body })
    }).then(function (r) { return r.status === 201 ? r.json() : Promise.reject(r.status); })
      .then(function (issue) {
        setStatus("Спасибо! Правка отправлена и будет учтена.", true);
        done();
        /* сразу подсветить фрагмент жёлтым и запомнить */
        var it = { number: issue.number, state: "open", oldText: current.text,
                   newText: replacement, prefix: current.prefix, suffix: current.suffix, note: note };
        known.push(it); markFragment(it);
      })
      .catch(function (code) {
        setStatus(code === 401 || code === 403
          ? "Токен не подходит или устарел. Напишите Трофиму."
          : "Не отправилось" + (code ? " (ошибка " + code + ")" : "") + ". Попробуйте ещё раз.");
      });
  });

  /* --- подсветка состояния правок ------------------------------------ */
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"); }

  function markFragment(it) {
    var word = it.state === "open" ? it.oldText : it.newText;
    if (!word || word.length < 2) return false;
    var pre = it.prefix ? esc(it.prefix.replace(/^…/, "").slice(-30)) : "";
    var suf = it.suffix ? esc(it.suffix.replace(/…$/, "").slice(0, 30)) : "";
    var core = "(" + esc(word) + ")";
    var pats = [];
    if (pre || suf) { try { pats.push(new RegExp(pre + "\\s*" + core + "\\s*" + suf, "d")); } catch (e) {} }
    try { pats.push(new RegExp(core, "d")); } catch (e) {}
    var root = document.querySelector(".sec-content, .right-content, main") || document.body;
    for (var p = 0; p < pats.length; p++) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), node;
      while ((node = w.nextNode())) {
        if (node.parentNode && node.parentNode.closest &&
            node.parentNode.closest("mark.pravka-pending,mark.pravka-applied,.pravka-badge,.pravka-dialog,.pravka-btn")) continue;
        var mm = pats[p].exec(node.nodeValue);
        if (mm && mm.indices && mm.indices[1]) {
          var g = mm.indices[1];
          var range = document.createRange();
          range.setStart(node, g[0]); range.setEnd(node, g[1]);
          var mk = document.createElement("mark");
          mk.className = it.state === "open" ? "pravka-pending" : "pravka-applied";
          mk.title = it.state === "open"
            ? "Предложено (#" + it.number + "): " + it.newText + (it.note ? " — " + it.note : "")
            : "Применено (#" + it.number + "). Прежде было: " + it.oldText;
          try { range.surroundContents(mk); return true; } catch (e) { return false; }
        }
      }
    }
    return false;
  }

  function parseIssue(iss) {
    var b = iss.body || "";
    function sec(name) {
      var re = new RegExp("###\\s*" + name + "\\s*\\n([\\s\\S]*?)(?=\\n###|\\n---|$)");
      var mm = re.exec(b); return mm ? mm[1].trim() : "";
    }
    var page = sec("Страница").split("\n")[0].trim();
    var gde = sec("Где искать"), prefix = "", suffix = "";
    if (gde.indexOf("【выделено】") >= 0) {
      var parts = gde.split("【выделено】");
      prefix = parts[0].replace(/^…/, ""); suffix = (parts[1] || "").replace(/…$/, "");
    }
    return {
      number: iss.number, state: iss.state, page: page,
      oldText: sec("Выделено").replace(/^>\s?/gm, "").trim(),
      newText: sec("Как должно быть").replace(/^>\s?/gm, "").trim(),
      note: sec("Пояснение"), prefix: prefix, suffix: suffix
    };
  }

  function loadHighlights() {
    fetch("https://api.github.com/repos/" + REPO + "/issues?state=all&per_page=100", {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" }
    }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        (list || []).forEach(function (iss) {
          if (iss.pull_request) return;
          var it = parseIssue(iss);
          var samePage = false;
          try { samePage = new URL(it.page).pathname === location.pathname; } catch (e) {}
          if (!samePage) return;
          known.push(it);
          markFragment(it);
        });
      }).catch(function () {});
  }

  /* --- запуск -------------------------------------------------------- */
  function ready() {
    document.body.appendChild(badge);
    document.body.appendChild(btn);
    document.body.appendChild(dlg);
    if (TEST) return;
    fetch("https://api.github.com/repos/" + REPO, {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" }
    }).then(function (r) {
      if (!r.ok) { badge.firstChild.textContent = "Режим правок: токен не подходит "; badge.classList.add("bad"); return; }
      loadHighlights();
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
