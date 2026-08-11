/* Показ случайной пословицы на главной странице.
 *
 * Данные лежат отдельно, в proverbs.js (константа PROVERBS) — так список
 * можно править, не трогая код. Оба файла подключаются в home.html,
 * сначала данные, потом этот файл.
 */
(function () {
  if (typeof PROVERBS === "undefined" || !PROVERBS.length) return;

  var slot = document.getElementById("proverb-somali");
  if (!slot) return;                     // на этой странице блока нет

  var p = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
  var put = function (id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = '“' + text + '”';
  };
  put("proverb-somali", p.somali);
  put("proverb-english", p.english);
  put("proverb-russian", p.russian);
})();
