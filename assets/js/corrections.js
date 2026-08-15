/* Режим предложения правок.
 *
 * Для кого: автор сайта получает ссылку вида
 *     https://www.kapchits.online/ru/#pravka=<токен>
 * После первого открытия токен сохраняется в браузере, адрес очищается,
 * и на каждой странице появляется пометка «Режим правок». Дальше достаточно
 * выделить текст — всплывёт кнопка «Предложить правку».
 *
 * Куда уходят правки: в Issues приватного репозитория geedaha/kapchits через
 * GitHub API, прямо из браузера. Токен — fine-grained PAT с единственным
 * правом Issues: Read and write на этот один репозиторий; сайт остаётся
 * статическим, сервера нет. Разбор правок — вручную, при обычном цикле деплоя.
 *
 * Выключение: открыть любую страницу с #pravka=off.
 * Проверка вёрстки без токена: #pravka=test — всё работает, но вместо
 * отправки пишет в консоль.
 */
(function () {
  "use strict";
  var KEY = "kapchits-pravka-token";
  var REPO = "geedaha/kapchits";

  /* --- токен из адресной строки ------------------------------------- */
  var m = (location.hash + "&" + location.search).match(/[#?&]pravka=([^&]+)/);
  if (m) {
    var t = decodeURIComponent(m[1]);
    if (t === "off") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
    /* подчистить адрес, чтобы токен не остался в истории и закладках */
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
    e.preventDefault();
    localStorage.removeItem(KEY);
    location.reload();
  });

  /* --- кнопка у выделения -------------------------------------------- */
  var btn = document.createElement("button");
  btn.className = "pravka-btn";
  btn.type = "button";
  btn.textContent = "Предложить правку";
  btn.hidden = true;

  var current = null; /* {text, prefix, suffix} */

  function onSelect() {
    var sel = window.getSelection();
    var text = sel ? String(sel).trim() : "";
    if (!text || text.length < 3 || sel.rangeCount === 0) { btn.hidden = true; return; }
    var r = sel.getRangeAt(0);
    /* пометку и диалог не считаем содержанием */
    if (badge.contains(r.startContainer) || dlg.contains(r.startContainer)) return;
    /* контекст берём только у текстовых узлов: у элементов offset —
       это номер дочернего узла, срез по нему даёт мусор */
    var prefix = "", suffix = "";
    if (r.startContainer.nodeType === 3) {
      prefix = r.startContainer.textContent.slice(Math.max(0, r.startOffset - 60), r.startOffset);
    }
    if (r.endContainer.nodeType === 3) {
      suffix = r.endContainer.textContent.slice(r.endOffset, r.endOffset + 60);
    }
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
    '<label>Выделено на странице:</label>' +
    '<blockquote data-quote></blockquote>' +
    '<label for="pravka-new">Как должно быть:</label>' +
    '<textarea id="pravka-new" rows="4"></textarea>' +
    '<label for="pravka-note">Пояснение (необязательно):</label>' +
    '<textarea id="pravka-note" rows="2"></textarea>' +
    '<div class="pravka-actions">' +
    '<button value="send" class="pravka-send">Отправить</button>' +
    '<button value="cancel" formnovalidate>Отмена</button>' +
    "</div>" +
    '<p class="pravka-status" data-status hidden></p>' +
    "</form>";

  btn.addEventListener("click", function () {
    if (!current) return;
    btn.hidden = true;
    dlg.querySelector("[data-quote]").textContent = current.text;
    dlg.querySelector("#pravka-new").value = current.text;
    dlg.querySelector("#pravka-note").value = "";
    setStatus("");
    dlg.showModal();
  });

  function setStatus(msg, ok) {
    var el = dlg.querySelector("[data-status]");
    el.hidden = !msg;
    el.textContent = msg;
    el.className = "pravka-status" + (ok ? " ok" : "");
  }

  dlg.addEventListener("close", function () {});
  dlg.querySelector(".pravka-send").addEventListener("click", function (e) {
    e.preventDefault();
    var replacement = dlg.querySelector("#pravka-new").value.trim();
    var note = dlg.querySelector("#pravka-note").value.trim();
    var body =
      "### Страница\n" + location.href + "\n" +
      "(" + document.title + ")\n\n" +
      "### Выделено\n> " + current.text.replace(/\n/g, "\n> ") + "\n\n" +
      "### Где искать\n…" + current.prefix + "【выделено】" + current.suffix + "…\n\n" +
      "### Как должно быть\n> " + (replacement || "(не указано)").replace(/\n/g, "\n> ") +
      (note ? "\n\n### Пояснение\n" + note : "") +
      "\n\n---\n*Отправлено со страницы " + new Date().toISOString() + "*";
    var title = "[Правка] " + document.title.replace(/ \| Kapchits\.Online$/, "");

    if (TEST) {
      console.log("ПРОБА, правка не отправлена:\n" + title + "\n\n" + body);
      setStatus("Проба: правка показана в консоли, никуда не отправлена.", true);
      return;
    }
    setStatus("Отправляю…");
    fetch("https://api.github.com/repos/" + REPO + "/issues", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: title, body: body })
    }).then(function (r) {
      if (r.status === 201) {
        setStatus("Спасибо! Правка отправлена и будет учтена.", true);
      } else if (r.status === 401 || r.status === 403) {
        setStatus("Токен не подходит или устарел. Напишите Трофиму.");
      } else {
        setStatus("Не отправилось (ошибка " + r.status + "). Попробуйте ещё раз.");
      }
    }).catch(function () {
      setStatus("Нет связи. Проверьте интернет и попробуйте ещё раз.");
    });
  });

  /* --- проверка токена при включении --------------------------------- */
  function ready() {
    document.body.appendChild(badge);
    document.body.appendChild(btn);
    document.body.appendChild(dlg);
    if (TEST) return;
    fetch("https://api.github.com/repos/" + REPO, {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" }
    }).then(function (r) {
      if (!r.ok) {
        badge.firstChild.textContent = "Режим правок: токен не подходит ";
        badge.classList.add("bad");
      }
    }).catch(function () { /* офлайн — проверим при отправке */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
